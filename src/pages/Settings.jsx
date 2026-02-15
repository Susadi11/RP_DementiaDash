import { useState } from 'react';
import { Bell, FileText, Shield, Save } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

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
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-deepBlue mb-2">Settings</h1>
          <p className="text-secondary">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary border-l-4 border-primary'
                          : 'text-secondary hover:bg-secondaryBg'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
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
                <h2 className="text-2xl font-bold text-deepBlue mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Email Alerts</h3>
                      <p className="text-sm text-secondary">Receive email notifications for important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailAlerts}
                        onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Critical Alerts</h3>
                      <p className="text-sm text-secondary">Immediate notifications for critical health events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.criticalAlerts}
                        onChange={(e) => setNotifications({...notifications, criticalAlerts: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Weekly Reports</h3>
                      <p className="text-sm text-secondary">Receive weekly summary reports via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReports}
                        onChange={(e) => setNotifications({...notifications, weeklyReports: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Missed Medication</h3>
                      <p className="text-sm text-secondary">Alerts when users miss medication</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.missedMedication}
                        onChange={(e) => setNotifications({...notifications, missedMedication: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Low Engagement</h3>
                      <p className="text-sm text-secondary">Notify when user engagement drops</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.lowEngagement}
                        onChange={(e) => setNotifications({...notifications, lowEngagement: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

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
                <h2 className="text-2xl font-bold text-deepBlue mb-6">Report Generation Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Auto-Generate Reports</h3>
                      <p className="text-sm text-secondary">Automatically generate weekly reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportSettings.autoGenerate}
                        onChange={(e) => setReportSettings({...reportSettings, autoGenerate: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-deepBlue mb-2">Report Frequency</label>
                    <select
                      value={reportSettings.frequency}
                      onChange={(e) => setReportSettings({...reportSettings, frequency: e.target.value})}
                      className="w-full px-4 py-2.5 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">Include Charts</h3>
                      <p className="text-sm text-secondary">Add visualizations to reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportSettings.includeCharts}
                        onChange={(e) => setReportSettings({...reportSettings, includeCharts: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondaryBg rounded-xl">
                    <div>
                      <h3 className="font-semibold text-deepBlue">PDF Format</h3>
                      <p className="text-sm text-secondary">Export reports in PDF format</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportSettings.pdfFormat}
                        onChange={(e) => setReportSettings({...reportSettings, pdfFormat: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

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
                <h2 className="text-2xl font-bold text-deepBlue mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-deepBlue mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-deepBlue mb-2">Current Password</label>
                        <input
                          type="password"
                          placeholder="Enter current password"
                          className="w-full px-4 py-2.5 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deepBlue mb-2">New Password</label>
                        <input
                          type="password"
                          placeholder="Enter new password"
                          className="w-full px-4 py-2.5 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deepBlue mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className="w-full px-4 py-2.5 bg-secondaryBg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold text-deepBlue mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-secondary mb-4">Add an extra layer of security to your account</p>
                    <Button variant="outline">Enable 2FA</Button>
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
