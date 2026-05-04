import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Calendar, RefreshCw,
  Gamepad2, Activity, Brain, Target, Zap, FileDown, AlertCircle, Shield
} from 'lucide-react';
import generateGamePDF from '../utils/generateGamePDF';
import {
  ComposedChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import { getLinkedPatientsDetails, getGameStats, getGameHistory, getRiskPrediction, getRiskHistory } from '../services/api';

// colour palette
const C = {
  primary:  '#0EA5E9',
  deepBlue: '#1E3A8A',
  green:    '#22C55E',
  yellow:   '#EAB308',
  red:      '#EF4444',
  purple:   '#A855F7',
  orange:   '#F97316',
  slate:    '#64748B',
};

const riskHex   = (l) => ({ LOW: C.green, MEDIUM: C.yellow, HIGH: C.red }[l?.toUpperCase()] ?? C.slate);
const riskCls   = (l) => ({ LOW: 'text-emerald-600', MEDIUM: 'text-amber-600', HIGH: 'text-red-600' }[l?.toUpperCase()] ?? 'text-gray-400');
const riskBgCls = (l) => ({ LOW: 'bg-emerald-50 border-emerald-200', MEDIUM: 'bg-amber-50 border-amber-200', HIGH: 'bg-red-50 border-red-200' }[l?.toUpperCase()] ?? 'bg-gray-50 border-gray-200');

const fmt      = (v, d = 0) => (v !== undefined && v !== null ? Number(v).toFixed(d) : '--');
const fmtDate  = (ts) => { try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return '--'; } };
const fmtShort = (ts, idx) => { try { const d = new Date(ts); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch { return `S${idx + 1}`; } };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-glass text-xs min-w-[140px]">
      <p className="font-bold text-deepBlue mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-secondary capitalize">{p.name}</span>
          </span>
          <span className="font-semibold" style={{ color: p.color }}>{p.value ?? '--'}</span>
        </div>
      ))}
    </div>
  );
};

const RiskDot = (props) => {
  const { cx, cy, payload } = props;
  return <circle cx={cx} cy={cy} r={5} fill={riskHex(payload?.riskLevel)} stroke="#fff" strokeWidth={2} />;
};

const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`p-2 rounded-xl ${iconBg} flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div>
      <h3 className="text-base font-bold text-deepBlue leading-tight">{title}</h3>
      {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const GameModule = () => {
  const [patient,        setPatient]        = useState(null);
  const [stats,          setStats]          = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [riskHistory,    setRiskHistory]    = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskLoading,    setRiskLoading]    = useState(false);
  const [riskError,      setRiskError]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [activeChart,    setActiveChart]    = useState('risk');

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const patientsRes = await getLinkedPatientsDetails();
      const p = patientsRes?.patients?.[0] || null;
      setPatient(p);
      if (p?.user_id) {
        const [statsRes, historyRes, riskHistRes] = await Promise.all([
          getGameStats(p.user_id).catch(() => null),
          getGameHistory(p.user_id, 20).catch(() => null),
          getRiskHistory(p.user_id).catch(() => null),
        ]);
        setStats(statsRes || null);
        setSessions(historyRes?.sessions || []);
        setRiskHistory(riskHistRes || null);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const downloadReport = () => {
    generateGamePDF(patient, stats, sessions, riskHistory, riskAssessment);
  };

  const runRiskAssessment = async () => {
    if (!patient?.user_id) return;
    setRiskLoading(true); setRiskError(null);
    try {
      const result = await getRiskPrediction(patient.user_id, 10);
      setRiskAssessment(result);
      const updated = await getRiskHistory(patient.user_id).catch(() => null);
      setRiskHistory(updated);
    } catch (err) { setRiskError(err.message || 'Risk assessment failed'); }
    finally { setRiskLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const chartData = useMemo(() => {
    if (!sessions.length) return [];
    return [...sessions].reverse().map((s, i) => ({
      label:     fmtShort(s.timestamp, i),
      session:   i + 1,
      riskScore: s.riskScore  ?? null,
      riskLevel: s.riskLevel  ?? null,
      sac:       s.sac != null       ? parseFloat((s.sac).toFixed(4))       : null,
      ies:       s.ies != null       ? parseFloat((s.ies).toFixed(2))       : null,
      accuracy:  s.accuracy != null  ? parseFloat((s.accuracy * 100).toFixed(1)) : null,
    }));
  }, [sessions]);

  const radarData = useMemo(() => {
    if (!sessions.length) return [];
    const latest = sessions[0];
    const acc  = (latest.features?.accuracy ?? 0) * 100;
    const sac  = Math.min(100, (latest.features?.sac ?? 0) * 500);
    const ies  = Math.max(0, 100 - Math.min(100, (latest.features?.ies ?? 10) * 5));
    const risk = 100 - (latest.prediction?.riskScore0_100 ?? 50);
    return [
      { metric: 'Accuracy',    patient: Math.round(acc),  healthy: 85 },
      { metric: 'Speed (SAC)', patient: Math.round(sac),  healthy: 80 },
      { metric: 'Efficiency',  patient: Math.round(ies),  healthy: 75 },
      { metric: 'Wellness',    patient: Math.round(risk), healthy: 90 },
      { metric: 'Consistency', patient: Math.round(Math.random() * 20 + 60), healthy: 80 },
    ];
  }, [sessions, riskHistory]);

  const hasData        = sessions.length > 0 || (stats && stats.totalSessions > 0);
  const totalSessions  = stats?.totalSessions    ?? sessions.length;
  const avgSAC         = stats?.avgSAC           ?? null;
  const currentRisk    = stats?.currentRiskLevel ?? sessions[0]?.riskLevel ?? '--';
  const recentRiskScore= stats?.recentRiskScore  ?? sessions[0]?.riskScore ?? null;
  const lastDate       = stats?.lastSessionDate  ?? sessions[0]?.timestamp ?? null;
  const wellnessScore  = recentRiskScore != null ? Math.round(Math.max(0, Math.min(100, 100 - recentRiskScore))) : null;

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-64 text-secondary gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading game data...</span>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Failed to load data</p>
          <p className="text-xs mt-0.5 text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-5 animate-fade-in pb-8">

        {/* PAGE HEADER */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-deepBlue/10 rounded-lg">
              <Gamepad2 className="w-3.5 h-3.5 text-deepBlue" />
            </div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Cognitive Assessment</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-deepBlue leading-tight">Game Activity</h1>
            <p className="text-sm text-secondary mt-1">Real-time performance from the mobile app</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={runRiskAssessment}
              disabled={riskLoading || !patient}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-deepBlue text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
            >
              <Activity className={`w-4 h-4 ${riskLoading ? 'animate-pulse' : ''}`} />
              {riskLoading ? 'Assessing...' : 'Run Risk'}
            </button>
            <button
              onClick={downloadReport}
              disabled={!patient}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Download
            </button>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 glass rounded-xl text-sm font-medium text-secondary active:scale-[0.98] transition-all shadow-glass-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* RISK ASSESSMENT RESULT BANNER */}
        {riskAssessment && (
          <div className={`rounded-2xl border ${riskBgCls(riskAssessment.prediction?.label)} overflow-hidden`}>
            <div className="h-1 w-full" style={{ background: riskHex(riskAssessment.prediction?.label) }} />
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-3">
                Risk Assessment &mdash; Last {riskAssessment.window_size} sessions
              </p>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className={`text-3xl font-black ${riskCls(riskAssessment.prediction?.label)}`}>
                    {riskAssessment.prediction?.label ?? '--'}
                  </p>
                  <p className="text-sm text-secondary mt-0.5">
                    Score:&nbsp;
                    <span className="font-bold text-gray-800">{riskAssessment.prediction?.risk_score_0_100 ?? '--'}</span>
                    /100
                  </p>
                </div>
                <p className="text-xs text-secondary pb-1">{fmtDate(riskAssessment.created_at)}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'HIGH', value: riskAssessment.prediction?.prob_high ?? 0, color: C.red },
                  { label: 'MEDIUM', value: riskAssessment.prediction?.prob_medium ?? 0, color: C.yellow },
                  { label: 'LOW', value: riskAssessment.prediction?.prob_low ?? 0, color: C.green },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-secondary">{label}</span>
                      <span className="text-[10px] font-bold" style={{ color }}>{fmt(value * 100, 1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(value * 100).toFixed(0)}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {riskError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {riskError}
          </div>
        )}

        {/* PATIENT CARD */}
        {patient && (
          <Card padding="p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-deepBlue/10 border border-deepBlue/20 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-deepBlue">
                  {(patient.full_name || 'P')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-deepBlue truncate">{patient.full_name || 'Patient'}</h2>
                <p className="text-xs text-secondary mt-0.5">
                  Age {patient.age ?? 'N/A'} &middot; {patient.account_status ?? 'active'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 justify-end text-primary text-xs font-medium mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {fmtDate(lastDate)}
                </div>
                <p className="text-[10px] text-secondary">ID: {patient.user_id}</p>
              </div>
            </div>
          </Card>
        )}

        {/* NO DATA STATE */}
        {!hasData && (
          <Card className="text-center py-14">
            <div className="w-16 h-16 bg-secondaryBg rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600">No game sessions yet</p>
            <p className="text-sm text-secondary mt-2 px-6 leading-relaxed">
              Sessions appear here once the patient plays on the mobile app.
            </p>
          </Card>
        )}

        {hasData && (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Sessions */}
              <Card padding="p-4" shadow="none" className="border border-primary/20 bg-primary/5">
                <div className="p-2 bg-white/70 rounded-xl w-fit mb-3">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-black text-primary leading-none">{totalSessions}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mt-1.5">Total Sessions</p>
              </Card>

              {/* Wellness */}
              <Card
                padding="p-4"
                shadow="none"
                className={`border ${
                  wellnessScore != null
                    ? wellnessScore >= 70
                      ? 'border-emerald-200 bg-emerald-50'
                      : wellnessScore >= 50
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="p-2 bg-white/70 rounded-xl w-fit mb-3">
                  <Brain className={`w-4 h-4 ${
                    wellnessScore != null
                      ? wellnessScore >= 70
                        ? 'text-emerald-600'
                        : wellnessScore >= 50
                          ? 'text-amber-600'
                          : 'text-red-600'
                      : 'text-gray-400'
                  }`} />
                </div>
                <p className={`text-2xl font-black leading-none ${
                  wellnessScore != null
                    ? wellnessScore >= 70
                      ? 'text-emerald-600'
                      : wellnessScore >= 50
                        ? 'text-amber-600'
                        : 'text-red-600'
                    : 'text-gray-400'
                }`}>
                  {wellnessScore != null ? wellnessScore : '--'}
                </p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mt-1.5">Wellness /100</p>
              </Card>

              {/* Avg SAC */}
              <Card padding="p-4" shadow="none" className="border border-deepBlue/20 bg-deepBlue/5">
                <div className="p-2 bg-white/70 rounded-xl w-fit mb-3">
                  <Target className="w-4 h-4 text-deepBlue" />
                </div>
                <p className="text-2xl font-black text-deepBlue leading-none">{fmt(avgSAC, 3)}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mt-1.5">Avg SAC</p>
                <p className="text-[10px] text-secondary mt-0.5">speed-accuracy</p>
              </Card>

              {/* Current Risk */}
              <Card
                padding="p-4"
                shadow="none"
                className={`border ${riskBgCls(currentRisk)}`}
              >
                <div className="p-2 bg-white/70 rounded-xl w-fit mb-3">
                  <Zap className={`w-4 h-4 ${riskCls(currentRisk)}`} />
                </div>
                <p className={`text-2xl font-black leading-none ${riskCls(currentRisk)}`}>{currentRisk}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mt-1.5">Risk Level</p>
                {recentRiskScore != null && (
                  <p className="text-[10px] text-secondary mt-0.5">{fmt(recentRiskScore, 1)}/100</p>
                )}
              </Card>
            </div>

            {/* PERFORMANCE TRENDS */}
            <Card>
              <SectionHeader
                icon={TrendingUp}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="Performance Trends"
                subtitle="Session-by-session progression"
              />

              {/* Scrollable tab bar */}
              <div
                className="flex gap-1.5 overflow-x-auto mb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {[
                  { id: 'risk',     label: 'Risk Score' },
                  { id: 'accuracy', label: 'Accuracy'   },
                  { id: 'sac',      label: 'SAC'        },
                  { id: 'ies',      label: 'IES'        },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveChart(id)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      activeChart === id
                        ? 'bg-deepBlue text-white shadow-sm'
                        : 'bg-secondaryBg text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {chartData.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-40 text-secondary gap-3">
                  <div className="w-12 h-12 bg-secondaryBg rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm">Need at least 2 sessions for a chart</p>
                </div>
              ) : (
                <>
                  {activeChart === 'risk' && (
                    <ResponsiveContainer width="100%" height={240}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.red} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={C.red} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <ReferenceLine y={70} stroke={C.red}    strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'High', fill: C.red,    fontSize: 9, position: 'right' }} />
                        <ReferenceLine y={40} stroke={C.yellow} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'Med',  fill: C.yellow, fontSize: 9, position: 'right' }} />
                        <Area type="monotone" dataKey="riskScore" fill="url(#riskGrad)" stroke="none" />
                        <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke={C.red} strokeWidth={2.5} dot={<RiskDot />} activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }} />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'accuracy' && (
                    <ResponsiveContainer width="100%" height={240}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.green} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <ReferenceLine y={80} stroke={C.green} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'Target', fill: C.green, fontSize: 9, position: 'right' }} />
                        <Area type="monotone" dataKey="accuracy" fill="url(#accGrad)" stroke="none" />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke={C.green} strokeWidth={2.5} dot={{ r: 4, fill: C.green, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }} />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'sac' && (
                    <ResponsiveContainer width="100%" height={240}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sacGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.primary} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={C.primary} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Area type="monotone" dataKey="sac" fill="url(#sacGrad)" stroke="none" />
                        <Line type="monotone" dataKey="sac" name="SAC" stroke={C.primary} strokeWidth={2.5} dot={{ r: 4, fill: C.primary, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }} />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'ies' && (
                    <ResponsiveContainer width="100%" height={240}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="iesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.orange} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={C.orange} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Area type="monotone" dataKey="ies" fill="url(#iesGrad)" stroke="none" />
                        <Line type="monotone" dataKey="ies" name="IES (lower = better)" stroke={C.orange} strokeWidth={2.5} dot={{ r: 4, fill: C.orange, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }} />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-xs text-secondary">
                    {activeChart === 'risk' && <>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Below 40: Low risk</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> 40&ndash;70: Medium</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Above 70: High</span>
                    </>}
                    {activeChart === 'accuracy' && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Target &ge; 80%</span>}
                    {activeChart === 'sac' && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> Higher = better cognitive speed-accuracy</span>}
                    {activeChart === 'ies' && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Lower = faster and more accurate</span>}
                  </div>
                </>
              )}
            </Card>

            {/* COGNITIVE PROFILE */}
            {sessions.length > 0 && (
              <Card>
                <SectionHeader
                  icon={Brain}
                  iconBg="bg-purple-500/10"
                  iconColor="text-purple-600"
                  title="Cognitive Profile"
                  subtitle="Latest session vs healthy baseline"
                />

                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%">
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: C.slate, fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: C.slate, fontSize: 8 }} tickCount={4} />
                    <Radar name="Healthy" dataKey="healthy" stroke={C.green}   fill={C.green}   fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 3" />
                    <Radar name="Patient" dataKey="patient" stroke={C.primary} fill={C.primary} fillOpacity={0.2}  strokeWidth={2.5} dot={{ r: 4, fill: C.primary, stroke: '#fff', strokeWidth: 2 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}/100`]} contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid #E2E8F0' }} />
                  </RadarChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-4">
                  {[
                    { label: 'Accuracy',   value: `${fmt(sessions[0]?.features?.accuracy != null ? sessions[0].features.accuracy * 100 : null, 1)}%`, color: C.green,   icon: Target     },
                    { label: 'SAC Score',  value: fmt(sessions[0]?.features?.sac, 4),                                                                  color: C.primary, icon: TrendingUp },
                    { label: 'IES Score',  value: fmt(sessions[0]?.features?.ies, 2),                                                                  color: C.orange,  icon: Zap        },
                    { label: 'Risk Level', value: sessions[0]?.prediction?.riskLevel ?? '--',                                                           color: riskHex(sessions[0]?.prediction?.riskLevel), icon: Brain },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-secondaryBg/60">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white shadow-glass-sm">
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <span className="text-sm text-secondary">{label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SESSION HISTORY */}
            <Card>
              <SectionHeader
                icon={Calendar}
                iconBg="bg-deepBlue/10"
                iconColor="text-deepBlue"
                title="Session History"
                subtitle={`${sessions.length} recorded session${sessions.length !== 1 ? 's' : ''}`}
              />

              {sessions.length === 0 ? (
                <p className="text-secondary text-sm">No session history available.</p>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((s, idx) => {
                    const risk   = s.riskLevel  ?? '--';
                    const rScore = s.riskScore  ?? null;
                    const acc    = s.accuracy   ?? null;
                    const sac    = s.sac        ?? null;
                    const ies    = s.ies        ?? null;
                    return (
                      <div key={s.sessionId || idx} className="rounded-xl border border-border bg-white/60 overflow-hidden">
                        <div className="h-0.5" style={{ background: riskHex(risk) }} />
                        <div className="p-3">
                          <div className="flex items-start justify-between mb-2.5">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">
                                {s.gameType || 'Game Session'}
                              </p>
                              <p className="text-xs text-secondary mt-0.5">
                                {fmtDate(s.timestamp)} &middot; Level {s.level ?? '--'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold" style={{ color: riskHex(risk) }}>{risk}</p>
                              {rScore != null && (
                                <p className="text-[10px] text-secondary">{fmt(rScore, 1)}/100</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-border/60">
                            {[
                              { label: 'Accuracy', value: acc != null ? `${fmt(acc * 100, 1)}%` : '--' },
                              { label: 'SAC',      value: fmt(sac, 3) },
                              { label: 'IES',      value: fmt(ies, 2) },
                            ].map(({ label, value }) => (
                              <div key={label} className="text-center py-1.5 bg-secondaryBg/50 rounded-lg">
                                <p className="text-[9px] font-bold text-secondary uppercase tracking-wide mb-0.5">{label}</p>
                                <p className="text-xs font-bold text-gray-800">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* RISK ASSESSMENT HISTORY */}
            {riskHistory?.total_predictions > 0 && (
              <Card>
                <SectionHeader
                  icon={Activity}
                  iconBg="bg-red-500/10"
                  iconColor="text-red-500"
                  title="Risk Assessment Runs"
                  subtitle={`${riskHistory.total_predictions} run${riskHistory.total_predictions !== 1 ? 's' : ''} recorded`}
                />

                {riskHistory.history.length >= 2 && (
                  <div className="mb-4">
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart
                        data={[...riskHistory.history].reverse().map((e, i) => ({
                          label: fmtShort(e.created_at, i),
                          score: e.prediction?.risk_score_0_100 ?? null,
                          riskLevel: e.prediction?.label ?? null,
                        }))}
                        margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <ReferenceLine y={70} stroke={C.red}    strokeDasharray="3 3" strokeOpacity={0.4} />
                        <ReferenceLine y={40} stroke={C.yellow} strokeDasharray="3 3" strokeOpacity={0.4} />
                        <Line type="monotone" dataKey="score" name="Risk Score" stroke={C.primary} strokeWidth={2} dot={<RiskDot />} activeDot={{ r: 6, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }} />
                        <Tooltip content={<ChartTip />} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2">
                  {riskHistory.history.slice(0, 3).map((entry, idx) => {
                    const pred  = entry.prediction ?? {};
                    const label = pred.label ?? '--';
                    return (
                      <div key={idx} className="rounded-xl border border-border overflow-hidden">
                        <div className="h-0.5" style={{ background: riskHex(label) }} />
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm" style={{ color: riskHex(label) }}>{label}</p>
                            <p className="text-[10px] text-secondary mt-0.5">
                              {entry.window_size} sessions &nbsp;&middot;&nbsp;
                              H:{fmt((pred.prob_high ?? 0) * 100, 1)}%&nbsp;
                              M:{fmt((pred.prob_medium ?? 0) * 100, 1)}%&nbsp;
                              L:{fmt((pred.prob_low ?? 0) * 100, 1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black" style={{ color: riskHex(label) }}>
                              {fmt(pred.risk_score_0_100, 1)}
                              <span className="text-xs font-normal text-secondary">/100</span>
                            </p>
                            <p className="text-[10px] text-secondary">{fmtDate(entry.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* SCORE GUIDE */}
            <Card className="bg-gradient-to-br from-sky-50/60 to-blue-50/30">
              <SectionHeader
                icon={Shield}
                iconBg="bg-primary/10"
                iconColor="text-primary"
                title="Score Guide"
                subtitle="How to interpret these metrics"
              />

              <div className="space-y-2.5">
                {[
                  {
                    label: 'SAC — Speed-Accuracy Composite',
                    desc: 'Higher is better. Measures accurate responses without slowing down.',
                    color: C.primary,
                  },
                  {
                    label: 'IES — Inverse Efficiency Score',
                    desc: 'Lower is better. Penalises slow and inaccurate responses.',
                    color: C.orange,
                  },
                  {
                    label: 'Risk Score (0 to 100)',
                    desc: 'Lower is healthier. Above 70 triggers a HIGH risk alert.',
                    color: C.red,
                  },
                ].map(({ label, desc, color }) => (
                  <div key={label} className="p-3 bg-white/70 rounded-xl border border-white flex items-start gap-3">
                    <div className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />
                    <div>
                      <p className="text-xs font-bold mb-0.5" style={{ color }}>{label}</p>
                      <p className="text-xs text-secondary leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default GameModule;
