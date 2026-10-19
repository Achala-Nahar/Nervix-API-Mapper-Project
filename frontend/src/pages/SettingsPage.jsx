import React, { useState } from 'react';
import { ArrowLeft, Settings, Users, Bell, Plug, Shield, Database, TriangleAlert as AlertTriangle } from 'lucide-react';

const settingsNav = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'backup', label: 'Backup & Data', icon: Database },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
];

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-primary' : 'bg-dark-border'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`}></div>
    </button>
  );
}

function GeneralSettings({ project }) {
  const [defaultEnv, setDefaultEnv] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-text-primary">General Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Project Name</label>
          <input type="text" defaultValue={project?.name || 'Payment Gateway V2'} className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Description</label>
          <textarea rows={3} defaultValue={project?.desc || 'Microservice architecture for payment processing system'} className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary resize-none" />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Visibility</label>
          <select className="w-full appearance-none px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
            <option>Private</option><option>Team</option><option>Organization</option>
          </select>
        </div>
        <div className="flex items-center justify-between p-3 bg-dark-card-2 rounded-lg border border-dark-border">
          <div className="text-sm font-medium text-text-primary">Default Environment</div>
          <Toggle value={defaultEnv} onChange={setDefaultEnv} />
        </div>
        <div className="flex items-center justify-between p-3 bg-dark-card-2 rounded-lg border border-dark-border">
          <div className="text-sm font-medium text-text-primary">Auto-Backup</div>
          <div className="flex items-center gap-3">
            <select className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-text-primary focus:outline-none">
              <option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
            <Toggle value={autoBackup} onChange={setAutoBackup} />
          </div>
        </div>
      </div>
      <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">Save Changes</button>
    </div>
  );
}

function MembersSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-text-primary">Members</h2>
      <div className="space-y-3">
        {[
          { name: 'Krishna Singh', email: 'krishna@example.com', role: 'Owner', initials: 'KS', color: 'bg-primary' },
          { name: 'John Doe', email: 'john@example.com', role: 'Editor', initials: 'JD', color: 'bg-success' },
          { name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Viewer', initials: 'SJ', color: 'bg-warning' },
        ].map((member, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-dark-card-2 rounded-lg border border-dark-border">
            <div className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>{member.initials}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">{member.name}</div>
              <div className="text-xs text-text-muted">{member.email}</div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${member.role === 'Owner' ? 'bg-primary/10 text-primary' : member.role === 'Editor' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSettings() {
  const [states, setStates] = useState({ faults: true, alerts: true, teamChanges: false, weeklyReport: true });
  const toggle = (key) => setStates(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-text-primary">Notifications</h2>
      <div className="space-y-3">
        {[
          { key: 'faults', label: 'Service Faults', desc: 'Get notified when a service fault is detected' },
          { key: 'alerts', label: 'Performance Alerts', desc: 'Alerts for high response times and degradation' },
          { key: 'teamChanges', label: 'Team Changes', desc: 'Notifications for team member updates' },
          { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive a weekly project summary' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">{item.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
            </div>
            <Toggle value={states[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsSettings() {
  const available = [
    { name: 'Slack', icon: '⬛', desc: 'Get alerts and notifications in Slack channels' },
    { name: 'Microsoft Teams', icon: '🔷', desc: 'Receive notifications in Microsoft Teams' },
    { name: 'PagerDuty', icon: '🟢', desc: 'Incident management and alerting' },
    { name: 'Webhook', icon: '🔗', desc: 'Send data to external webhook endpoints' },
  ];

  const configured = [
    { name: 'Slack - #alerts', connectedOn: 'May 10, 2024' },
    { name: 'PagerDuty', connectedOn: 'May 9, 2024' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Integrations</h2>
        <p className="text-sm text-text-muted mt-0.5">Connect and manage third-party integrations</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Available Integrations</h3>
        <div className="space-y-3">
          {available.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-dark-bg rounded-lg flex items-center justify-center text-lg border border-dark-border">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">{item.name}</div>
                  <div className="text-xs text-text-muted">{item.desc}</div>
                </div>
              </div>
              <button className="px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Configured Integrations</h3>
        <div className="space-y-3">
          {configured.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
              <div>
                <div className="text-sm font-medium text-text-primary">{item.name}</div>
                <div className="text-xs text-text-muted">Connected on {item.connectedOn}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">Active</span>
                <button className="text-xs text-text-muted hover:text-danger transition-colors">Disconnect</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState(true);
  const [auditLogs, setAuditLogs] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Security</h2>
        <p className="text-sm text-text-muted mt-0.5">Configure security settings and access controls</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Authentication</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">Two-Factor Authentication</div>
              <div className="text-xs text-text-muted mt-0.5">Require 2FA for all team members</div>
            </div>
            <Toggle value={twoFactor} onChange={setTwoFactor} />
          </div>
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">Session Timeout</div>
              <div className="text-xs text-text-muted mt-0.5">Automatically log out inactive users</div>
            </div>
            <select className="appearance-none px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Access Control</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">IP Whitelisting</div>
              <div className="text-xs text-text-muted mt-0.5">Restrict access to specific IP addresses</div>
            </div>
            <Toggle value={ipWhitelist} onChange={setIpWhitelist} />
          </div>
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">Password Policy</div>
              <div className="text-xs text-text-muted mt-0.5">Enforce strong password requirements</div>
            </div>
            <Toggle value={passwordPolicy} onChange={setPasswordPolicy} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Audit & Monitoring</h3>
        <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
          <div>
            <div className="text-sm font-medium text-text-primary">Audit Logs</div>
            <div className="text-xs text-text-muted mt-0.5">Track user activity and changes</div>
          </div>
          <Toggle value={auditLogs} onChange={setAuditLogs} />
        </div>
      </div>
    </div>
  );
}

function BackupSettings() {
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Backup & Data</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage your backups and data retention</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Backup Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">Auto Backup</div>
              <div className="text-xs text-text-muted mt-0.5">Automatically backup project data</div>
            </div>
            <Toggle value={autoBackup} onChange={setAutoBackup} />
          </div>
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <span className="text-sm font-medium text-text-primary">Backup Frequency</span>
            <select className="appearance-none px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
              <option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <span className="text-sm font-medium text-text-primary">Backup Retention</span>
            <select className="appearance-none px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary">
              <option>30 Days</option><option>60 Days</option><option>90 Days</option><option>1 Year</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">Last Backup</div>
              <div className="text-xs text-text-muted mt-0.5">May 17, 2024 at 2:15 AM</div>
            </div>
            <span className="text-xs text-text-muted">Expires</span>
          </div>
        </div>
        <button className="mt-3 w-full px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
          Create Backup Now
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Data Management</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-dark-border">
            <div>
              <div className="text-sm font-medium text-text-primary">Export Project Data</div>
              <div className="text-xs text-text-muted mt-0.5">Download all project data and configurations</div>
            </div>
            <button className="px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-dark-card-2 rounded-lg border border-danger/20">
            <div>
              <div className="text-sm font-medium text-danger">Delete Project Data</div>
              <div className="text-xs text-text-muted mt-0.5">Permanently delete all project data</div>
            </div>
            <button className="px-3 py-1.5 text-sm text-white bg-danger hover:bg-red-600 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DangerZone() {
  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-danger">Danger Zone</h2>
      <div className="border border-danger/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text-primary">Archive Project</div>
            <div className="text-xs text-text-muted mt-0.5">Archive this project. It will be hidden from your dashboard.</div>
          </div>
          <button className="px-3 py-2 text-sm text-warning border border-warning/30 rounded-lg hover:bg-warning/10 transition-colors">Archive</button>
        </div>
        <div className="border-t border-dark-border"></div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-danger">Delete Project</div>
            <div className="text-xs text-text-muted mt-0.5">Permanently delete this project and all its data. This cannot be undone.</div>
          </div>
          <button className="px-3 py-2 text-sm text-white bg-danger hover:bg-red-600 rounded-lg transition-colors">Delete Project</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage({ onBack, project }) {
  const [activeSection, setActiveSection] = useState('general');

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return <GeneralSettings project={project} />;
      case 'members': return <MembersSettings />;
      case 'notifications': return <NotificationsSettings />;
      case 'integrations': return <IntegrationsSettings />;
      case 'security': return <SecuritySettings />;
      case 'backup': return <BackupSettings />;
      case 'danger': return <DangerZone />;
      default: return <GeneralSettings project={project} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage your project settings and preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            {settingsNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-dark-border last:border-0 ${
                  activeSection === item.id
                    ? item.danger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
                    : item.danger ? 'text-danger hover:bg-danger/5' : 'text-text-secondary hover:bg-dark-card-2 hover:text-text-primary'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-dark-card border border-dark-border rounded-xl p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
