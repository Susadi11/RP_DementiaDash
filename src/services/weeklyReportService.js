/**
 * Weekly Report Service
 * 
 * Fetches REAL data from all 4 components and calculates normalized + weighted scores.
 * 
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  SCORING LOGIC                                                          │
 * │                                                                          │
 * │  1. Chat Score (weight 0.30)                                            │
 * │     Source: /api/detection/weekly-risk + /api/detection/sessions/{id}    │
 * │     Logic : (1 - avg_risk_score) × 100  → lower risk = higher score     │
 * │                                                                          │
 * │  2. MMSE Score (weight 0.30)                                            │
 * │     Source: /api/mmse/user/{id}                                         │
 * │     Logic : (latest_score / 30) × 100   → e.g. 24/30 = 80             │
 * │                                                                          │
 * │  3. Game Score (weight 0.20)                                            │
 * │     Source: /game/stats/{id}                                            │
 * │     Logic : (1 - riskScore/100) × 100   → lower game risk = higher     │
 * │                                                                          │
 * │  4. Reminder Score (weight 0.20)                                        │
 * │     Source: /api/caregiver/dashboard/{id}                               │
 * │     Logic : compliance_rate (already 0-100%)                            │
 * │                                                                          │
 * │  Overall = chat×0.30 + mmse×0.30 + game×0.20 + reminder×0.20          │
 * │                                                                          │
 * │  Weights reflect clinical importance:                                   │
 * │  - Conversational AI + MMSE are primary dementia indicators             │
 * │  - Game performance + reminders are secondary behavioral indicators     │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

import {
  getPatientSessions,
  getWeeklyRisk,
  getPatientAssessmentsMMSE,
  getGameStats,
  getGameHistory,
  getPatientDashboard,
  getAdherenceRiskScore,
  getActivityCompletion,
  getUserRemindersAll,
} from './api';

// ── Weights for final score ────────────────────────────────────────────────
const WEIGHTS = {
  chat: 0.30,
  mmse: 0.30,
  game: 0.20,
  reminder: 0.20,
};

// ── Helper: get Monday of current week ─────────────────────────────────────
const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

const getWeekEnd = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// ── 1. Fetch Chat / Conversational AI Data ──────────────────────────────────
async function fetchChatData(patientId) {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  try {
    const [sessionsRes, weeklyRiskRes] = await Promise.all([
      getPatientSessions(patientId, weekStart, weekEnd).catch(() => null),
      getWeeklyRisk(patientId, weekStart).catch(() => null),
    ]);

    const sessions = sessionsRes?.sessions || sessionsRes || [];
    const sessionList = Array.isArray(sessions) ? sessions : [];

    // Calculate average risk from sessions
    let avgRisk = 0;
    if (sessionList.length > 0) {
      const totalRisk = sessionList.reduce((sum, s) => sum + (s.session_raw_score || 0), 0);
      avgRisk = totalRisk / sessionList.length / 36; // normalize to 0-1 (max raw score is 36)
    }

    // Weekly risk from dedicated endpoint
    const weeklyRiskScore = weeklyRiskRes?.final_weekly_risk || null;
    const riskLevel = weeklyRiskRes?.risk_level || 'N/A';

    // Use weekly risk if available, else calculate from sessions
    const normalizedRisk = weeklyRiskScore !== null ? weeklyRiskScore / 100 : avgRisk;

    // Chat score: lower risk = higher score
    const chatScore = Math.round(Math.max(0, Math.min(100, (1 - normalizedRisk) * 100)));

    // Count sessions by day for active days
    const activeDays = new Set(sessionList.map(s => {
      const d = new Date(s.created_at || s.timestamp || s.session_date);
      return d.toISOString().split('T')[0];
    })).size;

    // Get mood/concern parameters
    const parameterConcerns = {};
    if (sessionList.length > 0) {
      const paramKeys = [
        'p1_semantic_incoherence', 'p2_repeated_questions', 'p3_self_correction',
        'p4_low_confidence', 'p5_hesitation_pauses', 'p6_vocal_tremors',
        'p7_emotion_slip', 'p8_slowed_speech', 'p9_evening_errors',
        'p10_in_session_decline', 'p11_memory_recall_failure', 'p12_topic_avoidance'
      ];
      paramKeys.forEach(key => {
        const avg = sessionList.reduce((sum, s) => sum + (s[key] || 0), 0) / sessionList.length;
        if (avg >= 1.5) {
          parameterConcerns[key] = Math.round(avg * 10) / 10;
        }
      });
    }

    return {
      score: chatScore,
      totalSessions: sessionList.length,
      activeDays,
      avgRiskScore: Math.round(normalizedRisk * 100),
      riskLevel,
      weeklyRiskScore: weeklyRiskScore !== null ? Math.round(weeklyRiskScore) : null,
      totalMessages: sessionList.reduce((sum, s) => sum + (s.message_count || 0), 0),
      parameterConcerns,
      hasData: sessionList.length > 0,
      interpretation: weeklyRiskRes?.interpretation || null,
      recommendations: weeklyRiskRes?.interpretation?.recommendations || [],
    };
  } catch (err) {
    console.error('Failed to fetch chat data:', err);
    return {
      score: null,
      totalSessions: 0,
      activeDays: 0,
      avgRiskScore: 0,
      riskLevel: 'N/A',
      weeklyRiskScore: null,
      totalMessages: 0,
      parameterConcerns: {},
      hasData: false,
      interpretation: null,
      recommendations: [],
    };
  }
}

// ── 2. Fetch MMSE Data ──────────────────────────────────────────────────────
async function fetchMMSEData(patientId) {
  try {
    const res = await getPatientAssessmentsMMSE(patientId);

    // Handle various response formats
    let assessments = [];
    if (Array.isArray(res)) {
      assessments = res;
    } else if (res?.assessments) {
      assessments = res.assessments;
    } else if (res?.tests) {
      assessments = res.tests;
    }

    if (assessments.length === 0) {
      return {
        score: null,
        latestScore: null,
        totalTests: 0,
        hasData: false,
        trend: 'N/A',
        weekChange: 0,
        breakdown: [],
        scoreHistory: [],
        lastTestDate: null,
      };
    }

    // Sort by date descending
    assessments.sort((a, b) => {
      const dateA = new Date(a.assessment_date || a.completed_at || a.date || a.created_at || 0);
      const dateB = new Date(b.assessment_date || b.completed_at || b.date || b.created_at || 0);
      return dateB - dateA;
    });

    const latest = assessments[0];

    // Calculate total score
    let latestScore = latest.total_score || latest.score || latest.totalScore || latest.result;
    if (latestScore === null || latestScore === undefined) {
      // Try summing questions
      if (latest.questions) {
        latestScore = latest.questions.reduce((acc, q) => acc + (q.question_score ?? q.score ?? q.result ?? 0), 0);
      }
    }
    latestScore = latestScore || 0;

    // MMSE score normalized to 0-100
    const mmseScore = Math.round(Math.max(0, Math.min(100, (latestScore / 30) * 100)));

    // Get score history (last 4)
    const scoreHistory = assessments.slice(0, 4).reverse().map(a => {
      let s = a.total_score || a.score || a.totalScore || a.result || 0;
      if (!s && a.questions) {
        s = a.questions.reduce((acc, q) => acc + (q.question_score ?? q.score ?? 0), 0);
      }
      return s;
    });

    // Calculate week change
    const weekChange = scoreHistory.length >= 2 ? scoreHistory[scoreHistory.length - 1] - scoreHistory[scoreHistory.length - 2] : 0;

    // Breakdown from latest assessment
    let breakdown = [];
    if (latest.questions) {
      // Group questions by category
      const categories = {};
      latest.questions.forEach(q => {
        const cat = q.category || q.section || 'General';
        if (!categories[cat]) categories[cat] = { score: 0, max: 0 };
        categories[cat].score += (q.question_score ?? q.score ?? 0);
        categories[cat].max += (q.max_score ?? q.max ?? 1);
      });
      breakdown = Object.entries(categories).map(([name, data]) => ({
        name,
        score: data.score,
        max: data.max,
      }));
    }

    // Trend
    let trend = 'stable';
    if (scoreHistory.length >= 2) {
      const diff = scoreHistory[scoreHistory.length - 1] - scoreHistory[0];
      if (diff >= 2) trend = 'improving';
      else if (diff <= -2) trend = 'declining';
    }

    return {
      score: mmseScore,
      latestScore,
      totalTests: assessments.length,
      hasData: true,
      trend,
      weekChange,
      breakdown,
      scoreHistory,
      lastTestDate: latest.assessment_date || latest.completed_at || latest.date || null,
      status: latestScore >= 24 ? 'Normal' : latestScore >= 18 ? 'Mild Impairment' : 'Moderate Impairment',
    };
  } catch (err) {
    console.error('Failed to fetch MMSE data:', err);
    return {
      score: null,
      latestScore: null,
      totalTests: 0,
      hasData: false,
      trend: 'N/A',
      weekChange: 0,
      breakdown: [],
      scoreHistory: [],
      lastTestDate: null,
    };
  }
}

// ── 3. Fetch Game Data ──────────────────────────────────────────────────────
async function fetchGameData(patientId) {
  try {
    const [statsRes, historyRes] = await Promise.all([
      getGameStats(patientId).catch(() => null),
      getGameHistory(patientId, 20).catch(() => null),
    ]);

    if (!statsRes && !historyRes) {
      return {
        score: null,
        totalSessions: 0,
        hasData: false,
        avgSAC: 0,
        avgIES: 0,
        currentRiskLevel: 'N/A',
        recentRiskScore: 0,
        sessions: [],
      };
    }

    const totalSessions = statsRes?.totalSessions || 0;
    const avgSAC = statsRes?.avgSAC || 0;
    const avgIES = statsRes?.avgIES || 0;
    const currentRiskLevel = statsRes?.currentRiskLevel || 'N/A';
    const recentRiskScore = statsRes?.recentRiskScore || 0;

    // Game score: lower risk = higher score. Null when no sessions (exclude from overall).
    const gameScore = totalSessions > 0
      ? Math.round(Math.max(0, Math.min(100, 100 - recentRiskScore)))
      : null;

    // Process history for display
    const sessions = [];
    if (historyRes?.sessions) {
      historyRes.sessions.slice(0, 5).forEach(s => {
        sessions.push({
          date: s.timestamp || s.date,
          accuracy: s.features?.sac ? Math.round(s.features.sac * 100) : 0,
          reactionTime: s.features?.ies ? Math.round(s.features.ies) : 0,
          riskScore: s.prediction?.riskScore0_100 || 0,
          riskLevel: s.prediction?.riskLevel || 'N/A',
        });
      });
    }

    return {
      score: gameScore,
      totalSessions,
      hasData: totalSessions > 0,
      avgSAC: Math.round(avgSAC * 10000) / 10000,
      avgIES: Math.round(avgIES * 100) / 100,
      currentRiskLevel,
      recentRiskScore: Math.round(recentRiskScore),
      sessions,
      lastSessionDate: statsRes?.lastSessionDate || null,
    };
  } catch (err) {
    console.error('Failed to fetch game data:', err);
    return {
      score: null,
      totalSessions: 0,
      hasData: false,
      avgSAC: 0,
      avgIES: 0,
      currentRiskLevel: 'N/A',
      recentRiskScore: 0,
      sessions: [],
    };
  }
}

// ── 4. Fetch Reminder Data ──────────────────────────────────────────────────
async function fetchReminderData(patientId) {
  try {
    // Fetch from multiple sources in parallel
    const [dashRes, adherenceRes, activityRes, rawRemindersRes] = await Promise.all([
      getPatientDashboard(patientId).catch(() => null),
      getAdherenceRiskScore(patientId, 7).catch(() => null),
      getActivityCompletion(patientId, 7).catch(() => null),
      getUserRemindersAll(patientId).catch(() => null),
    ]);

    // ── Try the caregiver dashboard overview first ──
    const overview = dashRes?.reminder_overview || {};
    let complianceRate = overview.compliance_rate || 0;
    let completed = overview.completed || 0;
    let missed = overview.missed || 0;
    let pending = overview.pending || 0;
    let total = overview.total || 0;
    let weekChange = overview.week_change || '0%';

    // ── Fallback: calculate from raw reminders if dashboard returned 0 ──
    if (total === 0 && rawRemindersRes) {
      const rawList = Array.isArray(rawRemindersRes)
        ? rawRemindersRes
        : (rawRemindersRes?.reminders || rawRemindersRes?.data || rawRemindersRes?.items || []);

      if (rawList.length > 0) {
        // Filter to this week's reminders
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);

        const thisWeek = rawList.filter(r => {
          const st = r.scheduled_time ? new Date(r.scheduled_time) : null;
          return st && !isNaN(st) && st >= weekStart;
        });

        // If no reminders this week, use all reminders (they might not have scheduled_time)
        const list = thisWeek.length > 0 ? thisWeek : rawList;

        total = list.length;
        completed = list.filter(r => (r.status || '').toLowerCase() === 'completed').length;
        missed = list.filter(r => {
          const s = (r.status || '').toLowerCase();
          if (s === 'missed') return true;
          // Active reminders whose scheduled_time has passed = effectively missed
          if (s === 'active' && r.scheduled_time) {
            const st = new Date(r.scheduled_time);
            return !isNaN(st) && st < new Date();
          }
          return false;
        }).length;
        pending = list.filter(r => {
          const s = (r.status || '').toLowerCase();
          if (s !== 'active') return false;
          if (!r.scheduled_time) return true;
          const st = new Date(r.scheduled_time);
          return !isNaN(st) && st >= new Date();
        }).length;

        complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    }

    // Also try adherence endpoint values if still 0
    if (total === 0) {
      completed = adherenceRes?.summary?.completed || 0;
      missed = adherenceRes?.summary?.missed || 0;
      total = adherenceRes?.summary?.total || 0;
      complianceRate = adherenceRes?.adherence_rate || 0;
    }

    // Behavior analysis
    const behavior = dashRes?.behavior_analysis || {};
    const cognitiveRisk = dashRes?.cognitive_risk || {};

    // Activity completion rates
    const activities = activityRes?.categories || activityRes?.activities || [];

    // Reminder score is the compliance rate (already 0-100)
    const reminderScore = Math.round(Math.max(0, Math.min(100, complianceRate)));

    return {
      score: reminderScore,
      complianceRate: Math.round(complianceRate),
      completed,
      missed,
      pending,
      total,
      weekChange,
      hasData: total > 0,
      behavior,
      cognitiveRisk,
      activities,
      adherenceRiskLevel: adherenceRes?.risk_level || 'N/A',
      trend: adherenceRes?.trend || 'stable',
      recommendations: dashRes?.recommendations || adherenceRes?.recommendations || [],
      alerts: dashRes?.recent_alerts || [],
    };
  } catch (err) {
    console.error('Failed to fetch reminder data:', err);
    return {
      score: null,
      complianceRate: 0,
      completed: 0,
      missed: 0,
      pending: 0,
      total: 0,
      weekChange: '0%',
      hasData: false,
      behavior: {},
      cognitiveRisk: {},
      activities: [],
      adherenceRiskLevel: 'N/A',
      trend: 'stable',
      recommendations: [],
      alerts: [],
    };
  }
}

// ── Calculate Overall Weighted Score ────────────────────────────────────────
function calculateOverallScore(chatScore, mmseScore, gameScore, reminderScore) {
  const scores = [
    { score: chatScore, weight: WEIGHTS.chat },
    { score: mmseScore, weight: WEIGHTS.mmse },
    { score: gameScore, weight: WEIGHTS.game },
    { score: reminderScore, weight: WEIGHTS.reminder },
  ];

  // Only use components that have real data (non-null)
  const validScores = scores.filter(s => s.score !== null);

  if (validScores.length === 0) return { overall: 0, componentsUsed: 0 };

  // Redistribute weights proportionally among available components
  const totalWeight = validScores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = validScores.reduce((sum, s) => sum + (s.score * (s.weight / totalWeight)), 0);

  return {
    overall: Math.round(weightedSum),
    componentsUsed: validScores.length,
  };
}

// ── Get Overall Rating Label ────────────────────────────────────────────────
export function getOverallRating(score) {
  if (score >= 85) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', emoji: '🟢' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', emoji: '🔵' };
  if (score >= 55) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', emoji: '🟡' };
  if (score >= 40) return { label: 'Needs Attention', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', emoji: '🟠' };
  return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', emoji: '🔴' };
}

// ── Get Component Rating ────────────────────────────────────────────────────
export function getComponentRating(score) {
  if (score === null) return { label: 'No Data', color: 'text-gray-400', bg: 'bg-gray-50' };
  if (score >= 80) return { label: 'Good', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 60) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50' };
  if (score >= 40) return { label: 'Attention', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { label: 'Concern', color: 'text-red-600', bg: 'bg-red-50' };
}

// ── MAIN: Fetch Complete Weekly Report ──────────────────────────────────────
export async function fetchWeeklyReportData(patientId) {
  // Fetch all 4 components in parallel
  const [chat, mmse, game, reminder] = await Promise.all([
    fetchChatData(patientId),
    fetchMMSEData(patientId),
    fetchGameData(patientId),
    fetchReminderData(patientId),
  ]);

  // Calculate weighted overall score
  const { overall, componentsUsed } = calculateOverallScore(
    chat.score,
    mmse.score,
    game.score,
    reminder.score
  );

  const rating = getOverallRating(overall);

  // Combine all recommendations
  const allRecommendations = [
    ...chat.recommendations,
    ...reminder.recommendations,
  ].filter((r, i, arr) => arr.indexOf(r) === i).slice(0, 8); // deduplicate, max 8

  // Generate smart summary
  const summary = generateSummary(chat, mmse, game, reminder, overall, rating);

  return {
    patientId,
    weekEnding: getWeekEnd(),
    weekStart: getWeekStart(),
    generatedAt: new Date().toISOString(),

    // Individual component data
    chat,
    mmse,
    game,
    reminder,

    // Overall scoring
    overallScore: overall,
    rating,
    componentsUsed,

    // Combined insights
    recommendations: allRecommendations,
    summary,

    // Weights used (for transparency in report)
    weights: WEIGHTS,
  };
}

// ── Friendly human-readable concern labels ─────────────────────────────────
export const FRIENDLY_PARAM_NAMES = {
  p1_semantic_incoherence: 'Unclear speech',
  p2_repeated_questions: 'Repeating questions',
  p3_self_correction: 'Frequent self-correction',
  p4_low_confidence: 'Sounding unsure',
  p5_hesitation_pauses: 'Long pauses in speech',
  p6_vocal_tremors: 'Shaky voice',
  p7_emotion_slip: 'Mood changes',
  p8_slowed_speech: 'Speaking slowly',
  p9_evening_errors: 'Evening confusion',
  p10_in_session_decline: 'Getting tired during chat',
  p11_memory_recall_failure: 'Trouble remembering',
  p12_topic_avoidance: 'Avoiding certain topics',
};

// ── Friendly risk level labels ──────────────────────────────────────────────
export function friendlyRisk(level) {
  if (!level || level === 'N/A') return 'Not enough data';
  const l = level.toLowerCase();
  if (l === 'low' || l === 'normal' || l === 'minimal') return 'Looking good';
  if (l === 'moderate' || l === 'medium') return 'Needs some attention';
  if (l === 'high' || l === 'elevated') return 'Needs attention';
  if (l === 'critical' || l === 'severe') return 'Needs urgent attention';
  // Return the original if we don't recognize it but capitalize nicely
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// ── Friendly MMSE status ────────────────────────────────────────────────────
export function friendlyMmseStatus(score) {
  if (score === null || score === undefined) return 'No test taken';
  if (score >= 24) return 'Normal range';
  if (score >= 18) return 'Some difficulty';
  if (score >= 10) return 'Noticeable difficulty';
  return 'Significant difficulty';
}

// ── Friendly trend ──────────────────────────────────────────────────────────
export function friendlyTrend(trend) {
  if (!trend || trend === 'N/A') return 'Not enough data yet';
  const t = trend.toLowerCase();
  if (t === 'improving' || t.includes('improv')) return 'Getting better';
  if (t === 'declining' || t.includes('declin')) return 'Getting worse';
  if (t === 'stable') return 'Staying the same';
  return trend;
}

// ── Generate Smart Summary Text ─────────────────────────────────────────────
function generateSummary(chat, mmse, game, reminder, overall, rating) {
  const parts = [];

  // Overall — plain language
  if (overall >= 70) {
    parts.push(`${rating.label} week overall — your loved one scored ${overall} out of 100.`);
  } else if (overall >= 50) {
    parts.push(`This week's health score is ${overall} out of 100 — some areas need attention.`);
  } else {
    parts.push(`This week's health score is ${overall} out of 100 — please review the details below carefully.`);
  }

  // Chat
  if (chat.hasData) {
    if (chat.score >= 70) {
      parts.push(`Conversations looked healthy across ${chat.totalSessions} chat session${chat.totalSessions !== 1 ? 's' : ''}.`);
    } else {
      parts.push(`Some concerns were noticed during ${chat.totalSessions} chat session${chat.totalSessions !== 1 ? 's' : ''} — keep an eye on this.`);
    }
  } else {
    parts.push('No chat sessions happened this week.');
  }

  // MMSE
  if (mmse.hasData) {
    const statusText = friendlyMmseStatus(mmse.latestScore);
    const trendText = friendlyTrend(mmse.trend);
    parts.push(`Memory test score was ${mmse.latestScore} out of 30 (${statusText}). Trend: ${trendText.toLowerCase()}.`);
  } else {
    parts.push('No memory test was taken this week.');
  }

  // Games
  if (game.hasData) {
    if (game.score >= 70) {
      parts.push(`Brain games went well — ${game.totalSessions} session${game.totalSessions !== 1 ? 's' : ''} played.`);
    } else {
      parts.push(`Brain games showed some difficulty across ${game.totalSessions} session${game.totalSessions !== 1 ? 's' : ''}.`);
    }
  } else {
    parts.push('No brain games were played this week.');
  }

  // Reminders
  if (reminder.hasData) {
    if (reminder.complianceRate >= 80) {
      parts.push(`Medications were taken on time ${reminder.complianceRate}% of the time — great job!`);
    } else if (reminder.complianceRate >= 50) {
      parts.push(`Medications were taken ${reminder.complianceRate}% of the time — ${reminder.missed} were missed.`);
    } else {
      parts.push(`Only ${reminder.complianceRate}% of medications were taken — ${reminder.missed} missed. This needs attention.`);
    }
  } else {
    parts.push('No medication reminders were tracked this week.');
  }

  return parts.join(' ');
}

export default fetchWeeklyReportData;
