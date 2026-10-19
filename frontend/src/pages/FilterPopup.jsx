import React, { useState } from 'react';
import { X } from 'lucide-react';

const healthOptions = ['Healthy', 'Warning', 'Critical', 'Unknown'];
const typeOptions = ['API', 'Gateway', 'Database', 'Cache', 'Queue', 'Event'];

export default function FilterPopup({ onClose, onApply }) {
  const [search, setSearch] = useState('');
  const [health, setHealth] = useState({ Healthy: false, Warning: false, Critical: false, Unknown: false });
  const [types, setTypes] = useState({ API: false, Gateway: false, Database: false, Cache: false, Queue: false, Event: false });
  const [hasDeps, setHasDeps] = useState(false);
  const [noDeps, setNoDeps] = useState(false);
  const [owner, setOwner] = useState('All Owners');
  const [version, setVersion] = useState('');

  const toggleHealth = (key) => setHealth((h) => ({ ...h, [key]: !h[key] }));
  const toggleType = (key) => setTypes((t) => ({ ...t, [key]: !t[key] }));

  const handleReset = () => {
    setSearch('');
    setHealth({ Healthy: false, Warning: false, Critical: false, Unknown: false });
    setTypes({ API: false, Gateway: false, Database: false, Cache: false, Queue: false, Event: false });
    setHasDeps(false);
    setNoDeps(false);
    setOwner('All Owners');
    setVersion('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Filter Services</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Search Services</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by service name..."
              className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Health Status</label>
              <div className="space-y-2">
                {healthOptions.map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => toggleHealth(opt)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                        health[opt] ? 'bg-primary border-primary' : 'border-dark-border bg-dark-card-2'
                      }`}
                    >
                      {health[opt] && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        opt === 'Healthy' ? 'bg-success' :
                        opt === 'Warning' ? 'bg-warning' :
                        opt === 'Critical' ? 'bg-danger' : 'bg-text-muted'
                      }`}></div>
                      <span className="text-sm text-text-secondary">{opt}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">Service Type</label>
              <div className="space-y-2">
                {typeOptions.map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => toggleType(opt)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                        types[opt] ? 'bg-primary border-primary' : 'border-dark-border bg-dark-card-2'
                      }`}
                    >
                      {types[opt] && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-text-secondary">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Dependencies</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setHasDeps(!hasDeps)}
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    hasDeps ? 'bg-primary border-primary' : 'border-dark-border bg-dark-card-2'
                  }`}
                >
                  {hasDeps && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-text-secondary">Has Dependencies</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setNoDeps(!noDeps)}
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    noDeps ? 'bg-primary border-primary' : 'border-dark-border bg-dark-card-2'
                  }`}
                >
                  {noDeps && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-text-secondary">No Dependencies</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Owner</label>
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option>All Owners</option>
                <option>Krishna Singh</option>
                <option>John Doe</option>
                <option>Smith Johnson</option>
                <option>Emily Davis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Version</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select version</option>
                <option>v1.0.0</option>
                <option>v1.1.0</option>
                <option>v1.2.0</option>
                <option>v1.3.0</option>
                <option>v2.0.0</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Created At</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="flex-1 px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              />
              <span className="text-text-muted text-sm">–</span>
              <input
                type="date"
                className="flex-1 px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-dark-border">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-dark-border rounded-lg hover:border-primary transition-colors"
          >
            Reset
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onApply?.(); onClose(); }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
