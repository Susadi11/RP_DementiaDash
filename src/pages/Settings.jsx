import { useState } from 'react';
import { Bell, FileText, Shield, Save, Lock, Smartphone } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="w-[44px] h-[24px] bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all after:shadow-sm peer-checked:bg-primary transition-colors duration-200"></div>
  </label>
);

const SettingRow = ({ title, description, children }) => (
  <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors duration-200">
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-secondary mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('notifications');

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    criticalAlerts: true,
    weeklyReports: true,
    missedMedication: true,
    lowEngagement: false
  });

  const [reportSettings, setReportSettings] = useState({
    autoGenerate: true,
    frequency: 'weekly',
    includeCharts: true,
    pdfFormat: true
  });

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-secondary mt-0.5">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeTab === tab.id
                          ? 'bg-primary/10 text-primary shadow-glow-sm'
                          : 'text-secondary hover:bg-white/60 hover:text-gray-800'
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${activeTab === tab.id ? 'bg-primary/15' : ''
                        }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-sm ${activeTab === tab.id ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
                      {activeTab === tab.id && (
                        <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'notifications' && (
              <Card>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                </div>
                <div className="space-y-3">
                  <SettingRow title="Email Alerts" description="Receive email notifications for important events">
                    <ToggleSwitch
                      checked={notifications.emailAlerts}
                      onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                    />
                  </SettingRow>

                  <SettingRow title="Critical Alerts" description="Immediate notifications for critical health events">
                    <ToggleSwitch
                      checked={notifications.criticalAlerts}
                      onChange={(e) => setNotifications({ ...notifications, criticalAlerts: e.target.checked })}
                    />
                  </SettingRow>

                  <SettingRow title="Weekly Reports" description="Receive weekly summary reports via email">
                    <ToggleSwitch
                      checked={notifications.weeklyReports}
                      onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                    />
                  </SettingRow>

                  <SettingRow title="Missed Medication" description="Alerts when users miss medication">
                    <ToggleSwitch
                      checked={notifications.missedMedication}
                      onChange={(e) => setNotifications({ ...notifications, missedMedication: e.target.checked })}
                    />
                  </SettingRow>

                  <SettingRow title="Low Engagement" description="Notify when user engagement drops">
                    <ToggleSwitch
                      checked={notifications.lowEngagement}
                      onChange={(e) => setNotifications({ ...notifications, lowEngagement: e.target.checked })}
                    />
                  </SettingRow>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'reports' && (
              <Card>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Report Generation</h2>
                </div>
                <div className="space-y-3">
                  <SettingRow title="Auto-Generate Reports" description="Automatically generate weekly reports">
                    <ToggleSwitch
                      checked={reportSettings.autoGenerate}
                      onChange={(e) => setReportSettings({ ...reportSettings, autoGenerate: e.target.checked })}
                    />
                  </SettingRow>

                  <div className="p-4 bg-white/40 rounded-xl border border-white/50">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Report Frequency</label>
                    <select
                      value={reportSettings.frequency}
                      onChange={(e) => setReportSettings({ ...reportSettings, frequency: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <SettingRow title="Include Charts" description="Add visualizations to reports">
                    <ToggleSwitch
                      checked={reportSettings.includeCharts}
                      onChange={(e) => setReportSettings({ ...reportSettings, includeCharts: e.target.checked })}
                    />
                  </SettingRow>

                  <SettingRow title="PDF Format" description="Export reports in PDF format">
                    <ToggleSwitch
                      checked={reportSettings.pdfFormat}
                      onChange={(e) => setReportSettings({ ...reportSettings, pdfFormat: e.target.checked })}
                    />
                  </SettingRow>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Lock className="w-3.5 h-3.5 text-secondary" />
                      <span>Change Password</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1.5">Current Password</label>
                        <input
                          type="password"
                          placeholder="Enter current password"
                          className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                            placeholder:text-secondary/40 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1.5">New Password</label>
                        <input
                          type="password"
                          placeholder="Enter new password"
                          className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                            placeholder:text-secondary/40 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className="w-full px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm
                            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                            placeholder:text-secondary/40 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100/60">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                      <Smartphone className="w-3.5 h-3.5 text-secondary" />
                      <span>Two-Factor Authentication</span>
                    </h3>
                    <p className="text-xs text-secondary mb-3">Add an extra layer of security to your account</p>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Update Security</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
