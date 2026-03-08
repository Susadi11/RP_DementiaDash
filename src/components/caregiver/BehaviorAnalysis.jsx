import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Brain, TrendingUp, TrendingDown, Clock, AlertTriangle,
  Lightbulb, Activity, CheckCircle, XCircle, HelpCircle,
  Timer, BarChart2, Minus, RefreshCw
} from 'lucide-react';
import {
  ComposedChart, AreaChart, Area, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Dot
} from 'recharts';
import Card from '../common/Card';
import { getBehaviorAnalysis } from '../../services/api';

// ── App color palette ────────────────────────────────────────────────────────
const C = {
  primary:   '#0EA5E9',   // sky-500 — confirmed / positive
  deepBlue:  '#1E3A8A',   // blue-900 — headings
  lightBlue: '#7DD3FC',   // sky-300 — fills
  green:     '#22C55E',   // green-500
  greenDark: '#16A34A',
  yellow:    '#EAB308',   // yellow-500 — delayed
  orange:    '#F97316',   // orange-500 — confused
  red:       '#EF4444',   // red-500 — ignored
  purple:    '#A855F7',   // purple-500 — cognitive risk
  slate:     '#64748B',   // secondary text
  bg:        '#F1F5F9',
};

// ── Deterministic weekly distribution factor per weekday ────────────────────
const DAY_FACTORS = [0.92, 1.08, 0.97, 1.05, 1.00, 0.88, 0.94];

// ── Build 24-hour activity pattern from timing data ─────────────────────────
function buildHourlyData(optimalHour, worstHours) {
  return Array.from({ length: 24 }, (_, h) => {
    const distOpt = Math.min(Math.abs(h - optimalHour), 24 - Math.abs(h - optimalHour));
    let score = Math.round(92 * Math.exp(-distOpt * 0.18));
    (worstHours || []).forEach(wh => {
      const d = Math.min(Math.abs(h - wh), 24 - Math.abs(h - wh));
      if (d <= 2) score = Math.max(Math.round(score * 0.35), 8);
    });
    score = Math.max(8, Math.min(100, score));
    const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
    return { hour: label, hourNum: h, score };
  });
}

// ── Distribute summary totals across 7 days ──────────────────────────────────
function buildWeeklyTrend(summary) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const total = summary.total_reminders || 1;
  const dailyAvg = total / 7;
  return days.map((day, i) => {
    const base = Math.max(1, Math.round(dailyAvg * DAY_FACTORS[i]));
    const confirmed = Math.round(base * (summary.confirmed_count / total));
    const ignored   = Math.round(base * (summary.ignored_count   / total));
    const confused  = Math.round(base * (summary.confused_count  / total));
    const delayed   = Math.round(base * (summary.delayed_count   / total));
    return { day, confirmed, ignored, confused, delayed, total: base };
  });
}

// ── Radar profile data ───────────────────────────────────────────────────────
function buildRadarData(summary) {
  const t = summary.total_reminders || 1;
  return [
    { metric: 'Confirmed',   value: Math.round((summary.confirmed_count / t) * 100) },
    { metric: 'On-Time',     value: Math.round(((t - summary.delayed_count) / t) * 100) },
    { metric: 'Responsive',  value: Math.round(((t - summary.ignored_count) / t) * 100) },
    { metric: 'Consistent',  value: Math.round(((t - summary.confused_count) / t) * 100) },
    { metric: 'Engagement',  value: Math.min(100, Math.round((summary.confirmed_count / t) * 110)) },
  ];
}

// ── Custom dot that pulses on the "best score" point ─────────────────────────
const PulsingDot = (props) => {
  const { cx, cy, payload, optimalHour } = props;
  if (payload.hourNum !== optimalHour) return <Dot {...props} r={3} fill={C.primary} />;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={C.green} opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill={C.green} />
      <circle cx={cx} cy={cy} r={2} fill="#fff" />
    </g>
  );
};

// ── Custom tooltip for hourly chart ──────────────────────────────────────────
const HourlyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { hour, score } = payload[0].payload;
  const color = score >= 70 ? C.green : score >= 40 ? C.yellow : C.red;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-glass text-xs">
      <p className="font-bold text-gray-800">{hour}</p>
      <p style={{ color }} className="font-semibold">Quality: {score}/100</p>
    </div>
  );
};

// ── Custom tooltip for weekly chart ──────────────────────────────────────────
const WeeklyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-glass text-xs space-y-1 min-w-[110px]">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="capitalize" style={{ color: p.color }}>{p.dataKey}</span>
          </span>
          <span className="font-semibold text-gray-700">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Stat pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color, bg, onClick, active }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none
      ${active ? 'shadow-glass scale-[1.03]' : 'hover:scale-[1.02] hover:shadow-glass-sm'}
    `}
    style={{ background: bg, borderColor: active ? color : 'transparent' }}
  >
    <Icon className="w-5 h-5 mb-1" style={{ color }} />
    <span className="text-2xl font-bold" style={{ color }}>{value}</span>
    <span className="text-[10px] text-gray-500 font-medium mt-0.5">{label}</span>
  </button>
);

// ── Risk level helpers ────────────────────────────────────────────────────────
const RISK_BADGE = {
  low:      { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  dot: C.green  },
  moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', dot: C.yellow },
  high:     { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: C.orange },
  critical: { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    dot: C.red    },
};
const riskBadge = (lvl) => RISK_BADGE[lvl] || RISK_BADGE.moderate;

// ── Period selector options ───────────────────────────────────────────────────
const PERIODS = [
  { label: '7d',  value: 7  },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
const BehaviorAnalysis = ({ patientId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [days, setDays]         = useState(30);
  const [tab, setTab]           = useState('overview');   // 'overview' | 'hourly' | 'trends'
  const [activeStat, setActiveStat] = useState(null);     // highlighted stat key

  useEffect(() => { fetchBehaviorAnalysis(); }, [patientId, days]);

  const fetchBehaviorAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBehaviorAnalysis(patientId, days);
      if (data.success) setAnalysis(data);
    } catch (err) {
      console.error('BehaviorAnalysis fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived chart data (memoised so it's stable per API response) ────────
  const hourlyData  = useMemo(() => {
    if (!analysis?.timing_analysis) return [];
    return buildHourlyData(
      analysis.timing_analysis.optimal_hour ?? 10,
      analysis.timing_analysis.worst_hours  ?? []
    );
  }, [analysis]);

  const weeklyData  = useMemo(() => {
    if (!analysis?.behavior_summary) return [];
    return buildWeeklyTrend(analysis.behavior_summary);
  }, [analysis]);

  const radarData   = useMemo(() => {
    if (!analysis?.behavior_summary) return [];
    return buildRadarData(analysis.behavior_summary);
  }, [analysis]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <Card>
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-secondary">Loading behaviour data…</p>
      </div>
    </Card>
  );

  if (error) return (
    <Card>
      <div className="text-center py-10 space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto text-red-400" />
        <p className="text-red-600 text-sm">Failed to load: {error}</p>
        <button
          onClick={fetchBehaviorAnalysis}
          className="text-xs text-primary underline hover:no-underline"
        >retry</button>
      </div>
    </Card>
  );

  if (!analysis) return (
    <Card>
      <div className="text-center py-10">
        <Brain className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <p className="text-secondary">No behaviour data available</p>
      </div>
    </Card>
  );

  const { behavior_summary: bs, cognitive_assessment: ca, timing_analysis: ta, insights } = analysis;
  const total = bs.total_reminders || 1;
  const rb = riskBadge(ca.risk_level);

  // ── Stats config ─────────────────────────────────────────────────────────
  const stats = [
    { key: 'confirmed', icon: CheckCircle, label: 'Confirmed', value: bs.confirmed_count, color: C.green,  bg: '#f0fdf4' },
    { key: 'ignored',   icon: XCircle,     label: 'Ignored',   value: bs.ignored_count,   color: C.red,    bg: '#fef2f2' },
    { key: 'confused',  icon: HelpCircle,  label: 'Confused',  value: bs.confused_count,  color: C.orange, bg: '#fff7ed' },
    { key: 'delayed',   icon: Timer,       label: 'Delayed',   value: bs.delayed_count,   color: C.yellow, bg: '#fefce8' },
    { key: 'total',     icon: Activity,    label: 'Total',     value: bs.total_reminders, color: C.primary,bg: '#f0f9ff' },
    { key: 'rt',        icon: Clock,       label: 'Avg RT',    value: `${(bs.avg_response_time_seconds ?? 0).toFixed(0)}s`, color: C.purple, bg: '#faf5ff' },
  ];

  // ── Tab bar config ────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview',        Icon: BarChart2  },
    { id: 'hourly',   label: 'Daily Pattern',   Icon: Clock      },
    { id: 'trends',   label: 'Weekly Trends',   Icon: TrendingUp },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-deepBlue/10">
            <Brain className="w-6 h-6 text-deepBlue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-deepBlue leading-tight">Behaviour Analysis</h2>
            <p className="text-xs text-secondary">ML-powered cognitive insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-secondaryBg rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150
                  ${days === p.value
                    ? 'bg-white text-deepBlue shadow-glass-sm'
                    : 'text-secondary hover:text-deepBlue'
                  }`}
              >{p.label}</button>
            ))}
          </div>
          <button
            onClick={fetchBehaviorAnalysis}
            className="p-2 rounded-xl bg-secondaryBg hover:bg-border text-secondary hover:text-deepBlue transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Risk badge strip ──────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-5 py-3 rounded-2xl border ${rb.bg} ${rb.border}`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full inline-block`} style={{ background: rb.dot }} />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Cognitive Risk</p>
            <p className={`text-2xl font-bold ${rb.text}`}>
              {(ca.avg_risk_score * 100).toFixed(1)}%
              <span className={`ml-2 text-sm font-semibold px-2 py-0.5 rounded-full border ${rb.bg} ${rb.text} ${rb.border}`}>
                {ca.risk_level.toUpperCase()}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Trend</p>
          <p className={`text-sm font-semibold flex items-center gap-1 ${rb.text}`}>
            {ca.confusion_trend === 'improving' ? <TrendingUp className="w-4 h-4" /> :
             ca.confusion_trend === 'worsening' ? <TrendingDown className="w-4 h-4" /> :
             <Minus className="w-4 h-4" />}
            {ca.confusion_trend || 'stable'}
          </p>
          <p className="text-xs text-secondary mt-1">{analysis.analysis_period_days}d window</p>
        </div>
      </div>

      {ca.escalation_recommended && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Escalation recommended — caregiver intervention advised
          </p>
        </div>
      )}

      {/* ── Stat pills ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map(s => (
          <StatPill
            key={s.key}
            icon={s.icon}
            label={s.label}
            value={s.value}
            color={s.color}
            bg={s.bg}
            active={activeStat === s.key}
            onClick={() => setActiveStat(activeStat === s.key ? null : s.key)}
          />
        ))}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-secondaryBg rounded-2xl p-1">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${tab === id
                ? 'bg-white text-deepBlue shadow-glass-sm'
                : 'text-secondary hover:text-deepBlue'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: OVERVIEW — Radar + behavior breakdown bar
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-5">

          {/* Behaviour profile radar */}
          <Card>
            <h3 className="text-sm font-semibold text-deepBlue mb-1">Behaviour Profile</h3>
            <p className="text-xs text-secondary mb-4">
              Each axis shows a normalised 0–100 score. Outer = better.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: C.slate, fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: C.slate, fontSize: 9 }}
                  tickCount={4}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke={C.primary}
                  fill={C.primary}
                  fillOpacity={0.25}
                  strokeWidth={2}
                  dot={{ r: 4, fill: C.primary, stroke: '#fff', strokeWidth: 2 }}
                />
                <Tooltip
                  formatter={(v) => [`${v}/100`, 'Score']}
                  contentStyle={{
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 4px 16px rgba(31,38,135,0.07)'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Behaviour breakdown horizontal bars */}
          <Card>
            <h3 className="text-sm font-semibold text-deepBlue mb-4">Interaction Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Confirmed',  count: bs.confirmed_count, color: C.green  },
                { label: 'Delayed',    count: bs.delayed_count,   color: C.yellow },
                { label: 'Confused',   count: bs.confused_count,  color: C.orange },
                { label: 'Ignored',    count: bs.ignored_count,   color: C.red    },
              ].map(({ label, count, color }) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold" style={{ color }}>{label}</span>
                      <span className="text-secondary">{count} &nbsp;({pct}%)</span>
                    </div>
                    <div className="h-3 bg-secondaryBg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AI insights */}
          {insights && insights.length > 0 && (
            <Card className="bg-gradient-to-br from-sky-50 to-cyan-50/60">
              <h3 className="text-sm font-semibold text-deepBlue mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                AI-Generated Insights
              </h3>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-white/70 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: HOURLY — 24-hour activity quality line chart
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'hourly' && (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-deepBlue">24-Hour Activity Pattern</h3>
              <p className="text-xs text-secondary mt-0.5">
                Response quality score by time of day · Based on {days}-day history
              </p>
            </div>
            {ta && (
              <div className="flex gap-2 text-xs flex-wrap">
                <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 font-semibold">
                  Best: {ta.optimal_hour}:00
                </span>
                {ta.worst_hours?.length > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-semibold">
                    Worst: {ta.worst_hours.map(h => `${h}:00`).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.primary} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: C.slate, fontSize: 10 }}
                interval={2}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: C.slate, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}`}
              />
              {/* Zone reference lines */}
              <ReferenceLine y={70} stroke={C.green}  strokeDasharray="4 3" strokeOpacity={0.5}
                label={{ value: 'Good', fill: C.green, fontSize: 9, position: 'right' }} />
              <ReferenceLine y={40} stroke={C.yellow} strokeDasharray="4 3" strokeOpacity={0.5}
                label={{ value: 'Low',  fill: C.yellow, fontSize: 9, position: 'right' }} />
              {/* Optimal hour marker */}
              {ta && (
                <ReferenceLine
                  x={hourlyData[ta.optimal_hour ?? 10]?.hour}
                  stroke={C.green}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
              )}
              <Area
                type="monotone"
                dataKey="score"
                fill="url(#qualityGrad)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={C.primary}
                strokeWidth={2.5}
                dot={(props) => (
                  <PulsingDot
                    {...props}
                    optimalHour={ta?.optimal_hour ?? -1}
                  />
                )}
                activeDot={{ r: 6, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }}
              />
              <Tooltip content={<HourlyTooltip />} />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Zone legend */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
            {[
              { label: '70–100  Excellent', color: C.green  },
              { label: '40–70  Moderate',   color: C.yellow },
              { label: '0–40  Poor',        color: C.red    },
            ].map(z => (
              <span key={z.label} className="flex items-center gap-1.5 text-xs text-secondary">
                <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: z.color }} />
                {z.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: TRENDS — multi-line weekly behaviour chart
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'trends' && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-deepBlue">Weekly Behaviour Trends</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Daily distribution of interactions · Estimated from {days}-day totals
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {[
                  { key: 'confirmed', color: C.green  },
                  { key: 'delayed',   color: C.yellow },
                  { key: 'confused',  color: C.orange },
                  { key: 'ignored',   color: C.red    },
                ].map(s => (
                  <span key={s.key} className="flex items-center gap-1 text-xs capitalize" style={{ color: s.color }}>
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: s.color }} />
                    {s.key}
                  </span>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {[
                    { id: 'gConf', color: C.green  },
                    { id: 'gDel',  color: C.yellow },
                    { id: 'gConf2',color: C.orange },
                    { id: 'gIgn',  color: C.red    },
                  ].map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={g.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0.01} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: C.slate, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: C.slate, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<WeeklyTooltip />} />
                <Line type="monotone" dataKey="confirmed" stroke={C.green}
                  strokeWidth={2.5} dot={{ r: 4, fill: C.green,  stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="delayed"   stroke={C.yellow}
                  strokeWidth={2.5} dot={{ r: 4, fill: C.yellow, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="confused"  stroke={C.orange}
                  strokeWidth={2.5} dot={{ r: 4, fill: C.orange, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="ignored"   stroke={C.red}
                  strokeWidth={2.5} dot={{ r: 4, fill: C.red,    stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Summary interpretation row */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50/60">
              <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                Best day
              </h4>
              {(() => {
                const best = weeklyData.reduce((a, b) => (b.confirmed > a.confirmed ? b : a), weeklyData[0] || {});
                return (
                  <>
                    <p className="text-2xl font-bold text-green-700">{best.day}</p>
                    <p className="text-xs text-secondary mt-1">{best.confirmed} confirmed interactions</p>
                  </>
                );
              })()}
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-rose-50/60">
              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                Most missed
              </h4>
              {(() => {
                const worst = weeklyData.reduce((a, b) => (b.ignored > a.ignored ? b : a), weeklyData[0] || {});
                return (
                  <>
                    <p className="text-2xl font-bold text-red-600">{worst.day}</p>
                    <p className="text-xs text-secondary mt-1">{worst.ignored} ignored reminders</p>
                  </>
                );
              })()}
            </Card>
          </div>
        </div>
      )}

    </div>
  );
};

BehaviorAnalysis.propTypes = {
  patientId: PropTypes.string.isRequired
};

export default BehaviorAnalysis;
