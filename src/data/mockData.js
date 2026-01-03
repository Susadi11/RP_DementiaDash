// Mock data for elderly users and their reports

export const elderlyUsers = [
  {
    id: 1,
    name: 'Robert Anderson',
    age: 78,
    avatar: null,
    status: 'active',
    lastActivity: '2 hours ago',
    cognitiveScore: 26,
    totalSessions: 145,
    lastLogin: '2024-01-02',
    contact: {
      email: 'robert.anderson@email.com',
      phone: '+1 (555) 123-4567',
      address: '123 Oak Street, Boston, MA'
    }
  },
  {
    id: 2,
    name: 'Margaret Wilson',
    age: 82,
    avatar: null,
    status: 'active',
    lastActivity: '5 hours ago',
    cognitiveScore: 23,
    totalSessions: 98,
    lastLogin: '2024-01-02',
    contact: {
      email: 'margaret.wilson@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Maple Avenue, Boston, MA'
    }
  },
  {
    id: 3,
    name: 'William Thompson',
    age: 75,
    avatar: null,
    status: 'active',
    lastActivity: '1 day ago',
    cognitiveScore: 28,
    totalSessions: 203,
    lastLogin: '2024-01-01',
    contact: {
      email: 'william.thompson@email.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine Road, Cambridge, MA'
    }
  },
  {
    id: 4,
    name: 'Dorothy Martinez',
    age: 80,
    avatar: null,
    status: 'inactive',
    lastActivity: '3 days ago',
    cognitiveScore: 21,
    totalSessions: 67,
    lastLogin: '2023-12-30',
    contact: {
      email: 'dorothy.martinez@email.com',
      phone: '+1 (555) 456-7890',
      address: '321 Elm Street, Somerville, MA'
    }
  },
  {
    id: 5,
    name: 'James Taylor',
    age: 77,
    avatar: null,
    status: 'active',
    lastActivity: '4 hours ago',
    cognitiveScore: 25,
    totalSessions: 134,
    lastLogin: '2024-01-02',
    contact: {
      email: 'james.taylor@email.com',
      phone: '+1 (555) 567-8901',
      address: '654 Birch Lane, Brookline, MA'
    }
  },
  {
    id: 6,
    name: 'Patricia Davis',
    age: 84,
    avatar: null,
    status: 'active',
    lastActivity: '1 hour ago',
    cognitiveScore: 24,
    totalSessions: 112,
    lastLogin: '2024-01-02',
    contact: {
      email: 'patricia.davis@email.com',
      phone: '+1 (555) 678-9012',
      address: '987 Cedar Drive, Newton, MA'
    }
  },
  {
    id: 7,
    name: 'Charles Miller',
    age: 79,
    avatar: null,
    status: 'active',
    lastActivity: '6 hours ago',
    cognitiveScore: 27,
    totalSessions: 178,
    lastLogin: '2024-01-02',
    contact: {
      email: 'charles.miller@email.com',
      phone: '+1 (555) 789-0123',
      address: '147 Spruce Court, Quincy, MA'
    }
  },
  {
    id: 8,
    name: 'Barbara Garcia',
    age: 81,
    avatar: null,
    status: 'active',
    lastActivity: '3 hours ago',
    cognitiveScore: 22,
    totalSessions: 89,
    lastLogin: '2024-01-02',
    contact: {
      email: 'barbara.garcia@email.com',
      phone: '+1 (555) 890-1234',
      address: '258 Willow Way, Medford, MA'
    }
  },
  {
    id: 9,
    name: 'Richard Brown',
    age: 76,
    avatar: null,
    status: 'inactive',
    lastActivity: '2 days ago',
    cognitiveScore: 26,
    totalSessions: 156,
    lastLogin: '2023-12-31',
    contact: {
      email: 'richard.brown@email.com',
      phone: '+1 (555) 901-2345',
      address: '369 Ash Boulevard, Waltham, MA'
    }
  },
  {
    id: 10,
    name: 'Susan Rodriguez',
    age: 83,
    avatar: null,
    status: 'active',
    lastActivity: '7 hours ago',
    cognitiveScore: 23,
    totalSessions: 94,
    lastLogin: '2024-01-02',
    contact: {
      email: 'susan.rodriguez@email.com',
      phone: '+1 (555) 012-3456',
      address: '741 Oak Circle, Arlington, MA'
    }
  },
  {
    id: 11,
    name: 'Joseph Lee',
    age: 78,
    avatar: null,
    status: 'active',
    lastActivity: '30 minutes ago',
    cognitiveScore: 27,
    totalSessions: 187,
    lastLogin: '2024-01-02',
    contact: {
      email: 'joseph.lee@email.com',
      phone: '+1 (555) 123-4567',
      address: '852 Maple Terrace, Belmont, MA'
    }
  },
  {
    id: 12,
    name: 'Nancy White',
    age: 85,
    avatar: null,
    status: 'active',
    lastActivity: '2 hours ago',
    cognitiveScore: 20,
    totalSessions: 73,
    lastLogin: '2024-01-02',
    contact: {
      email: 'nancy.white@email.com',
      phone: '+1 (555) 234-5678',
      address: '963 Pine Plaza, Watertown, MA'
    }
  }
];

// Generate weekly report data for each user
export const generateWeeklyReport = (userId) => {
  return {
    userId,
    weekEnding: '2024-01-07',
    chat: {
      totalConversations: Math.floor(Math.random() * 20) + 10,
      avgLength: Math.floor(Math.random() * 10) + 5,
      mostActiveTime: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
      moods: {
        happy: Math.floor(Math.random() * 10) + 5,
        neutral: Math.floor(Math.random() * 8) + 3,
        sad: Math.floor(Math.random() * 5) + 1,
        anxious: Math.floor(Math.random() * 4) + 1
      },
      commonTopics: ['Family', 'Health', 'Hobbies', 'Weather', 'News'].slice(0, Math.floor(Math.random() * 3) + 2),
      sampleConversations: [
        { date: 'Jan 5, 2024', snippet: 'Discussed plans for weekend family visit...' },
        { date: 'Jan 4, 2024', snippet: 'Talked about morning walk routine and weather...' },
        { date: 'Jan 3, 2024', snippet: 'Shared memories about grandchildren...' }
      ]
    },
    cognitive: {
      latestScore: Math.floor(Math.random() * 7) + 20,
      weekChange: Math.floor(Math.random() * 5) - 2,
      testFrequency: '2 times this week',
      scoreHistory: [22, 23, 24, 25],
      breakdown: [
        { name: 'Orientation', score: 8, max: 10 },
        { name: 'Registration', score: 3, max: 3 },
        { name: 'Attention', score: 4, max: 5 },
        { name: 'Recall', score: 2, max: 3 },
        { name: 'Language', score: 7, max: 9 }
      ],
      recommendations: [
        'Continue daily cognitive exercises',
        'Encourage social interaction',
        'Monitor sleep patterns',
        'Consider memory-focused games'
      ]
    },
    games: {
      totalGamesPlayed: Math.floor(Math.random() * 15) + 5,
      totalTime: Math.floor(Math.random() * 10) + 3,
      avgPerformance: Math.floor(Math.random() * 20) + 70,
      games: [
        {
          name: 'Memory Match',
          sessionsPlayed: 8,
          avgScore: 85,
          bestTime: '45 sec',
          improvement: 12
        },
        {
          name: 'Word Puzzle',
          sessionsPlayed: 6,
          avgScore: 78,
          bestTime: '2:30 min',
          improvement: 5
        },
        {
          name: 'Number Challenge',
          sessionsPlayed: 4,
          avgScore: 72,
          bestTime: '1:15 min',
          improvement: -3
        }
      ],
      engagementInsight: 'User shows consistent engagement with memory-based games. Consider introducing more challenging puzzles.'
    },
    reminders: {
      completed: Math.floor(Math.random() * 20) + 15,
      missed: Math.floor(Math.random() * 5) + 1,
      complianceRate: Math.floor(Math.random() * 20) + 75,
      missedReminders: [
        { title: 'Afternoon Medication', date: 'Jan 4', time: '2:00 PM', category: 'Medication' },
        { title: 'Physical Exercise', date: 'Jan 6', time: '9:00 AM', category: 'Activity' }
      ],
      medications: [
        {
          name: 'Aspirin',
          dosage: '81mg',
          frequency: 'Once daily',
          times: ['8:00 AM'],
          adherence: 95
        },
        {
          name: 'Vitamin D',
          dosage: '1000 IU',
          frequency: 'Once daily',
          times: ['8:00 AM'],
          adherence: 90
        },
        {
          name: 'Blood Pressure Med',
          dosage: '10mg',
          frequency: 'Twice daily',
          times: ['8:00 AM', '8:00 PM'],
          adherence: 85
        }
      ],
      activities: [
        { name: 'Morning Walk', completion: 85 },
        { name: 'Hydration Check', completion: 92 },
        { name: 'Social Call', completion: 70 },
        { name: 'Reading Time', completion: 78 }
      ]
    },
    overallScore: Math.floor(Math.random() * 15) + 75,
    caregiverNotes: '',
    weekComparison: {
      chatActivity: '+15%',
      cognitiveScore: '+2 points',
      gameEngagement: '+8%',
      medicationAdherence: '-5%'
    },
    recommendations: [
      'Maintain current medication schedule',
      'Encourage more social interactions',
      'Continue cognitive games',
      'Monitor sleep quality'
    ]
  };
};

// Dashboard statistics
export const dashboardStats = {
  totalUsers: 12,
  activeUsers: 10,
  pendingReports: 3,
  criticalAlerts: 1,
  weeklyActivities: 147
};

// Recent activity feed
export const recentActivity = [
  {
    id: 1,
    user: 'Joseph Lee',
    action: 'Completed MMSE assessment',
    time: '30 minutes ago',
    type: 'cognitive'
  },
  {
    id: 2,
    user: 'Patricia Davis',
    action: 'Missed afternoon medication',
    time: '1 hour ago',
    type: 'alert'
  },
  {
    id: 3,
    user: 'Robert Anderson',
    action: 'Played 3 cognitive games',
    time: '2 hours ago',
    type: 'activity'
  },
  {
    id: 4,
    user: 'Charles Miller',
    action: 'Had conversation about family',
    time: '3 hours ago',
    type: 'chat'
  },
  {
    id: 5,
    user: 'Margaret Wilson',
    action: 'Completed weekly report',
    time: '4 hours ago',
    type: 'report'
  }
];

export default {
  elderlyUsers,
  generateWeeklyReport,
  dashboardStats,
  recentActivity
};
