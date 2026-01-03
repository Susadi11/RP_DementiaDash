# Hale Caregiver Dashboard

A minimalistic, Apple-aesthetic caregiver dashboard for monitoring and managing elderly care. Built with React, Vite, and Tailwind CSS.

## Features

### Core Functionality
- **Dashboard Home** - Overview with statistics, recent activity, and quick access
- **Elderly Users Management** - Browse, search, and filter users
- **User Profiles** - Detailed information with tabs for overview, reports, and health data
- **Weekly Reports** - Comprehensive 4-module care reports:
  - Chat & Conversation Analysis
  - Cognitive Assessment (MMSE)
  - Game Activity & Cognitive Games
  - Reminders & Medication Adherence
- **Final Weekly Report** - Consolidated PDF-style report with executive summary
- **Settings** - Profile, notifications, report preferences, and security settings

### Design System
- **Colors**: Primary Blue (#0EA5E9), Deep Blue (#1E3A8A), Light Blue (#7DD3FC)
- **Typography**: SF Pro Display / System fonts
- **Components**: Clean, minimalistic Apple-inspired UI
- **Responsive**: Mobile, tablet, and desktop layouts

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5174
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Sidebar, Layout
│   ├── common/          # Reusable UI components
│   ├── reports/         # Report module components
│   └── charts/          # Chart components
├── pages/               # Route pages
├── data/                # Mock data
└── App.jsx             # Main app with routing
```

## Pages & Routes

- `/` - Redirects to login
- `/login` - Login page
- `/dashboard` - Dashboard home
- `/users` - Elderly users list
- `/users/:userId` - User profile
- `/users/:userId/reports` - Weekly reports
- `/users/:userId/final-report` - Final consolidated report
- `/settings` - Settings page

## Mock Data

The application includes realistic mock data for:
- 12 elderly users with varied profiles
- Weekly report data for each user
- All 4 care modules with metrics
- Dashboard statistics and activity feed

## Key Components

### Common Components
- **Card** - Container with shadow and rounded corners
- **Button** - Multiple variants (primary, secondary, outline, etc.)
- **Avatar** - User initials in gradient circle
- **Badge** - Status indicators
- **StatCard** - Metric display card

### Report Components
- **ChatReport** - Conversation analysis with mood charts
- **CognitiveReport** - MMSE scores with trends
- **GameReport** - Game performance metrics
- **ReminderReport** - Medication adherence tracking

### Charts
- **LineChart** - Trend visualization
- **BarChart** - Comparison charts
- **DonutChart** - Distribution charts

## Customization

### Colors
Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  primary: '#0EA5E9',
  deepBlue: '#1E3A8A',
  lightBlue: '#7DD3FC',
  // ... add more colors
}
```

### Mock Data
Edit `src/data/mockData.js` to modify user data and reports.

## Future Enhancements

- [ ] Connect to backend API
- [ ] User authentication
- [ ] Real-time notifications
- [ ] Export to PDF functionality
- [ ] Dark mode support
- [ ] Advanced filtering and search
- [ ] Data analytics dashboard
- [ ] Multi-language support

## Notes

- This is a frontend-only application with mock data
- All features are client-side only
- Authentication is simulated (any credentials work)
- Report data is randomly generated for demonstration

## Development

To add a new page:
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/layout/Sidebar.jsx`

## License

This project is built for educational and demonstration purposes.

---

Built with ❤️ using React + Vite + Tailwind CSS
