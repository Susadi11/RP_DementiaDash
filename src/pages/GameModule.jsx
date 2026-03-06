import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Calendar, RefreshCw, Gamepad2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getLinkedPatientsDetails, getGameStats, getGameHistory } from '../services/api';

const GameModule = () => {
  const [patient, setPatient]     = useState(null);
  const [stats, setStats]         = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get the first linked patient
      const patientsRes = await getLinkedPatientsDetails();
      const p = patientsRes?.patients?.[0] || null;
      setPatient(p);

      if (p?.user_id) {
        // 2. Fetch real game stats + history in parallel
        const [statsRes, historyRes] = await Promise.all([
          getGameStats(p.user_id).catch(() => null),
          getGameHistory(p.user_id, 20).catch(() => null),
        ]);
        setStats(statsRes || null);
        setSessions(historyRes?.sessions || []);
      }
    } catch (err) {
      console.error('GameModule fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const riskColor = (level) => {
    if (!level) return 'text-gray-500';
    const l = level.toUpperCase();
    if (l === 'LOW')    return 'text-green-600';
    if (l === 'MEDIUM') return 'text-yellow-600';
    if (l === 'HIGH')   return 'text-red-600';
    return 'text-gray-500';
  };

  const riskBg = (level) => {
    if (!level) return 'bg-gray-100';
    const l = level.toUpperCase();
    if (l === 'LOW')    return 'bg-green-50 border-green-200';
    if (l === 'MEDIUM') return 'bg-yellow-50 border-yellow-200';
    if (l === 'HIGH')   return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const fmt = (val, decimals = 0) =>
    val !== undefined && val !== null ? Number(val).toFixed(decimals) : '—';

  const fmtDate = (ts) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleDateString(); } catch { return ts; }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-secondary">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading game data…
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Failed to load game data: {error}
        <Button className="ml-4" onClick={fetchData}>Retry</Button>
      </div>
    </Layout>
  );

  const hasData = sessions.length > 0 || (stats && stats.totalSessions > 0);
  const totalSessions    = stats?.totalSessions    ?? sessions.length;
  const avgSAC           = stats?.avgSAC           ?? null;
  const avgIES           = stats?.avgIES           ?? null;
  const currentRisk      = stats?.currentRiskLevel ?? (sessions[0]?.prediction?.riskLevel) ?? '—';
  const recentRiskScore  = stats?.recentRiskScore  ?? (sessions[0]?.prediction?.riskScore0_100) ?? null;
  const lastSessionDate  = stats?.lastSessionDate  ?? sessions[0]?.timestamp ?? null;

  // Cognitive wellness score: lower risk → higher score
  const wellnessScore = recentRiskScore !== null
    ? Math.round(Math.max(0, Math.min(100, 100 - recentRiskScore)))
    : null;

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepBlue mb-2">Cognitive Games Activity</h1>
            <p className="text-secondary">Real-time game performance from the mobile app</p>
          </div>
          <Button onClick={fetchData} className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* ── Patient card ────────────────────────────────────────────────── */}
        {patient && (
          <Card className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-deepBlue mb-1">
                  {patient.full_name || 'Patient'}
                </h2>
                <p className="text-gray-700">
                  Age: {patient.age ?? 'N/A'} &nbsp;|&nbsp; Status: {patient.account_status ?? 'active'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-secondary mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Last session: {fmtDate(lastSessionDate)}</span>
                </div>
                <p className="text-sm text-secondary">Patient ID: {patient.user_id}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── No data state ────────────────────────────────────────────────── */}
        {!hasData && (
          <Card className="text-center py-12">
            <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No game sessions recorded yet.</p>
            <p className="text-sm text-secondary mt-1">
              Sessions will appear here once the patient plays games on the mobile app.
            </p>
          </Card>
        )}

        {/* ── Summary stats ───────────────────────────────────────────────── */}
        {hasData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <p className="text-xs text-secondary mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-secondary mb-1">Wellness Score</p>
                <p className={`text-3xl font-bold ${wellnessScore !== null ? (wellnessScore >= 70 ? 'text-green-600' : wellnessScore >= 50 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400'}`}>
                  {wellnessScore !== null ? `${wellnessScore}/100` : '—'}
                </p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-secondary mb-1">Avg SAC Score</p>
                <p className="text-3xl font-bold text-gray-900">{fmt(avgSAC, 3)}</p>
                <p className="text-xs text-secondary mt-1">Speed-Accuracy Composite</p>
              </Card>
              <Card className="text-center">
                <p className="text-xs text-secondary mb-1">Current Risk</p>
                <p className={`text-2xl font-bold ${riskColor(currentRisk)}`}>
                  {currentRisk}
                </p>
                {recentRiskScore !== null && (
                  <p className="text-xs text-secondary mt-1">Score: {fmt(recentRiskScore, 1)}/100</p>
                )}
              </Card>
            </div>

            {/* ── Session history ─────────────────────────────────────────── */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Sessions</h3>
              {sessions.length === 0 ? (
                <p className="text-secondary text-sm">No session history available.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s, idx) => {
                    const risk     = s.prediction?.riskLevel      ?? '—';
                    const rScore   = s.prediction?.riskScore0_100 ?? null;
                    const accuracy = s.features?.accuracy         ?? null;
                    const sac      = s.features?.sac              ?? null;
                    const ies      = s.features?.ies              ?? null;
                    return (
                      <div
                        key={s.sessionId || idx}
                        className={`p-4 rounded-lg border ${riskBg(risk)}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {s.gameType || 'Game Session'} — Level {s.level ?? '—'}
                            </p>
                            <p className="text-xs text-secondary">{fmtDate(s.timestamp)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${riskColor(risk)}`}>{risk}</p>
                            {rScore !== null && (
                              <p className="text-xs text-secondary">Risk score: {fmt(rScore, 1)}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white/70 rounded p-2 text-center">
                            <p className="text-xs text-secondary">Accuracy</p>
                            <p className="font-bold text-gray-900">
                              {accuracy !== null ? `${fmt(accuracy * 100, 1)}%` : '—'}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded p-2 text-center">
                            <p className="text-xs text-secondary">SAC</p>
                            <p className="font-bold text-gray-900">{fmt(sac, 3)}</p>
                          </div>
                          <div className="bg-white/70 rounded p-2 text-center">
                            <p className="text-xs text-secondary">IES</p>
                            <p className="font-bold text-gray-900">{fmt(ies, 2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ── Cognitive insight ───────────────────────────────────────── */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cognitive Insight</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">What the scores mean</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>SAC</strong> — Speed-Accuracy Composite: higher = better cognitive control</li>
                    <li>• <strong>IES</strong> — Inverse Efficiency Score: lower = better (fast + accurate)</li>
                    <li>• <strong>Risk score</strong> — 0–100; lower is healthier</li>
                  </ul>
                </div>
                <div className={`p-4 rounded-lg border ${riskBg(currentRisk)}`}>
                  <h4 className={`text-sm font-semibold mb-2 ${riskColor(currentRisk)}`}>
                    Current status: {currentRisk}
                  </h4>
                  <ul className={`text-sm space-y-1 ${riskColor(currentRisk)}`}>
                    {currentRisk === 'LOW' && <>
                      <li>• Reaction times are within normal range</li>
                      <li>• Accuracy is consistent across sessions</li>
                      <li>• Keep encouraging regular play</li>
                    </>}
                    {currentRisk === 'MEDIUM' && <>
                      <li>• Some variability in response times detected</li>
                      <li>• Monitor over the next few sessions</li>
                      <li>• Consider discussing with a specialist</li>
                    </>}
                    {currentRisk === 'HIGH' && <>
                      <li>• Significant decline detected in recent sessions</li>
                      <li>• Recommend clinical follow-up</li>
                      <li>• Increase monitoring frequency</li>
                    </>}
                    {(currentRisk === '—' || !currentRisk) && (
                      <li>• Not enough data to determine risk level yet</li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}

      </div>
    </Layout>
  );
};

export default GameModule;
