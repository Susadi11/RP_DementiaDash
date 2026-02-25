import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatModule from './pages/ChatModule';
import MMSEModule from './pages/MMSEModule';
import GameModule from './pages/GameModule';
import GameAnalytics from './pages/GameAnalytics';
import ReminderModule from './pages/ReminderModule';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<ChatModule />} />
        <Route path="/mmse" element={<MMSEModule />} />
        <Route path="/game" element={<GameModule />} />
        <Route path="/game/analytics" element={<GameAnalytics />} />
        <Route path="/reminder" element={<ReminderModule />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
