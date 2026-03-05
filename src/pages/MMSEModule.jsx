import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  User,
  ArrowLeft,
  ClipboardList,
  Activity,
  ChevronRight,
  Filter,
  Users,
  Award,
  Brain,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import StatCard from '../components/common/StatCard';
import {
  getCaregiverPatientsMMSE,
  getPatientAssessmentsMMSE,
  getCurrentCaregiverId
} from '../services/api';

const MMSEModule = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAssessments, setPatientAssessments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const caregiverId = getCurrentCaregiverId();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log('Fetching patients from caregiver API...');
      const data = await getCaregiverPatientsMMSE(caregiverId);
      console.log('Patients API Raw Response:', data);

      const rawPatients = Array.isArray(data) ? data : (data?.patients || []);

      const processedPatients = rawPatients.map(p => {
        const getValue = (...args) => args.find(v => v !== null && v !== undefined && v !== '');

        // Find latest assessment if it's nested in the patients list
        const assessments = p.assessments || p.mmse_tests || p.tests || [];
        const lastAssessment = assessments.length > 0 ? (
          [...assessments].sort((a, b) => {
            const dateB = new Date(getValue(b.assessment_date, b.completed_at, b.date, b.created_at, b.timestamp, b.test_date, 0));
            const dateA = new Date(getValue(a.assessment_date, a.completed_at, a.date, a.created_at, a.timestamp, a.test_date, 0));
            return dateB - dateA;
          })[0]
        ) : null;

        // Sum questions if total_score is missing
        let calculatedScore = null;
        if (lastAssessment) {
          calculatedScore = getValue(lastAssessment.total_score, lastAssessment.score, lastAssessment.totalScore, lastAssessment.result);
          if (calculatedScore === null && lastAssessment.questions) {
            calculatedScore = lastAssessment.questions.reduce((acc, q) => acc + (q.question_score ?? q.score ?? q.result ?? 0), 0);
          }
        }

        const score = getValue(p.last_score, p.score, calculatedScore, 0);
        const dateStr = getValue(
          p.last_test_date,
          p.date,
          p.created_at,
          p.timestamp,
          p.test_date,
          lastAssessment?.assessment_date,
          lastAssessment?.completed_at,
          lastAssessment?.date,
          lastAssessment?.created_at,
          lastAssessment?.timestamp,
          lastAssessment?.test_date
        );
        const mlPred = getValue(p.ml_prediction, lastAssessment?.ml_summary?.ml_risk_label, lastAssessment?.ml_prediction);

        return {
          ...p,
          displayName: p.name || p.full_name || p.username || p.user_id?.split('-').slice(1, -2).join(' ') || p.user_id,
          displayScore: score,
          displayDate: dateStr,
          displayML: mlPred,
          totalTests: assessments.length || p.total_tests || (score > 0 ? 1 : 0),
          recentAssessments: assessments
        };
      });

      console.log('Processed Patients:', processedPatients);
      setPatients(processedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = async (patient) => {
    try {
      console.log('Selected patient:', patient);
      setSelectedPatient(patient);
      setSelectedAssessment(null);
      setLoading(true);

      console.log(`Fetching assessments for UID: ${patient.user_id}...`);
      const data = await getPatientAssessmentsMMSE(patient.user_id);
      console.log('Assessments API Raw Response:', data);

      // Handle various response formats for assessments
      const assessmentsList = Array.isArray(data) ? data : (data?.assessments || data?.mmse_tests || data?.results || data?.tests || []);

      // Standardize assessment objects
      const standardizedAssessments = assessmentsList.map((a, idx) => {
        // Smart date finder: look for any key containing "date" or "created" or "timestamp"
        const findDate = (obj) => {
          const dateKeys = ['date', 'created_at', 'timestamp', 'test_date', 'dt', 'updated_at', 'session_date', 'time'];
          for (const key of dateKeys) {
            if (obj[key]) return obj[key];
          }
          // Fallback: search all keys for something that looks like a date or has date in the name
          for (const key in obj) {
            if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.toLowerCase().includes('created')) {
              const val = obj[key];
              if (val && (typeof val === 'string' || typeof val === 'number')) {
                const d = new Date(val);
                if (!isNaN(d.getTime())) return val;
              }
            }
          }
          return null;
        };

        const rawDate = findDate(a);
        const parsedDate = rawDate ? new Date(rawDate) : null;
        const isValidDate = parsedDate && !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1990;

        const questions = (a.questions || a.answers || a.items || []).map(q => ({
          ...q,
          type: q.question_type || q.type || q.name || 'MMSE Item',
          prediction: q.ml_prediction || q.prediction || q.result_label || null
        }));

        let calcScore = a.total_score ?? a.score ?? a.totalScore ?? a.result;
        if ((calcScore === null || calcScore === undefined) && questions.length > 0) {
          calcScore = questions.reduce((acc, q) => acc + (q.question_score ?? q.score ?? q.result ?? 0), 0);
        }

        return {
          ...a,
          id: a.id || a._id || `idx-${idx}`,
          total_score: calcScore ?? 0,
          date: isValidDate ? parsedDate.toISOString() : null,
          formattedDate: isValidDate ? parsedDate.toLocaleDateString() : 'Unknown Date',
          formattedTime: isValidDate ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Time',
          ml_prediction: a.ml_summary?.ml_risk_label || a.ml_prediction || a.prediction || a.risk_level || a.classification || null,
          questions,
          categories: a.categories || a.breakdown || a.scores || a.results_breakdown || []
        };
      });

      // Sort by date descending
      standardizedAssessments.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      });

      console.log('Standardized Assessments:', standardizedAssessments);
      setPatientAssessments(standardizedAssessments);
      if (standardizedAssessments.length > 0) {
        setSelectedAssessment(standardizedAssessments[0]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setPatientAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = useMemo(() => {
    return patientAssessments.filter(a => {
      if (!a.date) return true;
      const d = new Date(a.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) { start.setHours(0, 0, 0, 0); if (d < start) return false; }
      if (end) { end.setHours(23, 59, 59, 999); if (d > end) return false; }
      return true;
    });
  }, [patientAssessments, startDate, endDate]);

  const downloadAssessmentPDF = (assessment) => {
    if (!assessment || !selectedPatient) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Aesthetic Header with Clinical Branding
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Abstract Header Shapes
    doc.setFillColor(59, 130, 246, 0.2);
    doc.circle(pageWidth, 0, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL ASSESSMENT REPORT', 20, 28);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DEMENTIA DASH | MMSE EVALUATION SYSTEM', 20, 38);
    doc.text(`REPORT ID: ${assessment.id?.toString().toUpperCase()}`, pageWidth - 20, 38, { align: 'right' });

    // Patient Profile Section
    doc.setTextColor(30, 50, 100);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT PROFILE', 20, 65);

    doc.setDrawColor(220, 220, 230);
    doc.line(20, 68, pageWidth - 20, 68);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`FULL NAME:`, 20, 78);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedPatient.displayName.toUpperCase(), 50, 78);

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`PATIENT ID:`, 20, 85);
    doc.setTextColor(0, 0, 0);
    doc.text(selectedPatient.user_id, 50, 85);

    doc.setTextColor(80, 80, 80);
    doc.text(`DATE:`, 130, 78);
    doc.setTextColor(0, 0, 0);
    doc.text(assessment.formattedDate, 150, 78);

    doc.setTextColor(80, 80, 80);
    doc.text(`TIME:`, 130, 85);
    doc.setTextColor(0, 0, 0);
    doc.text(assessment.formattedTime, 150, 85);

    // Results Dashboard
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 95, pageWidth - 40, 45, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 95, pageWidth - 40, 45, 4, 4, 'D');

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.text('EXECUTIVE SUMMARY', 30, 105);

    // Score Circle/Box simulation
    const scoreColor = assessment.total_score >= 24 ? [22, 101, 52] : assessment.total_score >= 18 ? [180, 83, 9] : [185, 28, 28];
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(30, 110, 40, 25, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`${assessment.total_score}`, 50, 124, { align: 'center' });
    doc.setFontSize(8);
    doc.text('TOTAL SCORE', 50, 131, { align: 'center' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STATUS:', 80, 116);
    doc.setFont('helvetica', 'normal');
    doc.text(assessment.ml_prediction || 'PENDING EVALUATION', 110, 116);

    doc.setFont('helvetica', 'bold');
    doc.text('ML RISK:', 80, 126);
    doc.setFont('helvetica', 'normal');
    doc.text(assessment.ml_summary?.ml_risk_label || (assessment.total_score >= 24 ? 'CONTROL' : 'IMPAIRED'), 110, 126);

    // Detailed Item Analysis Table
    doc.setTextColor(30, 50, 100);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED ITEM BREAKDOWN', 20, 155);

    doc.setFillColor(241, 245, 249);
    doc.rect(20, 160, pageWidth - 40, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('QUESTION CATEGORY / TYPE', 25, 165);
    doc.text('AI PREDICTION', 100, 165);
    doc.text('SCORE', 185, 165, { align: 'right' });

    let y = 175;
    assessment.questions?.forEach((q, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(252, 253, 255);
        doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(q.type.toUpperCase(), 25, y + 1);

      doc.setTextColor(60, 60, 60);
      doc.text(q.prediction || '-', 100, y + 1);

      const qScore = q.question_score ?? q.score ?? q.result ?? 0;
      const qMax = q.max || 1;
      if (qScore === qMax) {
        doc.setTextColor(22, 101, 52);
      } else {
        doc.setTextColor(30, 58, 138);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${qScore}/${qMax}`, 185, y + 1, { align: 'right' });

      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 30;
      }
    });

    // Signatures/Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('This report is generated by an automated clinical utility and should be reviewed by a qualified healthcare professional.', 20, 285);
    doc.text(`Page 1 of 1`, pageWidth - 20, 285, { align: 'right' });

    doc.save(`Assessment_Report_${selectedPatient.displayName.replace(/ /g, '_')}_${assessment.formattedDate}.pdf`);
  };

  const downloadHistoryPDF = () => {
    if (!selectedPatient || filteredAssessments.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT PROGRESS SUMMARY', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`PATIENT: ${selectedPatient.displayName.toUpperCase()}`, 20, 35);
    const rangeText = (startDate || endDate) ? `${startDate || 'BEGINNING'} to ${endDate || 'PRESENT'}` : 'FULL HISTORY';
    doc.text(`PERIOD: ${rangeText}`, 140, 35);

    const scoreColor = (s) => s >= 24 ? [22, 101, 52] : s >= 18 ? [180, 83, 9] : [185, 28, 28];
    const avgScore = (filteredAssessments.reduce((acc, current) => acc + current.total_score, 0) / filteredAssessments.length).toFixed(1);
    const maxScore = Math.max(...filteredAssessments.map(a => a.total_score));

    // Summary Statistics Header
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 48, pageWidth - 40, 25, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 48, pageWidth - 40, 25, 3, 3, 'D');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL SESSIONS', 30, 56);
    doc.text('AVERAGE MMSE', 85, 56);
    doc.text('PEAK SCORE', 145, 56);

    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text(filteredAssessments.length.toString(), 30, 66);
    doc.text(avgScore.toString(), 85, 66);
    doc.text(maxScore.toString(), 145, 66);

    // Analysis Header
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(12);
    doc.text('CHRONOLOGICAL ACTIVITY LOG', 20, 85);
    doc.setDrawColor(30, 58, 138, 0.3);
    doc.line(20, 88, pageWidth - 20, 88);

    // Data Table
    doc.setFillColor(30, 58, 138);
    doc.rect(20, 92, pageWidth - 40, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSESSMENT DATE', 25, 97);
    doc.text('TIME', 70, 97);
    doc.text('CLINICAL STATUS / ML PREDICTION', 100, 97);
    doc.text('TOTAL SCORE', 185, 97, { align: 'right' });

    let y = 108;
    filteredAssessments.forEach((a, i) => {
      if (i % 2 === 1) {
        doc.setFillColor(252, 253, 255);
        doc.rect(20, y - 6, pageWidth - 40, 10, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(a.formattedDate, 25, y);
      doc.text(a.formattedTime, 70, y);

      const status = a.ml_prediction || (a.total_score >= 24 ? 'Control' : 'Impaired');
      doc.text(status.toUpperCase(), 100, y);

      doc.setFont('helvetica', 'bold');
      const c = scoreColor(a.total_score);
      doc.setTextColor(c[0], c[1], c[2]);
      doc.text(`${a.total_score}/30`, 185, y, { align: 'right' });

      y += 10;
      if (y > 275) {
        doc.addPage();
        y = 30;
      }
    });

    // Disclaimer
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`* This progress report is based on ${filteredAssessments.length} sessions recorded in the Dementia Dash system. Generated on ${new Date().toLocaleString()}.`, 20, 285);

    doc.save(`Progress_Report_${selectedPatient.displayName.replace(/ /g, '_')}.pdf`);
  };

  const filteredPatients = useMemo(() => {
    if (!Array.isArray(patients)) return [];
    return patients.filter(p =>
      (p.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.user_id?.toString() || '').includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const dashboardStats = useMemo(() => {
    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalAll = 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    let testsThisMonth = 0;

    patients.forEach(p => {
      const assessments = p.recentAssessments || [];
      if (assessments.length > 0) {
        assessments.forEach(a => {
          totalAll++;
          const d = new Date(a.assessment_date || a.completed_at || a.date || a.created_at || 0);
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) testsThisMonth++;

          if (a.status === 'in_progress' || (a.questions?.length > 0 && (a.total_score === null || a.total_score === undefined))) {
            totalInProgress++;
          } else {
            totalCompleted++;
          }
        });
      } else {
        // Fallback for flat patient objects
        const count = p.totalTests || (p.displayScore !== null ? 1 : 0);
        totalAll += count;
        totalCompleted += count;
        if (p.displayDate) {
          const d = new Date(p.displayDate);
          if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) testsThisMonth++;
        }
      }
    });

    return { totalAll, totalCompleted, totalInProgress, testsThisMonth };
  }, [patients]);

  const getScoreColor = (score) => {
    if (score >= 24) return 'text-green-600';
    if (score >= 18) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score) => {
    if (score >= 24) return 'Normal';
    if (score >= 18) return 'Mild';
    return 'Moderate';
  };

  const getStatusBadge = (score, mlPrediction) => {
    if (mlPrediction) {
      const variant = mlPrediction.toLowerCase().includes('control') || mlPrediction.toLowerCase().includes('normal') ? 'success' :
        mlPrediction.toLowerCase().includes('risk') || mlPrediction.toLowerCase().includes('mild') ? 'warning' : 'error';
      return <Badge variant={variant}>{mlPrediction}</Badge>;
    }
    if (score >= 24) return <Badge variant="success">Normal</Badge>;
    if (score >= 18) return <Badge variant="warning">Mild Impairment</Badge>;
    return <Badge variant="error">Moderate Impairment</Badge>;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (selectedPatient) {
    const chartData = [...patientAssessments]
      .filter(a => a.date) // Only show assessments with valid dates in chart
      .reverse()
      .map(a => ({
        date: new Date(a.date).toLocaleDateString(),
        score: a.total_score
      }));

    return (
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key="patient-details"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="space-y-6"
          >
            {/* Back Header */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ x: -5 }}
                onClick={() => setSelectedPatient(null)}
                className="flex items-center space-x-2 text-secondary hover:text-primary transition-colors group px-4 py-2 rounded-xl hover:bg-primary/5"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Back to Overview</span>
              </motion.button>
            </div>

            {/* Patient Overview Header - Fixed Visibility */}
            <motion.div variants={itemVariants}>
              <motion.div
                className="relative overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-primary to-[#4338ca] rounded-[2rem] shadow-xl p-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Abstract background shapes for depth */}
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-accent/20 rounded-full blur-2xl" />

                <div className="relative p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-6">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-[#1e3a8a] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="text-white text-center sm:text-left">
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight">{selectedPatient.displayName}</h1>
                      <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center mt-3 gap-3">
                        <span className="text-[10px] md:text-xs font-bold bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white/90 uppercase tracking-wider break-all text-center sm:text-left shadow-sm">
                          Patient ID: {selectedPatient.user_id}
                        </span>
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-white/70 bg-white/5 sm:bg-transparent px-3 py-1 sm:p-0 rounded-full">
                          <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          Active Clinical File
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-lg min-w-[140px] flex flex-col items-center justify-center">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Latest Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-white text-3xl md:text-4xl font-black">{selectedPatient.displayScore ?? '0'}</span>
                        <span className="text-white/40 text-xs font-bold">/30</span>
                      </div>
                      <div className="w-full bg-black/20 h-1.5 rounded-full mt-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedPatient.displayScore / 30) * 100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-green-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                        />
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-lg flex flex-col items-center justify-center min-w-[140px]">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Tests</p>
                      <span className="text-white text-3xl md:text-4xl font-black">{patientAssessments.length}</span>
                      <ClipboardList className="w-4 h-4 text-white/30 mt-2" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Assessment List */}
              <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
                <div className="space-y-4 mb-4">
                  <h2 className="text-xl font-bold text-deepBlue flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Assessment History
                  </h2>

                  <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      <span>Filter By Date</span>
                      {(startDate || endDate) && (
                        <button
                          onClick={() => { setStartDate(''); setEndDate(''); }}
                          className="text-primary hover:text-indigo-700 transition-colors flex items-center gap-1"
                        >
                          Reset <ArrowLeft className="w-2.5 h-2.5 rotate-45" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <Calendar className="w-3.5 h-3.5 text-secondary mr-2" />
                      <div className="flex items-center flex-1 justify-between">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="text-xs outline-none border-none bg-transparent w-full"
                        />
                        <span className="mx-2 text-gray-300">-</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-xs outline-none border-none bg-transparent w-full text-right"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={downloadHistoryPDF}
                      disabled={filteredAssessments.length === 0}
                      className="w-full !py-2.5 text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 bg-gradient-to-r from-deepBlue to-primary hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Filtered Report
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredAssessments.length > 0 ? filteredAssessments.map((assessment, index) => (
                    <motion.div
                      key={assessment.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedAssessment(assessment)}
                    >
                      <div
                        className={`relative cursor-pointer transition-all duration-300 rounded-2xl overflow-hidden shadow-sm group ${selectedAssessment?.id === assessment.id
                          ? 'ring-2 ring-primary ring-offset-2 bg-gradient-to-r from-primary/5 to-white p-[1px]'
                          : 'bg-white hover:shadow-md border border-gray-100'
                          }`}
                      >
                        {/* Status indicator bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${assessment.total_score >= 24 ? 'bg-green-500' :
                            assessment.total_score >= 18 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                        />

                        <div className="p-4 pl-6 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-primary/10 transition-colors`}>
                              <Calendar className={`w-5 h-5 ${selectedAssessment?.id === assessment.id ? 'text-primary' : 'text-secondary'
                                }`} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                {assessment.formattedDate}
                              </p>
                              <div className="flex items-center text-xs text-secondary mt-1">
                                <Activity className="w-3 h-3 mr-1 opacity-60" />
                                {assessment.formattedTime}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-xl font-black ${getScoreColor(assessment.total_score)}`}>
                                {assessment.total_score}
                                <span className="text-[10px] text-gray-400 font-normal ml-0.5">/30</span>
                              </span>
                              <div className="mt-1 scale-90 origin-right">
                                {getStatusBadge(assessment.total_score, assessment.ml_prediction)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedAssessment?.id === assessment.id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-primary opacity-20">
                            <ChevronRight className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )) : (
                    <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-secondary italic">No tests in this range</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Right Column: Chart and Details */}
              <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                {/* Score Trend Graph */}
                <Card title="Cognitive Score Trend" className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        domain={[0, 30]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#4F46E5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Selected Assessment Detailed View */}
                <AnimatePresence mode="wait">
                  {selectedAssessment ? (
                    <motion.div
                      key={selectedAssessment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="border-l-4 border-primary">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Assessment Details</h3>
                            <p className="text-secondary">
                              Performed on {selectedAssessment.formattedDate}, {selectedAssessment.formattedTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-4xl font-bold ${getScoreColor(selectedAssessment.total_score)}`}>
                              {selectedAssessment.total_score}/30
                            </p>
                            <p className="text-sm font-medium text-secondary">Total Score</p>
                          </div>
                        </div>

                        {/* We'll assume the categories are part of the assessment object or mapped from it */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedAssessment.categories?.map((cat) => (
                            <div key={cat.name} className="p-4 bg-gray-50 rounded-xl">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                <span className="font-bold">{cat.score}/{cat.max}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-primary h-1.5 rounded-full"
                                  style={{ width: `${(cat.score / cat.max) * 100}%` }}
                                />
                              </div>
                            </div>
                          )) || (
                              <div className="col-span-2 text-center py-8 text-secondary italic">
                                Detailed category breakdown for this test is not available.
                              </div>
                            )}
                        </div>

                        {/* ML Prediction Insight */}
                        {selectedAssessment.ml_prediction && (
                          <div className="mt-6 p-5 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden relative group">
                            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                              <Brain className="w-24 h-24" />
                            </div>
                            <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
                              <Activity className="w-5 h-5 text-indigo-600" />
                              ML Prediction Analysis
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-indigo-100 font-bold text-indigo-700 text-lg">
                                {selectedAssessment.ml_prediction}
                              </div>
                              <p className="text-sm text-indigo-800/80 italic font-medium">
                                Algorithm analyzed behavior and response patterns for this session.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Caregiver Summary - Upgraded Medical Advisory Section */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-6 p-6 rounded-3xl border-2 overflow-hidden relative ${selectedAssessment.total_score >= 24
                            ? "bg-emerald-50/50 border-emerald-100"
                            : selectedAssessment.total_score >= 18
                              ? "bg-amber-50/50 border-amber-100"
                              : "bg-rose-50/50 border-rose-100"
                            }`}
                        >
                          {/* Abstract Background Icon */}
                          <div className={`absolute -right-6 -bottom-6 opacity-[0.03] rotate-12`}>
                            <Award className="w-32 h-32" />
                          </div>

                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className={`text-lg font-black flex items-center gap-2 ${selectedAssessment.total_score >= 24 ? "text-emerald-900" : selectedAssessment.total_score >= 18 ? "text-amber-900" : "text-rose-900"
                                }`}>
                                <Award className={`w-5 h-5 ${selectedAssessment.total_score >= 24 ? "text-emerald-600" : selectedAssessment.total_score >= 18 ? "text-amber-600" : "text-rose-600"
                                  }`} />
                                Clinical Caregiver Feedback
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${selectedAssessment.total_score >= 24
                                ? "bg-emerald-500 text-white"
                                : selectedAssessment.total_score >= 18
                                  ? "bg-amber-500 text-white"
                                  : "bg-rose-500 text-white animate-pulse"
                                }`}>
                                {selectedAssessment.total_score >= 24 ? "Normal Range" : selectedAssessment.total_score >= 18 ? "Mild Monitoring" : "Immediate Action"}
                              </span>
                            </div>

                            <div className="space-y-4">
                              <p className={`leading-relaxed text-sm font-medium ${selectedAssessment.total_score >= 24 ? "text-emerald-800/80" : selectedAssessment.total_score >= 18 ? "text-amber-800/80" : "text-rose-800/80"
                                }`}>
                                {selectedAssessment.total_score >= 24
                                  ? "Assessment indicates strong cognitive resilience. The patient's orientation, memory, and executive functions are currently performing at an optimal clinical baseline. Maintain current cognitive stimulus and nutritional routines."
                                  : selectedAssessment.total_score >= 18
                                    ? "Assessment detects markers of early-stage cognitive decline. While independent function remains intact, there is a measurable impact on recall or attention. We recommend structured cognitive rehabilitation and a neuro-psych review within 3 months."
                                    : "Assessment indicates significant cognitive impairment across multiple domains. This is considered a high-priority clinical finding. Immediate consultation with a Neurologist or Geriatric Specialist is strongly advised to discuss management strategies."
                                }
                              </p>

                              <div className={`pt-4 border-t ${selectedAssessment.total_score >= 24 ? "border-emerald-100/50" : selectedAssessment.total_score >= 18 ? "border-amber-100/50" : "border-rose-100/50"
                                }`}>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                                  <span className={`flex items-center gap-1.5 ${selectedAssessment.total_score >= 24 ? "text-emerald-600" : selectedAssessment.total_score >= 18 ? "text-amber-600" : "text-rose-600"
                                    }`}>
                                    <Activity className="w-3 h-3" />
                                    Automated Medical Screen
                                  </span>
                                  <span className="text-gray-400">|</span>
                                  <span className="text-gray-400">DementiaDash AI Utility</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Detailed Question Breakdown */}
                        <div className="mt-8 space-y-4">
                          <div className="flex items-center justify-between mt-8 mb-4">
                            <h4 className="text-lg font-bold text-deepBlue flex items-center gap-2">
                              <ClipboardList className="w-5 h-5" />
                              Detailed Question Analysis
                            </h4>
                            <Button
                              onClick={() => downloadAssessmentPDF(selectedAssessment)}
                              className="!py-1.5 !px-3 text-xs flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-700 hover:shadow-lg hover:scale-105 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Export PDF Report
                            </Button>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-2xl overflow-x-auto shadow-sm">
                            <table className="w-full text-left">
                              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                <tr>
                                  <th className="px-6 py-3 font-semibold">Question Type</th>
                                  <th className="px-6 py-3 font-semibold">ML Prediction</th>
                                  <th className="px-6 py-3 font-semibold text-right">Score</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-sm">
                                {selectedAssessment.questions?.length > 0 ? (
                                  selectedAssessment.questions.map((q, i) => (
                                    <motion.tr
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="hover:bg-primary/5 transition-colors"
                                    >
                                      <td className="px-6 py-4 text-gray-700 font-medium">
                                        <span className="capitalize">{q.type}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                        {q.prediction ? (
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.prediction.toLowerCase().includes('correct') || q.prediction.toLowerCase().includes('control')
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {q.prediction}
                                          </span>
                                        ) : (
                                          <span className="text-gray-300 text-[10px] italic">Not Evaluated</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        {(() => {
                                          const qScore = q.question_score ?? q.score ?? q.result ?? 0;
                                          return (
                                            <span className={`font-bold ${qScore > 0 ? 'text-primary' : 'text-gray-400'}`}>
                                              {qScore}
                                            </span>
                                          );
                                        })()}
                                        <span className="text-gray-400 text-[10px] ml-1">/{q.max || q.max_score || 1}</span>
                                      </td>
                                    </motion.tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-secondary italic">
                                      Individual question data not available for this session.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-secondary"
                    >
                      Select an assessment from the list to view details
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard-home"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="space-y-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl font-black text-deepBlue tracking-tight">MMSE Dashboard</h1>
              <p className="text-secondary font-medium mt-1">Manage and monitor cognitive assessments for all patients</p>
            </motion.div>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-6 md:gap-8">
            <StatCard
              index={0}
              title="Total Patients"
              value={patients.length}
              icon={Users}
            />
            <StatCard
              index={1}
              title="Total Assessments"
              value={dashboardStats.totalAll}
              icon={FileText}
            />
            <StatCard
              index={2}
              title="Avg. Cognitive Score"
              value={patients.length > 0
                ? (patients.reduce((acc, p) => acc + (parseFloat(p.displayScore) || 0), 0) / patients.length).toFixed(1)
                : '0.0'}
              icon={Activity}
            />
            <StatCard
              index={3}
              title="Completed"
              value={dashboardStats.totalCompleted}
              icon={CheckCircle}
            />
            <StatCard
              index={4}
              title="In-Progress"
              value={dashboardStats.totalInProgress}
              icon={Clock}
            />
            <StatCard
              index={5}
              title="Tests This Month"
              value={dashboardStats.testsThisMonth}
              icon={ClipboardList}
            />
          </div>

          {/* Patients Grid */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-deepBlue flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Managed Patients
              </h2>

              <motion.div variants={itemVariants} className="relative w-full md:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
                />
              </motion.div>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                ))
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <motion.div
                    key={patient.user_id}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => handlePatientClick(patient)}
                  >
                    <Card className="p-0 overflow-hidden cursor-pointer group bg-white border-none ring-1 ring-gray-100 hover:shadow-2xl hover:ring-primary/20 transition-all duration-500">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center group-hover:from-primary group-hover:to-indigo-600 transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-primary/30">
                                <User className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors duration-500" />
                              </div>
                              <div className="absolute -right-1 -top-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-black text-gray-900 line-clamp-1 text-lg group-hover:text-primary transition-colors">{patient.displayName}</h3>
                              <p className="text-[10px] font-bold text-secondary tracking-widest uppercase mt-0.5">UID: {patient.user_id?.split('-').pop()}</p>
                            </div>
                          </div>
                          {getStatusBadge(patient.displayScore, patient.displayML)}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Overall Core Score</p>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-black ${getScoreColor(patient.displayScore)}`}>
                                  {patient.displayScore ?? '0'}
                                </span>
                                <span className="text-secondary text-sm font-medium">/30</span>
                              </div>
                            </div>
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(patient.displayScore / 30) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${patient.displayScore >= 24 ? 'bg-green-500' :
                                  patient.displayScore >= 18 ? 'bg-amber-500' : 'bg-red-500'
                                  } shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Last Activity</span>
                              <span className="text-xs font-bold text-gray-700 mt-1 flex items-center">
                                <Calendar className="w-3 h-3 mr-1 text-primary opacity-50" />
                                {patient.displayDate ? new Date(patient.displayDate).toLocaleDateString() : 'Never'}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Assessments</span>
                              <span className="text-xs font-bold text-gray-700 mt-1 uppercase italic">
                                {patient.totalTests} total
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 bg-gray-50/50 group-hover:bg-primary transition-colors duration-500 flex items-center justify-between text-secondary group-hover:text-white font-bold text-xs uppercase tracking-widest">
                        <span>Access Medical Profile</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No patients found</h3>
                  <p className="text-secondary">Try adjusting your search terms</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export default MMSEModule;
