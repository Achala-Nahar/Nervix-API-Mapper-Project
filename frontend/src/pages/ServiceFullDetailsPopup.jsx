import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const depCards = [
  { name: 'Auth Service', health: 'Warning', color: 'bg-warning' },
  { name: 'User Service', health: 'Warning', color: 'bg-warning' },
  { name: 'Inventory Service', health: 'Healthy', color: 'bg-success' },
  { name: 'Notification Service', health: 'Healthy', color: 'bg-success' },
  { name: 'Database', health: 'Healthy', color: 'bg-success' },
  { name: 'Redis Cache', health: 'Healthy', color: 'bg-success' },
];

export default function ServiceFullDetailsPopup({ node, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = ['Overview', 'Dependencies', 'Metrics', 'Alerts', 'Configuration'];

  const service = node || {
    label: 'Payment Service',
    type: 'API',
    version: 'v1.3.0',
    owner: 'Krishna Singh',
    deps: 6,
    dependents: 3,
    responseTime: '245ms',
    desc: 'Handles all payment processing and transactions',
    color: '#F59E0B',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-dark-border flex-shrink-0">
          <h2 className="text-base font-semibold text-text-primary">Service Details - {service.label || 'Payment Service'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 border-b border-dark-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: service.color || '#F59E0B' }}
              >
                {(service.label || 'P').charAt(0)}
              </div>
              <span className="text-sm font-semibold text-text-primary">{service.label || 'Payment Service'}</span>
              <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">Healthy</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink size={12} />
              Open In Services
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-5 border-b border-dark-border flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">General Information</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Service Type', value: service.type || 'API' },
                      { label: 'Version', value: service.version || 'v1.3.0' },
                      { label: 'Owner', value: service.owner || 'Krishna Singh' },
                      { label: 'Environment', value: 'Production' },
                      { label: 'Created At', value: 'May 10, 2024 10:30 AM' },
                      { label: 'Last Updated', value: 'May 12, 2024 02:15 PM' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start gap-2">
                        <span className="text-xs text-text-muted w-28 flex-shrink-0">{label}</span>
                        <span className="text-xs text-text-secondary">{value}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 pt-1">
                      <span className="text-xs text-text-muted w-28 flex-shrink-0">Description</span>
                      <span className="text-xs text-text-secondary leading-relaxed">
                        {service.desc || 'Handles all payment processing and transactions'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Health & Performance</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted w-28 flex-shrink-0">Status</span>
                      <span className="text-xs font-medium text-success">Healthy</span>
                    </div>
                    {[
                      { label: 'Response Time', value: service.responseTime || '245ms' },
                      { label: 'Error Rate', value: '0.2%' },
                      { label: 'Throughput', value: '120 req/s' },
                      { label: 'Uptime', value: '99.98%' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-28 flex-shrink-0">{label}</span>
                        <span className="text-xs text-text-secondary">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-3">Dependencies ({service.deps || 6})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {depCards.map((dep) => (
                    <div key={dep.name} className="flex items-center gap-2 p-2 bg-dark-card-2 border border-dark-border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${dep.color} flex-shrink-0`}></div>
                      <div>
                        <div className="text-xs font-medium text-text-primary">{dep.name}</div>
                        <div className={`text-xs ${dep.health === 'Healthy' ? 'text-success' : 'text-warning'}`}>{dep.health}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="text-sm text-text-muted flex items-center justify-center h-32">
              Dependencies view coming soon
            </div>
          )}
          {activeTab === 'metrics' && (
            <div className="text-sm text-text-muted flex items-center justify-center h-32">
              Metrics view coming soon
            </div>
          )}
          {activeTab === 'alerts' && (
            <div className="text-sm text-text-muted flex items-center justify-center h-32">
              Alerts view coming soon
            </div>
          )}
          {activeTab === 'configuration' && (
            <div className="text-sm text-text-muted flex items-center justify-center h-32">
              Configuration view coming soon
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-dark-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
