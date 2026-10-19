import React from 'react';
import { X } from 'lucide-react';

export default function ViewServiceDetailsPopup({ node, onClose }) {
  const service = node || {
    label: 'Payment Service',
    type: 'API',
    version: 'v1.2.0',
    owner: 'Krishna Singh',
    deps: 6,
    dependents: 3,
    responseTime: '245ms',
    desc: 'Handles all payment processing and transactions',
    color: '#F59E0B',
  };

  const fields = [
    { label: 'Type', value: service.type || 'API' },
    { label: 'Version', value: service.version || 'v1.2.0' },
    { label: 'Owner', value: service.owner || 'Krishna Singh' },
    { label: 'Created At', value: 'May 10, 2024 10:30 AM' },
    { label: 'Last Updated', value: 'May 17, 2024 02:15 PM' },
    { label: 'Dependencies', value: service.deps ?? 6 },
    { label: 'Dependents', value: service.dependents ?? 3 },
    { label: 'Response Time', value: service.responseTime || '245ms' },
    { label: 'Description', value: service.desc || 'Handles all payment processing and transactions' },
    { label: 'Tags', value: 'Payment, Critical, Core' },
    { label: 'Repository', value: 'https://github.com/company/payment-service' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">View Service Details</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: service.color || '#3B82F6' }}
              >
                {(service.label || 'P').charAt(0)}
              </div>
              <span className="text-base font-semibold text-text-primary">{service.label || 'Payment Service'}</span>
            </div>
            <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">Healthy</span>
          </div>

          <div className="space-y-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-sm text-text-muted w-28 flex-shrink-0">{label}</span>
                <span className={`text-sm flex-1 ${label === 'Repository' ? 'text-primary text-xs break-all' : 'text-text-secondary'}`}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-dark-border">
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
