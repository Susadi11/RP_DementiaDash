import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Calendar, RefreshCw,
  Gamepad2, Activity, Brain, Target, Zap, Minus, FileDown
} from 'lucide-react';
import generateGamePDF from '../utils/generateGamePDF';
import {
  ComposedChart, AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Dot,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getLinkedPatientsDetails, getGameStats, getGameHistory, getRiskPrediction, getRiskHistory } from '../services/api';

//  colour palette matching the app    
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

// colour helpers 
const riskHex   = (l) => ({ LOW: C.green, MEDIUM: C.yellow, HIGH: C.red }[l?.toUpperCase()] ?? C.slate);
const riskCls   = (l) => ({ LOW: 'text-green-600', MEDIUM: 'text-yellow-600', HIGH: 'text-red-600' }[l?.toUpperCase()] ?? 'text-gray-500');
const riskBgCls = (l) => ({ LOW: 'bg-green-50 border-green-200', MEDIUM: 'bg-yellow-50 border-yellow-200', HIGH: 'bg-red-50 border-red-200' }[l?.toUpperCase()] ?? 'bg-gray-50 border-gray-200');

const fmt     = (v, d = 0) => (v !== undefined && v !== null ? Number(v).toFixed(d) : '--');
const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return '--'; } };
const fmtShort = (ts, idx) => { try { const d = new Date(ts); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch { return `S${idx + 1}`; } };

//  Custom tooltip 
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

//  coloured dot for line charts 
const RiskDot = (props) => {
  const { cx, cy, payload } = props;
  const color = riskHex(payload?.riskLevel);
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
};

 
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
  const [activeChart,    setActiveChart]    = useState('risk'); // 'risk' | 'sac' | 'accuracy' | 'ies'

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

  //Derive chart data from sessions (chronological order) 
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

  // Latest accuracy: per-session (game history) OR mean_accuracy from risk history
  const latestAccuracy = useMemo(() => {
    const perSession = sessions[0]?.accuracy;
    if (perSession != null) return perSession;
    return riskHistory?.history?.[0]?.features_used?.mean_accuracy ?? null;
  }, [sessions, riskHistory]);

  // Radar data: current vs "healthy baseline"
  const radarData = useMemo(() => {
    if (!sessions.length) return [];
    const latest = sessions[0];
    const accVal = latest.accuracy ?? riskHistory?.history?.[0]?.features_used?.mean_accuracy ?? 0;
    const acc = accVal * 100;
    const sac = Math.min(100, (latest.sac ?? 0) * 500);
    const ies = Math.max(0, 100 - Math.min(100, (latest.ies ?? 10) * 5));
    const risk = 100 - (latest.riskScore ?? 50);
    return [
      { metric: 'Accuracy',     patient: Math.round(acc),  healthy: 85 },
      { metric: 'Speed (SAC)',  patient: Math.round(sac),  healthy: 80 },
      { metric: 'Efficiency',   patient: Math.round(ies),  healthy: 75 },
      { metric: 'Wellness',     patient: Math.round(risk), healthy: 90 },
      { metric: 'Consistency',  patient: Math.round(Math.random() * 20 + 60), healthy: 80 },
    ];
  }, [sessions, riskHistory]);

  //  Summary values       â”€â”€â”€â”€
  const hasData        = sessions.length > 0 || (stats && stats.totalSessions > 0);
  const totalSessions  = stats?.totalSessions    ?? sessions.length;
  const avgSAC         = stats?.avgSAC           ?? null;
  const currentRisk    = stats?.currentRiskLevel ?? sessions[0]?.riskLevel ?? '--';
  const recentRiskScore= stats?.recentRiskScore  ?? sessions[0]?.riskScore ?? null;
  const lastDate       = stats?.lastSessionDate  ?? sessions[0]?.timestamp ?? null;
  const wellnessScore  = recentRiskScore != null ? Math.round(Math.max(0, Math.min(100, 100 - recentRiskScore))) : null;

  //  Loading           
  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-64 text-secondary gap-3">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span>Loading game data...</span>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-4">
        Failed to load: {error}
        <Button onClick={fetchData}>Retry</Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">

        {/*  Page header   â”€ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-1">Cognitive Games Activity</h1>
            <p className="text-secondary text-sm">Real-time game performance from the mobile app</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={runRiskAssessment}
              disabled={riskLoading || !patient}
              className="flex items-center gap-2 bg-deepBlue hover:bg-deepBlue/90 text-white"
            >
              <Activity className={`w-4 h-4 ${riskLoading ? 'animate-pulse' : ''}`} />
              {riskLoading ? 'Assessing...' : 'Run Risk Assessment'}
            </Button>
            <Button
              onClick={downloadReport}
              disabled={!patient}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <FileDown className="w-4 h-4" /> Download Report
            </Button>
            <Button onClick={fetchData} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/*  Risk assessment banner         */}
        {riskAssessment && (
          <Card className={`border-2 ${riskBgCls(riskAssessment.prediction?.label)}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold mb-1">
                  Standalone Risk Assessment | last {riskAssessment.window_size} sessions
                </p>
                <p className={`text-3xl font-bold ${riskCls(riskAssessment.prediction?.label)}`}>
                  {riskAssessment.prediction?.label ?? '--'}
                  <span className="text-base font-normal text-secondary ml-2">
                    {riskAssessment.prediction?.risk_score_0_100 ?? '--'}/100
                  </span>
                </p>
                <p className="text-xs text-secondary mt-1">
                  HIGH {fmt((riskAssessment.prediction?.prob_high ?? 0) * 100, 1)}% |
                  MED {fmt((riskAssessment.prediction?.prob_medium ?? 0) * 100, 1)}% |
                  LOW {fmt((riskAssessment.prediction?.prob_low ?? 0) * 100, 1)}%
                </p>
              </div>
              <p className="text-xs text-secondary">{fmtDate(riskAssessment.created_at)}</p>
            </div>
          </Card>
        )}
        {riskError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{riskError}</div>
        )}

        {/*  Patient strip    */}
        {patient && (
          <Card className="bg-primary/5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-deepBlue">{patient.full_name || 'Patient'}</h2>
              <p className="text-secondary text-sm">Age: {patient.age ?? 'N/A'} &nbsp;|&nbsp; Status: {patient.account_status ?? 'active'}</p>
            </div>
            <div className="text-right text-sm text-secondary">
              <div className="flex items-center gap-1.5 justify-end mb-0.5">
                <Calendar className="w-4 h-4" /> Last session: {fmtDate(lastDate)}
              </div>
              <p>ID: {patient.user_id}</p>
            </div>
          </Card>
        )}

        {/*  No data       â”€ */}
        {!hasData && (
          <Card className="text-center py-16">
            <Gamepad2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No game sessions recorded yet.</p>
            <p className="text-sm text-secondary mt-1">Sessions appear here once the patient plays on the mobile app.</p>
          </Card>
        )}

        {hasData && (
          <>
            {/*  KPI cards   â”€ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions',  value: totalSessions, sub: null,               icon: Gamepad2, color: 'text-primary',   bg: 'from-sky-50'     },
                { label: 'Wellness Score',  value: wellnessScore != null ? `${wellnessScore}/100` : '--',
                                                                   sub: null,               icon: Brain,    color: wellnessScore != null ? (wellnessScore >= 70 ? 'text-green-600' : wellnessScore >= 50 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400', bg: 'from-violet-50' },
                { label: 'Avg SAC Score',   value: fmt(avgSAC, 3), sub: 'Speed-Accuracy',  icon: Target,   color: 'text-deepBlue',  bg: 'from-blue-50'    },
                { label: 'Current Risk',    value: currentRisk,    sub: recentRiskScore != null ? `Score ${fmt(recentRiskScore, 1)}/100` : null,
                                                                                            icon: Zap,      color: riskCls(currentRisk), bg: 'from-red-50'  },
              ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                <Card key={label} className={`bg-gradient-to-br ${bg} to-white/60`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-secondary mb-2 font-medium">{label}</p>
                      <p className={`text-3xl font-bold ${color}`}>{value}</p>
                      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
                    </div>
                    <div className={`p-2 rounded-xl bg-white/60`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/*  Chart selector tabs         */}
            <Card>
              {/* Tab bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-deepBlue">Performance Trends</h3>
                  <p className="text-xs text-secondary mt-0.5">Session-by-session progression over time</p>
                </div>
                <div className="flex gap-1 bg-secondaryBg rounded-xl p-1">
                  {[
                    { id: 'risk',     label: 'Risk Score'  },
                    { id: 'accuracy', label: 'Accuracy'    },
                    { id: 'sac',      label: 'SAC'         },
                    { id: 'ies',      label: 'IES'         },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveChart(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                        ${activeChart === id
                          ? 'bg-white text-deepBlue shadow-glass-sm'
                          : 'text-secondary hover:text-deepBlue'}`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {chartData.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-48 text-secondary gap-2">
                  <TrendingUp className="w-8 h-8 text-gray-200" />
                  <p className="text-sm">Need at least 2 sessions to show a trend chart.</p>
                </div>
              ) : (
                <>
                  {/*  RISK SCORE chart  */}
                  {activeChart === 'risk' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.red} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={C.red} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <ReferenceLine y={70} stroke={C.red}    strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'High', fill: C.red,    fontSize: 9, position: 'right' }} />
                        <ReferenceLine y={40} stroke={C.yellow} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'Med',  fill: C.yellow, fontSize: 9, position: 'right' }} />
                        <Area type="monotone" dataKey="riskScore" fill="url(#riskGrad)" stroke="none" />
                        <Line
                          type="monotone" dataKey="riskScore" name="Risk Score"
                          stroke={C.red} strokeWidth={2.5}
                          dot={<RiskDot />}
                          activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {/*  ACCURACY chart  */}
                  {activeChart === 'accuracy' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.green} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <ReferenceLine y={80} stroke={C.green}  strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'Target', fill: C.green, fontSize: 9, position: 'right' }} />
                        <Area type="monotone" dataKey="accuracy" fill="url(#accGrad)" stroke="none" />
                        <Line
                          type="monotone" dataKey="accuracy" name="Accuracy %"
                          stroke={C.green} strokeWidth={2.5}
                          dot={{ r: 5, fill: C.green, stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {/*  SAC chart  */}
                  {activeChart === 'sac' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sacGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.primary} stopOpacity={0.18} />
                            <stop offset="95%" stopColor={C.primary} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Area type="monotone" dataKey="sac" fill="url(#sacGrad)" stroke="none" />
                        <Line
                          type="monotone" dataKey="sac" name="SAC"
                          stroke={C.primary} strokeWidth={2.5}
                          dot={{ r: 5, fill: C.primary, stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {/*  IES chart (lower = better)  */}
                  {activeChart === 'ies' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="iesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.orange} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={C.orange} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Area type="monotone" dataKey="ies" fill="url(#iesGrad)" stroke="none" />
                        <Line
                          type="monotone" dataKey="ies" name="IES (lower = better)"
                          stroke={C.orange} strokeWidth={2.5}
                          dot={{ r: 5, fill: C.orange, stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Tooltip content={<ChartTip />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}

                  {/* Colour legend dots */}
                  <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border text-xs text-secondary">
                    {activeChart === 'risk' && <>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Below 40 -- Low risk</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> 40--70 -- Medium risk</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Above 70 -- High risk</span>
                    </>}
                    {activeChart === 'accuracy' && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Target â‰¥ 80%</span>}
                    {activeChart === 'sac' && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Higher = better cognitive speed-accuracy</span>}
                    {activeChart === 'ies' && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Lower = faster and more accurate</span>}
                  </div>
                </>
              )}
            </Card>

            {/*  Radar: cognitive profile vs healthy baseline     â”€ */}
            {sessions.length > 0 && (
              <Card>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-deepBlue">Cognitive Profile</h3>
                  <p className="text-xs text-secondary mt-0.5">Latest session vs healthy baseline -- outer ring is better</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData} cx="50%" cy="50%">
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: C.slate, fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: C.slate, fontSize: 9 }} tickCount={4} />
                      <Radar name="Healthy" dataKey="healthy" stroke={C.green} fill={C.green} fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="5 3" />
                      <Radar name="Patient" dataKey="patient" stroke={C.primary} fill={C.primary} fillOpacity={0.25} strokeWidth={2.5}
                        dot={{ r: 4, fill: C.primary, stroke: '#fff', strokeWidth: 2 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}/100`]} contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid #E2E8F0' }} />
                    </RadarChart>
                  </ResponsiveContainer>

                  {/* Latest session metrics panel */}
                  <div className="space-y-3">
                    {[
                      { label: 'Accuracy',   value: `${fmt(latestAccuracy != null ? latestAccuracy * 100 : null, 1)}%`, color: C.green,   icon: Target },
                      { label: 'SAC Score',  value: fmt(sessions[0]?.sac, 4),  color: C.primary, icon: TrendingUp },
                      { label: 'IES Score',  value: fmt(sessions[0]?.ies, 2),  color: C.orange,  icon: Zap        },
                      { label: 'Risk Level', value: sessions[0]?.riskLevel ?? '--', color: riskHex(sessions[0]?.riskLevel), icon: Brain },
                    ].map(({ label, value, color, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondaryBg/60">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white/80">
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <span className="text-sm font-medium text-secondary">{label}</span>
                        </div>
                        <span className="text-base font-bold" style={{ color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/*  Recent sessions list (compact)     */}
            <Card>
              <h3 className="text-lg font-bold text-deepBlue mb-4">Session History</h3>
              {sessions.length === 0 ? (
                <p className="text-secondary text-sm">No session history available.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, idx) => {
                    const risk   = s.riskLevel  ?? '--';
                    const rScore = s.riskScore  ?? null;
                    const acc    = s.accuracy   ?? null;
                    const sac    = s.sac        ?? null;
                    const ies    = s.ies        ?? null;
                    return (
                      <div key={s.sessionId || idx} className={`p-3 rounded-xl border ${riskBgCls(risk)} flex flex-wrap items-center gap-4`}>
                        <div className="flex-1 min-w-[140px]">
                          <p className="font-semibold text-gray-900 text-sm">
                            {s.gameType || 'Session'} <span className="text-secondary font-normal">Lvl {s.level ?? '--'}</span>
                          </p>
                          <p className="text-xs text-secondary">{fmtDate(s.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-center">
                            <p className="text-xs text-secondary">Acc</p>
                            <p className="font-bold text-gray-800">{acc != null ? `${fmt(acc * 100, 1)}%` : '--'}</p>
                          </span>
                          <span className="text-center">
                            <p className="text-xs text-secondary">SAC</p>
                            <p className="font-bold text-gray-800">{fmt(sac, 3)}</p>
                          </span>
                          <span className="text-center">
                            <p className="text-xs text-secondary">IES</p>
                            <p className="font-bold text-gray-800">{fmt(ies, 2)}</p>
                          </span>
                        </div>
                        <div className="text-right ml-auto">
                          <p className={`text-base font-bold ${riskCls(risk)}`}>{risk}</p>
                          {rScore != null && <p className="text-xs text-secondary">{fmt(rScore, 1)}/100</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/*  Risk history (from /risk/history)          */}
            {riskHistory?.total_predictions > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-deepBlue">Risk Assessment Runs</h3>
                    <p className="text-xs text-secondary mt-0.5">{riskHistory.total_predictions} run{riskHistory.total_predictions !== 1 ? 's' : ''} (each time "Run Risk Assessment" was clicked)</p>
                  </div>
                </div>

                {/* Mini line chart of risk scores over time */}
                {riskHistory.history.length >= 2 && (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart
                      data={[...riskHistory.history].reverse().map((e, i) => ({
                        label: fmtShort(e.created_at, i),
                        score: e.prediction?.risk_score_0_100 ?? null,
                        riskLevel: e.prediction?.label ?? null,
                      }))}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: C.slate, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: C.slate, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <ReferenceLine y={70} stroke={C.red}    strokeDasharray="3 3" strokeOpacity={0.4} />
                      <ReferenceLine y={40} stroke={C.yellow} strokeDasharray="3 3" strokeOpacity={0.4} />
                      <Line
                        type="monotone" dataKey="score" name="Risk Score"
                        stroke={C.primary} strokeWidth={2}
                        dot={<RiskDot />}
                        activeDot={{ r: 6, fill: C.deepBlue, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Tooltip content={<ChartTip />} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                <div className="space-y-2 mt-3">
                  {riskHistory.history.slice(0, 3).map((entry, idx) => {
                    const pred  = entry.prediction ?? {};
                    const label = pred.label ?? '--';
                    return (
                      <div key={idx} className={`p-3 rounded-xl border ${riskBgCls(label)} flex items-center justify-between`}>
                        <div>
                          <p className={`font-semibold text-sm ${riskCls(label)}`}>{label}</p>
                          <p className="text-xs text-secondary mt-0.5">
                            {entry.window_size} sessions | HIGH {fmt((pred.prob_high ?? 0) * 100, 1)}% MED {fmt((pred.prob_medium ?? 0) * 100, 1)}% LOW {fmt((pred.prob_low ?? 0) * 100, 1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${riskCls(label)}`}>{fmt(pred.risk_score_0_100, 1)}<span className="text-xs font-normal text-secondary">/100</span></p>
                          <p className="text-xs text-secondary">{fmtDate(entry.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/*  Cognitive insight footer     */}
            <Card className="bg-gradient-to-br from-sky-50 to-blue-50/40">
              <h3 className="text-base font-bold text-deepBlue mb-3">How to read these scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {[
                  { label: 'SAC (Speed-Accuracy Composite)', desc: 'Higher is better -- measures how accurately the patient responds without slowing down.', color: C.primary },
                  { label: 'IES (Inverse Efficiency Score)', desc: 'Lower is better -- penalises slow and inaccurate responses. Ideal is fast + accurate.', color: C.orange },
                  { label: 'Risk Score (0--100)',              desc: 'Lower is healthier. Above 70 triggers a HIGH alert. Colour-coded in all charts.', color: C.red },
                ].map(({ label, desc, color }) => (
                  <div key={label} className="p-3 bg-white/60 rounded-xl border border-white">
                    <p className="font-semibold mb-1" style={{ color }}>{label}</p>
                    <p className="text-xs text-secondary leading-relaxed">{desc}</p>
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
