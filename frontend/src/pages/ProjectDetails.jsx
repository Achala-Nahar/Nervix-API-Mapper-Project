import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Edit2, Clock, Shield, Filter, Plus, Link2,
  Search, Layers, ZoomIn, ZoomOut, Maximize2,
  Pencil, Trash2, ExternalLink, Sparkles, X, Activity,
} from 'lucide-react';
import EditProjectPopup from './EditProjectPopup';
import AddServicePopup from './AddServicePopup';
import FilterPopup from './FilterPopup';
import ViewServiceDetailsPopup from './ViewServiceDetailsPopup';
import ServiceFullDetailsPopup from './ServiceFullDetailsPopup';
import {
  deleteDependency, deleteService, getDependencySummary, getProjectTeam,
  getServiceSummary, listDependencies, listServices, getProjectGraph, runProjectHealthCheck,
  stopManagedRuntime, restartManagedRuntime,
  degradeManagedRuntime, listIncidents, getIncidentSummary,
} from '../api';

/* ─── Static data ─── */

const projectServices = [
  { name: 'API Gateway', type: 'Gateway', version: 'v1.2.0', health: 'Healthy', dependencies: 3, dependents: 5, owner: 'Krishna Singh' },
  { name: 'Auth Service', type: 'API', version: 'v1.0.0', health: 'Healthy', dependencies: 4, dependents: 6, owner: 'John Doe' },
  { name: 'User Service', type: 'API', version: 'v1.0.0', health: 'Healthy', dependencies: 5, dependents: 4, owner: 'John One' },
  { name: 'Payment Service', type: 'API', version: 'v1.3.0', health: 'Healthy', dependencies: 6, dependents: 3, owner: 'Krishna Singh' },
  { name: 'Inventory Service', type: 'API', version: 'v1.1.0', health: 'Healthy', dependencies: 5, dependents: 2, owner: 'Smith Johnson' },
  { name: 'Notification Service', type: 'API', version: 'v1.0.0', health: 'Healthy', dependencies: 2, dependents: 1, owner: 'Emily Davis' },
  { name: 'Database', type: 'Database', version: 'v1.0', health: 'Healthy', dependencies: 0, dependents: 8, owner: 'Krishna Singh' },
  { name: 'Redis Cache', type: 'Cache', version: 'v1.0', health: 'Healthy', dependencies: 0, dependents: 3, owner: 'Smith Johnson' },
  { name: 'Order Service', type: 'API', version: 'v1.1.0', health: 'Healthy', dependencies: 4, dependents: 2, owner: 'John Doe' },
];

const projectDependencies = [
  { source: 'API Gateway', target: 'Auth Service', type: 'REST API', criticality: 'High', latency: 120, createdAt: 'May 10, 2024' },
  { source: 'Auth Service', target: 'User Service', type: 'REST API', criticality: 'High', latency: 80, createdAt: 'May 10, 2024' },
  { source: 'User Service', target: 'Database', type: 'Database', criticality: 'Critical', latency: 15, createdAt: 'May 10, 2024' },
  { source: 'Payment Service', target: 'Notification Service', type: 'Event', criticality: 'Medium', latency: 200, createdAt: 'May 10, 2024' },
  { source: 'Inventory Service', target: 'Notification Service', type: 'Event', criticality: 'Medium', latency: 160, createdAt: 'May 10, 2024' },
  { source: 'Inventory Service', target: 'Database', type: 'Database', criticality: 'Critical', latency: 30, createdAt: 'May 10, 2024' },
  { source: 'Order Service', target: 'Payment Service', type: 'REST API', criticality: 'High', latency: 185, createdAt: 'May 10, 2024' },
];

const graphNodes = [
  { id: 'api-gateway', label: 'API Gateway', x: 370, y: 70, color: '#3B82F6', type: 'Gateway', version: 'v1.2.0', owner: 'Krishna Singh', deps: 3, dependents: 0, responseTime: '120ms', desc: 'Main API gateway for routing requests' },
  { id: 'auth-service', label: 'Auth Service', x: 200, y: 190, color: '#10B981', type: 'API', version: 'v1.0.0', owner: 'John Doe', deps: 4, dependents: 6, responseTime: '80ms', desc: 'Handles authentication and authorization' },
  { id: 'user-service', label: 'User Service', x: 540, y: 190, color: '#10B981', type: 'API', version: 'v1.0.0', owner: 'John One', deps: 5, dependents: 4, responseTime: '95ms', desc: 'User profile and account management' },
  { id: 'order-service', label: 'Order Service', x: 160, y: 330, color: '#10B981', type: 'API', version: 'v1.1.0', owner: 'John Doe', deps: 4, dependents: 2, responseTime: '150ms', desc: 'Manages order lifecycle and processing' },
  { id: 'payment-service', label: 'Payment Service', x: 370, y: 330, color: '#F59E0B', type: 'API', version: 'v2.2.1', owner: 'Krishna Singh', deps: 6, dependents: 3, responseTime: '245ms', desc: 'Handles all payment processing and transactions' },
  { id: 'inventory-service', label: 'Inventory Service', x: 580, y: 330, color: '#F59E0B', type: 'API', version: 'v1.1.0', owner: 'Smith Johnson', deps: 5, dependents: 2, responseTime: '160ms', desc: 'Tracks inventory levels and updates' },
  { id: 'notification-service', label: 'Notification Service', x: 370, y: 450, color: '#10B981', type: 'API', version: 'v1.0.0', owner: 'Emily Davis', deps: 2, dependents: 1, responseTime: '200ms', desc: 'Sends notifications via email and SMS' },
  { id: 'database', label: 'Database', x: 250, y: 540, color: '#10B981', type: 'Database', version: 'v1.0', owner: 'Krishna Singh', deps: 0, dependents: 8, responseTime: '15ms', desc: 'Primary PostgreSQL database' },
  { id: 'redis-cache', label: 'Redis Cache', x: 490, y: 540, color: '#EF4444', type: 'Cache', version: 'v1.0', owner: 'Smith Johnson', deps: 0, dependents: 3, responseTime: '5ms', desc: 'In-memory caching layer' },
];

const graphEdges = [
  { from: 'api-gateway', to: 'auth-service' },
  { from: 'api-gateway', to: 'user-service' },
  { from: 'api-gateway', to: 'order-service' },
  { from: 'api-gateway', to: 'payment-service' },
  { from: 'api-gateway', to: 'inventory-service' },
  { from: 'auth-service', to: 'user-service' },
  { from: 'user-service', to: 'database' },
  { from: 'order-service', to: 'payment-service' },
  { from: 'order-service', to: 'inventory-service' },
  { from: 'payment-service', to: 'notification-service' },
  { from: 'inventory-service', to: 'notification-service' },
  { from: 'notification-service', to: 'database' },
  { from: 'payment-service', to: 'database' },
];

/* ─── Helpers ─── */

const healthBadge = (h) => ({ Healthy: 'bg-success/10 text-success', HEALTHY: 'bg-success/10 text-success', Warning: 'bg-warning/10 text-warning', WARNING: 'bg-warning/10 text-warning', Error: 'bg-danger/10 text-danger', ERROR: 'bg-danger/10 text-danger', UNKNOWN: 'bg-dark-card-2 text-text-muted' }[h] || 'bg-dark-card-2 text-text-muted');
const critBadge = (c) => ({ Critical: 'bg-danger/10 text-danger', CRITICAL: 'bg-danger/10 text-danger', High: 'bg-warning/10 text-warning', HIGH: 'bg-warning/10 text-warning', Medium: 'bg-amber-500/10 text-amber-400', MEDIUM: 'bg-amber-500/10 text-amber-400', Low: 'bg-success/10 text-success', LOW: 'bg-success/10 text-success' }[c] || 'bg-dark-card-2 text-text-muted');

/* ─── Tab components ─── */

function OverviewTab({ services, dependencies, summary, dependencySummary, incidents = [], incidentSummary }) {
  const total = summary?.total ?? services.length;
  const health = summary?.byHealth || {};
  const serviceHealthSummary = [
    { label: 'Healthy', value: health.HEALTHY || 0, color: 'bg-success' },
    { label: 'Warning', value: health.WARNING || 0, color: 'bg-warning' },
    { label: 'Error', value: health.ERROR || 0, color: 'bg-danger' },
    { label: 'Unknown', value: health.UNKNOWN || 0, color: 'bg-dark-border' },
  ].map((item) => ({ ...item, percent: total ? `${Math.round((item.value / total) * 100)}%` : '0%' }));
  const types = summary?.byType || {};
  const criticalDependencies = dependencies.filter((dependency) => dependency.criticality === 'CRITICAL').length;
  const maximumImpact = services.reduce((maximum, service) => {
    const visited = new Set([service.id]);
    const queue = [service.id];
    while (queue.length) {
      const target = queue.shift();
      dependencies.filter((dependency) => dependency.targetServiceId === target)
        .forEach((dependency) => {
          if (!visited.has(dependency.sourceServiceId)) {
            visited.add(dependency.sourceServiceId);
            queue.push(dependency.sourceServiceId);
          }
        });
    }
    return Math.max(maximum, visited.size - 1);
  }, 0);
  const blastRadiusScore = total > 1 ? Math.round((maximumImpact / (total - 1)) * 100) : 0;
  const serviceArchSummary = [
    { label: 'Total Nodes', value: total },
    { label: 'APIs', value: types.API || 0 },
    { label: 'Databases', value: types.DATABASE || 0 },
    { label: 'Caches', value: types.CACHE || 0 },
    { label: 'Gateways', value: types.GATEWAY || 0 },
    { label: 'Queues', value: types.QUEUE || 0 },
    { label: 'Dependencies', value: dependencySummary?.total || 0 },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Services', value: total, color: 'bg-primary' },
          { label: 'Dependencies', value: dependencySummary?.total || 0, color: 'bg-purple-500' },
          { label: 'Critical Dependencies', value: criticalDependencies, color: 'bg-danger' },
          { label: 'Blast Radius Score', value: `${blastRadiusScore}%`, color: 'bg-warning', sub: `${maximumImpact} service${maximumImpact === 1 ? '' : 's'} maximum impact` },
          { label: 'Active Incidents', value: incidentSummary?.active || 0, color: 'bg-danger', sub: `${incidentSummary?.unacknowledged || 0} awaiting acknowledgement` },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 ${stat.color} rounded-full`}></div>
              <span className="text-sm text-text-muted">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
            {stat.sub && <div className="text-xs text-danger mt-1">{stat.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Services Health Summary</h3>
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1F2937" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray="201.06 251.33" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray="50.27 251.33" strokeDashoffset="-201.06" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="12" strokeDasharray="37.70 251.33" strokeDashoffset="-251.33" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-text-primary">{total}</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {serviceHealthSummary.map((h) => (
                <div key={h.label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${h.color}`}></div>
                  <span className="text-xs text-text-secondary">{h.label}</span>
                  <span className="text-xs text-text-muted">{h.value} ({h.percent})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Architecture Summary</h3>
          <div className="space-y-2">
            {serviceArchSummary.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1 border-b border-dark-border/50 last:border-0">
                <span className="text-sm text-text-secondary">{row.label}</span>
                <span className="text-sm font-medium text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Recent Faults</h3>
            <span className="text-xs text-text-muted">{incidentSummary?.resolved || 0} resolved</span>
          </div>
          <div className="space-y-3">
            {incidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${incident.severity === 'CRITICAL' ? 'bg-danger' : incident.severity === 'HIGH' ? 'bg-warning' : 'bg-primary'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-secondary truncate">{incident.title}</div>
                  <div className="text-xs text-text-muted">{incident.serviceName} · {incident.category}</div>
                </div>
                <div className="text-xs text-text-muted flex-shrink-0">{incident.status}</div>
              </div>
            ))}
            {!incidents.length && <div className="text-sm text-text-muted">No incidents have been detected for this project.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesTab({ services, loading, error, canEdit, canManage, onAddService, onEditService, onDeleteService, onAddDependency }) {
  const [showFilter, setShowFilter] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const filteredServices = services.filter((service) =>
    (service.name.toLowerCase().includes(serviceSearch.toLowerCase())
      || (service.ownerName || '').toLowerCase().includes(serviceSearch.toLowerCase()))
    && (typeFilter === 'ALL' || service.serviceType === typeFilter)
    && (healthFilter === 'ALL' || service.healthStatus === healthFilter));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setShowFilter((value) => !value)}
          className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
        >
          <Filter size={14} />
          Filter
        </button>
        {canEdit && <button
          onClick={onAddDependency}
          className="flex items-center gap-2 px-4 py-2 bg-dark-card-2 border border-dark-border hover:border-primary text-text-primary rounded-lg text-sm font-medium transition-colors"
        >
          <Link2 size={16} />
          Add Dependency
        </button>}
        {canEdit && <button
          onClick={onAddService}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Service
        </button>}
      </div>

      {showFilter && <div className="grid grid-cols-3 gap-3 bg-dark-card border border-dark-border rounded-xl p-4">
        <input value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder="Search name or owner…"
          className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary" />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
          <option value="ALL">All service types</option>
          {[...new Set(services.map((service) => service.serviceType))].map((type) => <option key={type}>{type}</option>)}
        </select>
        <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
          <option value="ALL">All health states</option>
          {['HEALTHY', 'WARNING', 'ERROR', 'UNKNOWN'].map((health) => <option key={health}>{health}</option>)}
        </select>
      </div>}

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {error && <div className="p-4 text-danger text-sm">{error}</div>}
        {loading && <div className="p-10 text-center text-text-muted">Loading services…</div>}
        {!loading && !filteredServices.length && <div className="p-10 text-center text-text-muted">{services.length ? 'No services match the filters.' : 'No services in this project yet.'}</div>}
        {!loading && filteredServices.length > 0 &&
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              {['Service Name', 'Type', 'Version', 'Health', 'Dependencies', 'Dependents', 'Owner', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs text-text-muted font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((svc) => (
              <tr key={svc.id} className="border-b border-dark-border/50 hover:bg-dark-card-2/50 transition-colors">
                <td className="px-4 py-3"><span className="text-sm text-text-primary font-medium">{svc.name}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{svc.serviceType}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-muted font-mono">{svc.versionLabel}</span></td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${healthBadge(svc.healthStatus)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {svc.healthStatus}
                  </span>
                </td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{svc.dependencyCount}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{svc.dependentCount}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{svc.ownerName || 'Unassigned'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {canEdit && <button onClick={() => onEditService(svc)} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"><Pencil size={13} /></button>}
                    {svc.repositoryUrl && <a href={svc.repositoryUrl} target="_blank" rel="noreferrer" className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"><ExternalLink size={13} /></a>}
                    {canManage && <button onClick={() => onDeleteService(svc)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"><Trash2 size={13} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

    </div>
  );
}

function DependenciesTab({ dependencies, loading, error, canEdit, onAddDependency, onDeleteDependency }) {
  const [showFilter, setShowFilter] = useState(false);
  const [dependencySearch, setDependencySearch] = useState('');
  const [dependencyTypeFilter, setDependencyTypeFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');
  const filteredDependencies = dependencies.filter((dependency) =>
    (`${dependency.sourceServiceName} ${dependency.targetServiceName}`.toLowerCase().includes(dependencySearch.toLowerCase()))
    && (dependencyTypeFilter === 'ALL' || dependency.dependencyType === dependencyTypeFilter)
    && (criticalityFilter === 'ALL' || dependency.criticality === criticalityFilter));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => setShowFilter((value) => !value)}
          className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
        >
          <Filter size={14} />
          Filter
        </button>
        {canEdit && <button
          onClick={onAddDependency}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Dependency
        </button>}
      </div>

      {showFilter && <div className="grid grid-cols-3 gap-3 bg-dark-card border border-dark-border rounded-xl p-4">
        <input value={dependencySearch} onChange={(event) => setDependencySearch(event.target.value)} placeholder="Search source or target…"
          className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary" />
        <select value={dependencyTypeFilter} onChange={(event) => setDependencyTypeFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
          <option value="ALL">All dependency types</option>
          {[...new Set(dependencies.map((dependency) => dependency.dependencyType))].map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
        </select>
        <select value={criticalityFilter} onChange={(event) => setCriticalityFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
          <option value="ALL">All criticalities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((criticality) => <option key={criticality}>{criticality}</option>)}
        </select>
      </div>}

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {error && <div className="p-4 text-danger text-sm">{error}</div>}
        {loading && <div className="p-10 text-center text-text-muted">Loading dependencies…</div>}
        {!loading && !filteredDependencies.length && <div className="p-10 text-center text-text-muted">{dependencies.length ? 'No dependencies match the filters.' : 'No dependencies in this project yet.'}</div>}
        {!loading && filteredDependencies.length > 0 &&
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              {['Source Service', 'Target Service', 'Type', 'Criticality', 'Protocol', 'Direction', 'Latency', 'Created At', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs text-text-muted font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDependencies.map((dep) => (
              <tr key={dep.id} className="border-b border-dark-border/50 hover:bg-dark-card-2/50 transition-colors">
                <td className="px-4 py-3"><span className="text-sm text-text-primary font-medium">{dep.sourceServiceName}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{dep.targetServiceName}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{dep.dependencyType.replaceAll('_', ' ')}</span></td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${critBadge(dep.criticality)}`}>{dep.criticality}</span>
                </td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{dep.communicationProtocol}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{dep.direction.replaceAll('_', ' ')}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-secondary">{dep.latencyMs == null ? '—' : `${dep.latencyMs}ms`}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-text-muted">{new Date(dep.createdAt).toLocaleDateString()}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span title={dep.description || `${dep.sourceServiceName} → ${dep.targetServiceName}`} className="p-1.5 text-text-muted"><Link2 size={13} /></span>
                    {canEdit && <button onClick={() => onDeleteDependency(dep)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"><Trash2 size={13} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

    </div>
  );
}

function LiveGraphTab({ project, canEdit, revision, onBlastRadius, onProjectDataChanged }) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [graphTypeFilter, setGraphTypeFilter] = useState('ALL');
  const [graphHealthFilter, setGraphHealthFilter] = useState('ALL');
  const [layout, setLayout] = useState('circular');
  const [zoom, setZoom] = useState(1);
  const [impactPreviewRoot, setImpactPreviewRoot] = useState(null);
  const graphPanelRef = useRef(null);

  const load = async () => {
    if (!project?.workspaceId || !project?.id || project?.demo) {
      setGraph({ nodes: [], edges: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await getProjectGraph(project.workspaceId, project.id);
      setGraph(result);
      setSelected((current) => result.nodes.find((node) => node.id === current?.id) || result.nodes[0] || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [project?.workspaceId, project?.id, project?.demo, revision]);
  useEffect(() => {
    if (!project?.workspaceId || !project?.id || project?.demo) return undefined;
    const timer = window.setInterval(() => getProjectGraph(project.workspaceId, project.id)
      .then((result) => {
        setGraph(result);
        setSelected((current) => result.nodes.find((node) => node.id === current?.id) || result.nodes[0] || null);
      }).catch(() => {}), 30000);
    return () => window.clearInterval(timer);
  }, [project?.workspaceId, project?.id, project?.demo]);

  const monitorHealth = async () => {
    setMonitoring(true);
    setError('');
    try {
      await runProjectHealthCheck(project.workspaceId, project.id);
      const result = await getProjectGraph(project.workspaceId, project.id);
      setGraph(result);
      setSelected((current) => result.nodes.find((node) => node.id === current?.id) || result.nodes[0] || null);
      setShowHealthMonitor(true);
      onProjectDataChanged?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setMonitoring(false);
    }
  };

  const closeHealthMonitor = async () => {
    setShowHealthMonitor(false);
    await load();
    onProjectDataChanged?.();
  };

  const visibleNodes = graph.nodes.filter((node) =>
    node.name.toLowerCase().includes(search.toLowerCase())
      || node.serviceType.toLowerCase().includes(search.toLowerCase()))
    .filter((node) => (graphTypeFilter === 'ALL' || node.serviceType === graphTypeFilter)
      && (graphHealthFilter === 'ALL' || node.healthStatus === graphHealthFilter));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const positions = Object.fromEntries(visibleNodes.map((node, index) => {
    if (layout === 'grid') {
      const columns = Math.max(1, Math.ceil(Math.sqrt(visibleNodes.length)));
      return [node.id, { x: 150 + (index % columns) * 210, y: 120 + Math.floor(index / columns) * 150 }];
    }
    const angle = (Math.PI * 2 * index) / Math.max(visibleNodes.length, 1) - Math.PI / 2;
    return [node.id, { x: 390 + Math.cos(angle) * 240, y: 275 + Math.sin(angle) * 190 }];
  }));
  const edges = graph.edges.filter((edge) => visibleIds.has(edge.sourceServiceId) && visibleIds.has(edge.targetServiceId));
  const incoming = selected ? graph.edges.filter((edge) => edge.targetServiceId === selected.id) : [];
  const outgoing = selected ? graph.edges.filter((edge) => edge.sourceServiceId === selected.id) : [];
  const nodeName = (id) => graph.nodes.find((node) => node.id === id)?.name || 'Unknown';
  const color = (health) => ({ HEALTHY: '#10B981', WARNING: '#F59E0B', ERROR: '#EF4444', PENDING: '#38BDF8', UNKNOWN: '#64748B' }[health] || '#3B82F6');
  const insights = analyzeArchitecture(graph.nodes, graph.edges);
  const previewImpacts = calculateImpactPreview(impactPreviewRoot, graph.edges);
  const previewRootNode = graph.nodes.find((node) => node.id === impactPreviewRoot);
  const previewDirect = graph.nodes.filter((node) => previewImpacts[node.id]?.level === 'DIRECT_AT_RISK');
  const previewIndirect = graph.nodes.filter((node) => previewImpacts[node.id]?.level === 'INDIRECT_AT_RISK');
  const displayedImpact = (node) => previewImpacts[node.id] || (node.dependencyImpact !== 'CLEAR'
    ? { level: node.dependencyImpact, depth: node.impactDepth, sourceName: node.impactSourceName }
    : null);

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Search services in graph…"
          className="w-full pl-9 pr-4 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary" />
      </div>
      <div className="flex items-center gap-2">
      <button onClick={() => setShowFilter((value) => !value)} className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary flex items-center gap-2">
        <Filter size={14} />Filter
      </button>
      <button onClick={() => setLayout((value) => value === 'circular' ? 'grid' : 'circular')}
        className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary flex items-center gap-2">
        <Layers size={14} />{layout === 'circular' ? 'Grid Layout' : 'Circular Layout'}
      </button>
      <button onClick={monitorHealth} disabled={monitoring}
        className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2">
        <Activity size={15} />{monitoring ? 'Checking…' : 'Health Monitoring'}
      </button>
      <button onClick={() => onBlastRadius()} className="px-4 py-2 bg-danger hover:bg-red-600 text-white rounded-lg text-sm font-medium">
        Blast Radius Analysis
      </button>
      <button onClick={() => setShowInsights(true)}
        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm flex items-center gap-2">
        <Sparkles size={15} /> Architecture Insights
      </button>
      </div>
    </div>
    {showFilter && <div className="grid grid-cols-2 gap-3 bg-dark-card border border-dark-border rounded-xl p-4">
      <select value={graphTypeFilter} onChange={(event) => setGraphTypeFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
        <option value="ALL">All service types</option>
        {[...new Set(graph.nodes.map((node) => node.serviceType))].map((type) => <option key={type}>{type}</option>)}
      </select>
      <select value={graphHealthFilter} onChange={(event) => setGraphHealthFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
        <option value="ALL">All health states</option>
        {['HEALTHY', 'WARNING', 'ERROR', 'PENDING', 'UNKNOWN'].map((health) => <option key={health}>{health}</option>)}
      </select>
    </div>}
    {error && <div className="p-4 rounded-lg bg-danger/10 text-danger text-sm">{error}</div>}
    {loading ? <div className="p-16 text-center text-text-muted">Loading project graph…</div>
      : !graph.nodes.length ? <div className="p-16 text-center bg-dark-card border border-dark-border rounded-xl text-text-muted">
          Create services and dependencies to build this project graph.
        </div>
      : <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-4">
        <div ref={graphPanelRef} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-4">
              {[['bg-success', 'Healthy'], ['bg-warning', 'Warning'], ['bg-danger', 'Error'], ['bg-sky-400', 'Pending'], ['bg-slate-500', 'Unknown']].map(([badge, label]) =>
                <div key={label} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${badge}`} /><span className="text-xs text-text-secondary">{label}</span></div>)}
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-orange-500" /><span className="text-xs text-text-secondary">Direct impact</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-purple-500" /><span className="text-xs text-text-secondary">Indirect impact</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-red-500" /><span className="text-xs text-text-secondary">Preview failure source</span></div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom((value) => Math.max(.6, value - .2))} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded"><ZoomOut size={14} /></button>
              <button onClick={() => setZoom((value) => Math.min(1.8, value + .2))} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded"><ZoomIn size={14} /></button>
              <button onClick={() => graphPanelRef.current?.requestFullscreen?.()} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded"><Maximize2 size={14} /></button>
            </div>
          </div>
          <svg viewBox="0 0 780 550" className="w-full min-h-[550px]">
            <defs><marker id="live-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#64748B" /></marker></defs>
            <g transform={`translate(${390 * (1 - zoom)} ${275 * (1 - zoom)}) scale(${zoom})`}>
            {edges.map((edge) => {
              const from = positions[edge.sourceServiceId], to = positions[edge.targetServiceId];
              return <g key={edge.id}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#475569" strokeWidth="2" markerEnd="url(#live-arrow)" />
                <title>{edge.dependencyType} · {edge.criticality} · {edge.communicationProtocol}</title>
              </g>;
            })}
            {visibleNodes.map((node) => {
              const point = positions[node.id], active = selected?.id === node.id;
              const impact = displayedImpact(node);
              return <g key={node.id} onClick={() => setSelected(node)} className="cursor-pointer">
                {impact && <circle cx={point.x} cy={point.y} r="30" fill="none"
                  stroke={impact.level === 'ROOT_FAILURE' ? '#EF4444' : impact.level === 'DIRECT_AT_RISK' ? '#F97316' : '#A855F7'} strokeWidth="4"
                  strokeDasharray={impact.level === 'ROOT_FAILURE' || impact.depth > 1 ? '6 4' : undefined} />}
                <circle cx={point.x} cy={point.y} r={active ? 26 : 22} fill={color(node.healthStatus)} fillOpacity=".16" stroke={color(node.healthStatus)} strokeWidth={active ? 4 : 2} />
                <circle cx={point.x} cy={point.y} r="9" fill={color(node.healthStatus)} />
                <text x={point.x} y={point.y + 34} textAnchor="middle" fill="#CBD5E1" fontSize="11" fontWeight="600">{node.name.length > 20 ? `${node.name.slice(0, 18)}…` : node.name}</text>
                {impact && <text x={point.x} y={point.y - 36} textAnchor="middle"
                  fill={impact.level === 'ROOT_FAILURE' ? '#EF4444' : impact.level === 'DIRECT_AT_RISK' ? '#F97316' : '#A855F7'} fontSize="9" fontWeight="700">
                  {impact.level === 'ROOT_FAILURE' ? 'FAILURE SOURCE' : impact.level === 'DIRECT_AT_RISK' ? 'DIRECT D1' : `INDIRECT D${impact.depth}`}
                </text>}
              </g>;
            })}
            </g>
          </svg>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 space-y-4">
          {!selected ? <div className="text-sm text-text-muted">Select a service node.</div> : <>
            <div><div className="text-lg font-semibold text-text-primary">{selected.name}</div>
              <div className="text-xs text-text-muted mt-1">{selected.serviceType} · {selected.versionLabel}</div></div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Dependencies" value={selected.dependencyCount} />
              <Metric label="Dependents" value={selected.dependentCount} />
              <Metric label="Health" value={selected.healthStatus} />
              <Metric label="Lifecycle" value={selected.lifecycleStatus} />
            </div>
            <div className="space-y-2 text-xs">
              <div><span className="text-text-muted">Endpoint:</span> <span className="text-text-secondary break-all">{selected.endpointUrl || 'Not configured'}</span></div>
              <div><span className="text-text-muted">Last check:</span> <span className="text-text-secondary">{selected.lastHealthCheckAt ? new Date(selected.lastHealthCheckAt).toLocaleString() : 'Never'}</span></div>
              <div><span className="text-text-muted">Response:</span> <span className="text-text-secondary">{selected.responseTimeMs == null ? 'No response' : `${selected.responseTimeMs}ms`}</span></div>
              <div><span className="text-text-muted">Observation:</span> <span className="text-text-secondary">{selected.healthMessage || 'No health evidence yet'}</span></div>
              {selected.impactSourceName && <div className="p-2 bg-warning/10 text-warning rounded">At risk because {selected.impactSourceName} failed · depth {selected.impactDepth}</div>}
            </div>
            <div><div className="text-xs text-text-muted mb-2">Outgoing relationships</div>
              {outgoing.length ? outgoing.map((edge) => <div key={edge.id} className="text-xs text-text-secondary py-1">→ {nodeName(edge.targetServiceId)} · {edge.dependencyType}</div>)
                : <div className="text-xs text-text-muted">None</div>}</div>
            <div><div className="text-xs text-text-muted mb-2">Incoming relationships</div>
              {incoming.length ? incoming.map((edge) => <div key={edge.id} className="text-xs text-text-secondary py-1">← {nodeName(edge.sourceServiceId)} · {edge.dependencyType}</div>)
                : <div className="text-xs text-text-muted">None</div>}</div>
            <button onClick={() => setImpactPreviewRoot((value) => value === selected.id ? null : selected.id)} className="w-full px-3 py-2 text-xs text-warning border border-warning/30 rounded-lg hover:bg-warning/10">{impactPreviewRoot === selected.id ? 'Clear impact preview' : 'Preview direct & indirect impact'}</button>
            <button onClick={() => onBlastRadius(selected.id)} className="w-full px-3 py-2 text-xs text-danger border border-danger/30 rounded-lg hover:bg-danger/10">Open Blast Radius Analysis</button>
          </>}
        </div>
      </div>}
    <div className="text-xs text-text-muted">{graph.nodes.length} nodes · {graph.edges.length} relationships</div>
    {impactPreviewRoot && <div className="p-4 text-xs bg-dark-card border border-warning/25 rounded-lg space-y-2">
      <div className="font-semibold text-text-primary">Impact analysis for {previewRootNode?.name || 'selected service'}</div>
      <div className="text-danger">The dashed red ring identifies the hypothetical failure source.</div>
      {previewDirect.length ? <div className="text-warning"><strong>Direct impact:</strong> {previewDirect.map((node) => node.name).join(', ')} directly consume this provider through HIGH or CRITICAL relationships.</div>
        : <div className="text-text-secondary"><strong>No direct impact found:</strong> no service consumes {previewRootNode?.name} through a HIGH or CRITICAL dependency. Incoming arrows with LOW/MEDIUM criticality are intentionally excluded.</div>}
      {previewIndirect.length ? <div className="text-purple-400"><strong>Indirect impact:</strong> {previewIndirect.map((node) => `${node.name} (depth ${previewImpacts[node.id].depth})`).join(', ')} depend on it through one or more intermediate consumers.</div>
        : <div className="text-text-secondary"><strong>No indirect impact found:</strong> the traversal did not find an upstream consumer beyond the direct level. Select a provider with a dependency chain of at least two HIGH/CRITICAL edges to see purple rings.</div>}
      <div className="text-text-muted">Preview changes only the graph overlay. Measured health remains endpoint-derived.</div>
    </div>}
    {showInsights && <ArchitectureInsights insights={insights} onClose={() => setShowInsights(false)}
      onSelect={(serviceId) => {
        setSelected(graph.nodes.find((node) => node.id === serviceId) || null);
      }} />}
    {showHealthMonitor && <RuntimeHealthMonitor nodes={graph.nodes} monitoring={monitoring}
      project={project} onCheck={monitorHealth} onClose={closeHealthMonitor} />}
  </div>;
}

function calculateImpactPreview(rootId, edges) {
  if (!rootId) return {};
  const consumers = {};
  edges.filter((edge) => edge.criticality === 'HIGH' || edge.criticality === 'CRITICAL').forEach((edge) => {
    consumers[edge.targetServiceId] = [...(consumers[edge.targetServiceId] || []), edge.sourceServiceId];
  });
  const result = { [rootId]: { level: 'ROOT_FAILURE', depth: 0, sourceName: rootId } };
  const queue = [{ id: rootId, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    (consumers[current.id] || []).forEach((consumerId) => {
      const depth = current.depth + 1;
      if (result[consumerId] && result[consumerId].depth <= depth) return;
      result[consumerId] = { level: depth === 1 ? 'DIRECT_AT_RISK' : 'INDIRECT_AT_RISK', depth, sourceName: rootId };
      queue.push({ id: consumerId, depth });
    });
  }
  return result;
}

function RuntimeHealthMonitor({ nodes, monitoring, project, onCheck, onClose }) {
  const [actions, setActions] = useState({});
  const [feedback, setFeedback] = useState('');
  const control = async (node, action) => {
    setActions((value) => ({ ...value, [node.id]: { busy: true, action } }));
    setFeedback(`${action === 'stop' ? 'Stopping' : action === 'slow' ? 'Slowing' : 'Restarting'} ${node.name}…`);
    try {
      const result = action === 'stop'
        ? await stopManagedRuntime(project.workspaceId, project.id, node.id)
        : action === 'slow'
          ? await degradeManagedRuntime(project.workspaceId, project.id, node.id)
          : await restartManagedRuntime(project.workspaceId, project.id, node.id);
      await onCheck();
      setActions((value) => ({ ...value, [node.id]: { busy: false, action, success: true } }));
      setFeedback(`${node.name}: ${action === 'stop' ? 'runtime stopped and endpoint verified as ERROR' : action === 'slow' ? `response delay enabled and verified as ${result.healthStatus}` : `runtime restarted and verified as ${result.healthStatus}`}.`);
    } catch (requestError) {
      setActions((value) => ({ ...value, [node.id]: { busy: false, action, error: true } }));
      setFeedback(`${node.name}: ${requestError.message}`);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-6">
    <div className="w-full max-w-5xl max-h-[88vh] overflow-y-auto bg-dark-card border border-dark-border rounded-xl shadow-2xl">
      <div className="sticky top-0 bg-dark-card flex items-center justify-between p-5 border-b border-dark-border z-10">
        <div><h2 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Activity size={18} className="text-primary" />Health Monitoring</h2><p className="text-sm text-text-muted mt-1">Endpoint-derived runtime evidence and calculated dependency exposure.</p></div>
        <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded-lg"><X size={18} /></button>
      </div>
      <div className="p-5 space-y-4">
        <div className="p-4 bg-primary/5 border border-primary/30 rounded-lg text-sm text-text-secondary"><strong className="text-text-primary">Runtime evidence:</strong> external services use their deployed health URL. Local managed services receive a real HTTP listener and can be stopped/restarted below. Nervix checks every 30 seconds; health is never manually entered. Dependency rings are predicted exposure, not fabricated health.</div>
        {feedback && <div className="p-3 rounded-lg bg-dark-card-2 border border-primary/20 text-sm text-text-primary">{feedback}</div>}
        <div className="flex justify-end"><button onClick={onCheck} disabled={monitoring} className="px-4 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-sm">{monitoring ? 'Checking endpoints…' : 'Check all now'}</button></div>
        <div className="overflow-x-auto border border-dark-border rounded-lg"><table className="w-full text-sm"><thead className="bg-dark-card-2"><tr className="text-left text-text-muted">{['Service', 'Runtime / endpoint', 'Health evidence', 'Evidence', 'Predicted impact', 'Control'].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{nodes.map((node) => {
          const state = actions[node.id] || {};
          const measured = node.runtimeHealthStatus || node.healthStatus;
          const measuredStyle = measured === 'HEALTHY' ? 'text-success' : measured === 'ERROR' ? 'text-danger' : measured === 'WARNING' ? 'text-warning' : 'text-sky-400';
          return <tr key={node.id} className="border-t border-dark-border"><td className="p-3 text-text-primary">{node.name}</td><td className="p-3 text-text-secondary max-w-xs"><div className="text-xs text-primary">{node.runtimeMode?.replaceAll('_', ' ')}</div><div className="truncate">{node.endpointUrl || <span className="text-warning">Not configured</span>}</div></td><td className="p-3"><div className={measuredStyle}>Measured: {measured}</div><div className="text-[10px] text-text-muted mt-1">Operational: {node.healthStatus}</div>{measured === 'PENDING' && <div className="text-[10px] text-text-muted mt-1">Run Check all now; configured services must resolve to a measured state.</div>}</td><td className="p-3 text-text-secondary"><div>{node.responseTimeMs == null ? 'No latency yet' : `${node.responseTimeMs}ms`}</div><div className="text-[10px] text-text-muted mt-1 max-w-[180px]">{node.healthMessage || 'No observation recorded'}</div></td><td className="p-3 text-text-secondary">{node.dependencyImpact === 'CLEAR' ? 'No current risk' : node.dependencyImpact.replaceAll('_', ' ')}</td><td className="p-3">{node.runtimeMode === 'LOCAL_MANAGED' ? <div className="flex flex-wrap gap-1"><button disabled={state.busy} onClick={() => control(node, 'stop')} className={`px-2 py-1 text-xs border border-danger/50 rounded disabled:opacity-60 ${state.action === 'stop' && state.success ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'}`}>{state.busy && state.action === 'stop' ? 'Stopping…' : state.action === 'stop' && state.success ? 'Stopped' : 'Stop'}</button><button disabled={state.busy} onClick={() => control(node, 'slow')} className={`px-2 py-1 text-xs border border-warning/50 rounded disabled:opacity-60 ${state.action === 'slow' && state.success ? 'bg-warning text-black' : 'text-warning hover:bg-warning/10'}`}>{state.busy && state.action === 'slow' ? 'Slowing…' : state.action === 'slow' && state.success ? 'Slow' : 'Make slow'}</button><button disabled={state.busy} onClick={() => control(node, 'restart')} className={`px-2 py-1 text-xs border border-success/50 rounded disabled:opacity-60 ${state.action === 'restart' && state.success ? 'bg-success text-white' : 'text-success hover:bg-success/10'}`}>{state.busy && state.action === 'restart' ? 'Restarting…' : state.action === 'restart' && state.success ? 'Running' : 'Restart'}</button></div> : <span className="text-xs text-text-muted">Externally managed</span>}</td></tr>;
        })}</tbody></table></div>
      </div>
    </div>
  </div>;
}

function analyzeArchitecture(nodes, edges) {
  const nameById = Object.fromEntries(nodes.map((node) => [node.id, node.name]));
  const outgoing = Object.fromEntries(nodes.map((node) => [node.id, []]));
  const incoming = Object.fromEntries(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    outgoing[edge.sourceServiceId]?.push(edge.targetServiceId);
    incoming[edge.targetServiceId]?.push(edge.sourceServiceId);
  });

  const isolated = nodes.filter((node) => !outgoing[node.id]?.length && !incoming[node.id]?.length);
  const singlePoints = nodes
    .map((node) => ({ ...node, consumers: [...new Set(incoming[node.id] || [])], impact: new Set(incoming[node.id] || []).size }))
    .filter((node) => node.impact >= 2)
    .sort((a, b) => b.impact - a.impact);
  const criticalEdges = edges.filter((edge) => edge.criticality === 'CRITICAL');

  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const walk = (id) => {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id].map((nodeId) => nameById[nodeId]);
      const key = [...new Set(cycle)].sort().join('|');
      if (!cycles.some((item) => item.key === key)) cycles.push({ key, path: cycle });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    (outgoing[id] || []).forEach(walk);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };
  nodes.forEach((node) => walk(node.id));

  const riskScore = Math.min(100,
    singlePoints.length * 18 + criticalEdges.length * 12 + cycles.length * 25 + isolated.length * 5);
  const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low';
  return { isolated, singlePoints, criticalEdges, cycles, riskScore, riskLevel, nameById };
}

function ArchitectureInsights({ insights, onClose, onSelect }) {
  const sections = [
    {
      title: 'Single points of failure',
      description: 'Services directly used by two or more other services.',
      empty: 'No concentrated direct dependency risk detected.',
      items: insights.singlePoints.map((node) => ({
        id: node.id, label: node.name, detail: `${node.impact} direct consumers: ${node.consumers.map((id) => insights.nameById[id]).join(', ')}`,
        reason: `If ${node.name} becomes unavailable, these consumers may lose a provider immediately.`,
      })),
    },
    {
      title: 'Critical dependency paths',
      description: 'Relationships marked CRITICAL in the current architecture.',
      empty: 'No critical relationships are configured.',
      items: insights.criticalEdges.map((edge) => ({
        id: edge.targetServiceId,
        label: `${insights.nameById[edge.sourceServiceId]} → ${insights.nameById[edge.targetServiceId]}`,
        detail: `${edge.communicationProtocol || edge.dependencyType} · ${edge.criticality}`,
        reason: `${insights.nameById[edge.sourceServiceId]} requires ${insights.nameById[edge.targetServiceId]} with no adequate fallback recorded.`,
      })),
    },
    {
      title: 'Dependency cycles',
      description: 'Circular paths that can amplify failures and complicate deployments.',
      empty: 'No circular dependency path detected.',
      items: insights.cycles.map((cycle, index) => ({
        id: null, label: `Cycle ${index + 1}`, detail: cycle.path.join(' → '),
        reason: 'A failure or retry can circulate through this closed dependency path and amplify load.',
      })),
    },
    {
      title: 'Isolated services',
      description: 'Services with no incoming or outgoing relationship.',
      empty: 'Every service is connected to the project architecture.',
      items: insights.isolated.map((node) => ({ id: node.id, label: node.name, detail: node.serviceType,
        reason: `${node.name} has neither a recorded consumer nor provider, so impact analysis cannot connect it to the architecture.` })),
    },
  ];
  const riskStyle = insights.riskLevel === 'High' ? 'text-danger bg-danger/10 border-danger/20'
    : insights.riskLevel === 'Medium' ? 'text-warning bg-warning/10 border-warning/20'
      : 'text-success bg-success/10 border-success/20';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-6">
    <div className="w-full max-w-4xl max-h-[88vh] overflow-y-auto bg-dark-card border border-dark-border rounded-xl shadow-2xl">
      <div className="sticky top-0 bg-dark-card flex items-center justify-between p-5 border-b border-dark-border z-10">
        <div>
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Sparkles size={18} className="text-primary" />Architecture Insights</h2>
          <p className="text-sm text-text-muted mt-1">Live structural risk analysis based on current services and dependencies.</p>
        </div>
        <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded-lg"><X size={18} /></button>
      </div>
      <div className="p-5 space-y-5">
        <div className={`border rounded-xl p-4 flex items-center justify-between ${riskStyle}`}>
          <div><div className="text-xs uppercase tracking-wide opacity-80">Architecture risk</div>
            <div className="text-xl font-semibold mt-1">{insights.riskLevel}</div></div>
          <div className="text-3xl font-semibold">{insights.riskScore}<span className="text-sm opacity-70">/100</span></div>
        </div>
        <div className="text-xs text-text-muted -mt-2">Score evidence: {insights.singlePoints.length} single points × 18, {insights.criticalEdges.length} critical paths × 12, {insights.cycles.length} cycles × 25 and {insights.isolated.length} isolated services × 5, capped at 100.</div>
        <div className="grid grid-cols-2 gap-4">
          {sections.map((section) => <div key={section.title} className="bg-dark-card-2 border border-dark-border rounded-xl p-4">
            <div className="text-sm font-semibold text-text-primary">{section.title}</div>
            <div className="text-xs text-text-muted mt-1 mb-3">{section.description}</div>
            <div className="space-y-2">
              {section.items.length ? section.items.map((item, index) =>
                <button key={`${item.label}-${index}`} disabled={!item.id} onClick={() => item.id && onSelect(item.id)}
                  className="w-full text-left p-2.5 rounded-lg bg-dark-card border border-dark-border disabled:cursor-default hover:enabled:border-primary/50">
                  <div className="text-xs font-medium text-text-primary">{item.label}</div>
                  <div className="text-[11px] text-text-muted mt-1">{item.detail}</div>
                  {item.reason && <div className="text-[11px] text-text-secondary mt-1.5 leading-relaxed"><span className="text-warning">Why:</span> {item.reason}</div>}
                </button>)
                : <div className="text-xs text-success p-2.5 bg-success/5 rounded-lg">{section.empty}</div>}
            </div>
          </div>)}
        </div>
      </div>
    </div>
  </div>;
}

function Metric({ label, value }) {
  return <div className="bg-dark-card-2 rounded-lg p-2"><div className="text-[10px] text-text-muted">{label}</div><div className="text-xs text-text-primary mt-1">{value}</div></div>;
}

function GraphTab({ onBlastRadius }) {
  const defaultNode = graphNodes.find(n => n.id === 'payment-service');
  const [selectedNode, setSelectedNode] = useState(defaultNode);
  const [showFilter, setShowFilter] = useState(false);
  const [showViewService, setShowViewService] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const incomingDeps = graphEdges.filter(e => e.to === selectedNode?.id).map(e => graphNodes.find(x => x.id === e.from)?.label).filter(Boolean);
  const outgoingDeps = graphEdges.filter(e => e.from === selectedNode?.id).map(e => graphNodes.find(x => x.id === e.to)?.label).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input type="text" placeholder="Search nodes in graph..." className="pl-9 pr-4 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-48" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilter(true)} className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2">
            <Filter size={14} />Filter
          </button>
          <button className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2">
            <Layers size={14} />Layout
          </button>
          <button onClick={onBlastRadius} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
            Blast Radius Analysis
          </button>
        </div>
      </div>

      {/* Graph + right panel */}
      <div className="flex gap-4" style={{ height: '500px' }}>
        <div className="flex-1 bg-dark-card border border-dark-border rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-4">
              {[['bg-success', 'Healthy'], ['bg-warning', 'Warning'], ['bg-danger', 'Error']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${c}`}></div>
                  <span className="text-xs text-text-secondary">{l}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded transition-colors"><ZoomOut size={14} /></button>
              <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded transition-colors"><ZoomIn size={14} /></button>
              <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded transition-colors"><Maximize2 size={14} /></button>
            </div>
          </div>

          <svg
            className="flex-1 w-full bg-dark-bg/40 rounded-lg border border-dark-border cursor-pointer"
            viewBox="0 0 740 580"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#4B5563" />
              </marker>
            </defs>
            {graphEdges.map((edge, i) => {
              const f = graphNodes.find(n => n.id === edge.from);
              const t = graphNodes.find(n => n.id === edge.to);
              if (!f || !t) return null;
              return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#4B5563" strokeWidth="1.5" markerEnd="url(#arr)" />;
            })}
            {graphNodes.map((node) => (
              <g key={node.id} onClick={() => setSelectedNode(node)} className="cursor-pointer">
                <circle cx={node.x} cy={node.y} r="22" fill={node.color} fillOpacity="0.15" stroke={selectedNode?.id === node.id ? node.color : 'transparent'} strokeWidth="2" />
                <circle cx={node.x} cy={node.y} r="10" fill={node.color} />
                <text x={node.x} y={node.y + 26} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="500">{node.label}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Right node details panel */}
        {selectedNode && (
          <div className="w-60 flex-shrink-0 bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-text-primary">Node Details</span>
              <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">Healthy</span>
            </div>
            <div className="text-base font-semibold text-text-primary mb-3">{selectedNode.label}</div>
            <div className="space-y-2 text-sm mb-4">
              {[
                { label: 'Type', value: selectedNode.type },
                { label: 'Version', value: selectedNode.version },
                { label: 'Owner', value: selectedNode.owner },
                { label: 'Dependencies', value: selectedNode.deps },
                { label: 'Dependents', value: selectedNode.dependents },
                { label: 'Response Time', value: selectedNode.responseTime },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-text-muted text-xs">{label}</span>
                  <span className="text-text-secondary text-xs font-medium">{value}</span>
                </div>
              ))}
            </div>
            {selectedNode.desc && (
              <div className="mb-3">
                <div className="text-xs text-text-muted mb-1">Description</div>
                <div className="text-xs text-text-secondary leading-relaxed">{selectedNode.desc}</div>
              </div>
            )}
            {incomingDeps.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-text-muted mb-1.5">Incoming Dependencies</div>
                <div className="space-y-1">{incomingDeps.map((d, i) => <div key={i} className="text-xs text-text-secondary px-2 py-1 bg-dark-card-2 rounded">{d}</div>)}</div>
              </div>
            )}
            {outgoingDeps.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-text-muted mb-1.5">Outgoing Dependencies</div>
                <div className="space-y-1">{outgoingDeps.map((d, i) => <div key={i} className="text-xs text-text-secondary px-2 py-1 bg-dark-card-2 rounded">{d}</div>)}</div>
              </div>
            )}
            <button
              onClick={() => setShowFullDetails(true)}
              className="mt-auto w-full px-3 py-2 text-xs text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
            >
              View Full Details
            </button>
          </div>
        )}
      </div>

      {/* Bottom node details bar */}
      {selectedNode && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="text-xs font-semibold text-text-muted mb-3">Node Details</div>
          <div className="flex items-center gap-6 p-3 bg-dark-card-2 rounded-lg border border-dark-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedNode.color }}></div>
              <span className="text-sm font-semibold text-text-primary">{selectedNode.label}</span>
              <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full font-medium">Healthy</span>
            </div>
            <span className="text-sm text-text-secondary">Type: {selectedNode.type}</span>
            <span className="text-sm text-text-secondary">Dependencies: {selectedNode.deps}</span>
            <span className="text-sm text-text-secondary">Dependents: {selectedNode.dependents}</span>
            <span className="text-sm text-text-secondary">Response Time: {selectedNode.responseTime}</span>
            <button
              onClick={() => setShowViewService(true)}
              className="ml-auto px-4 py-1.5 text-sm text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0"
            >
              View Service Details
            </button>
          </div>
        </div>
      )}

      {showFilter && <FilterPopup onClose={() => setShowFilter(false)} />}
      {showViewService && <ViewServiceDetailsPopup node={selectedNode} onClose={() => setShowViewService(false)} />}
      {showFullDetails && <ServiceFullDetailsPopup node={selectedNode} onClose={() => setShowFullDetails(false)} />}
    </div>
  );
}

/* ─── Main component ─── */

export default function ProjectDetails({ project, onBack, onNavigate, onAddService, onAddDependency, dependencyRevision }) {
  const tabStorageKey = `nervix:project-tab:${project?.id || 'unknown'}`;
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(tabStorageKey);
    return ['overview', 'services', 'dependencies', 'graph'].includes(saved) ? saved : 'overview';
  });
  const [showEditProject, setShowEditProject] = useState(false);
  const [, setProjectRevision] = useState(0);
  const [team, setTeam] = useState({ members: [], currentUserRole: project?.currentUserRole || 'VIEWER' });
  const [services, setServices] = useState([]);
  const [serviceSummary, setServiceSummary] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [serviceEditor, setServiceEditor] = useState(undefined);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [dependencySummary, setDependencySummary] = useState(null);
  const [dependenciesLoading, setDependenciesLoading] = useState(true);
  const [dependenciesError, setDependenciesError] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [incidentSummary, setIncidentSummary] = useState(null);
  const [dataRevision, setDataRevision] = useState(0);

  useEffect(() => {
    let active = true;
    if (project?.workspaceId && project?.id && !project?.demo) {
      getProjectTeam(project.workspaceId, project.id)
        .then((result) => { if (active) setTeam(result); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [project?.workspaceId, project?.id, project?.demo]);

  const loadServices = async () => {
    if (!project?.workspaceId || !project?.id || project?.demo) {
      setServices(project?.demo ? projectServices : []);
      setServiceSummary(null);
      setServicesLoading(false);
      return;
    }
    setServicesLoading(true);
    setServicesError('');
    try {
      const [items, summary] = await Promise.all([
        listServices(project.workspaceId, project.id),
        getServiceSummary(project.workspaceId, project.id),
      ]);
      setServices(items);
      setServiceSummary(summary);
    } catch (requestError) {
      setServicesError(requestError.message);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, [project?.workspaceId, project?.id, project?.demo, dependencyRevision, dataRevision]);

  const loadDependencies = async () => {
    if (!project?.workspaceId || !project?.id || project?.demo) {
      setDependencies(project?.demo ? projectDependencies.map((value, index) => ({
        id: `demo-${index}`, sourceServiceName: value.source, targetServiceName: value.target,
        dependencyType: value.type.replace(' ', '_').toUpperCase(), criticality: value.criticality.toUpperCase(),
        communicationProtocol: 'HTTPS', direction: 'UNIDIRECTIONAL', latencyMs: value.latency,
        createdAt: '2024-05-10T00:00:00Z',
      })) : []);
      setDependenciesLoading(false);
      return;
    }
    setDependenciesLoading(true);
    setDependenciesError('');
    try {
      const [items, summary] = await Promise.all([
        listDependencies(project.workspaceId, project.id),
        getDependencySummary(project.workspaceId, project.id),
      ]);
      setDependencies(items);
      setDependencySummary(summary);
    } catch (requestError) {
      setDependenciesError(requestError.message);
    } finally {
      setDependenciesLoading(false);
    }
  };

  useEffect(() => { loadDependencies(); }, [project?.workspaceId, project?.id, project?.demo, dependencyRevision, dataRevision]);

  const loadIncidents = async () => {
    if (!project?.workspaceId || !project?.id || project?.demo) {
      setIncidents([]);
      setIncidentSummary(null);
      return;
    }
    try {
      const [items, summary] = await Promise.all([
        listIncidents(project.workspaceId, project.id),
        getIncidentSummary(project.workspaceId, project.id),
      ]);
      setIncidents(items);
      setIncidentSummary(summary);
    } catch (requestError) {
      setServicesError(requestError.message);
    }
  };

  useEffect(() => { loadIncidents(); }, [project?.workspaceId, project?.id, project?.demo, dataRevision]);

  useEffect(() => {
    if (!project?.workspaceId || !project?.id || project?.demo) return undefined;
    const timer = window.setInterval(() => setDataRevision((value) => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, [project?.workspaceId, project?.id, project?.demo]);

  const refreshProjectData = () => setDataRevision((value) => value + 1);

  const owner = team.members.find((member) => member.role === 'OWNER');
  const memberPreview = team.members.slice(0, 5);
  const extraMembers = Math.max(0, team.members.length - memberPreview.length);
  const canEdit = ['OWNER', 'ADMIN', 'EDITOR'].includes(team.currentUserRole);
  const canManage = ['OWNER', 'ADMIN'].includes(team.currentUserRole);
  const projectHealth = services.some((service) => service.healthStatus === 'ERROR') ? 'Error'
    : services.some((service) => service.healthStatus === 'WARNING') ? 'Warning'
      : services.length && services.every((service) => service.healthStatus === 'HEALTHY') ? 'Healthy' : 'Unknown';
  const memberInitials = (member) => (member?.displayName || member?.email || '?')
    .split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'dependencies', label: 'Dependencies' },
    { id: 'graph', label: 'Graph' },
    { id: 'analytics', label: 'Analytics', external: true },
    { id: 'team', label: 'Team', external: true },
    { id: 'settings', label: 'Settings', external: true },
  ];

  const handleTabClick = (tab) => {
    if (tab.external) {
      const pageMap = { analytics: 'analytics', team: 'teams', settings: 'settings' };
      onNavigate(pageMap[tab.id]);
      return;
    }
    setActiveTab(tab.id);
  };

  useEffect(() => {
    localStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab, tabStorageKey]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab services={services} dependencies={dependencies} summary={serviceSummary} dependencySummary={dependencySummary} incidents={incidents} incidentSummary={incidentSummary} />;
      case 'services': return <ServicesTab services={services} loading={servicesLoading} error={servicesError}
        canEdit={canEdit} canManage={canManage}
        onAddService={() => { setServiceEditor(undefined); setShowServiceEditor(true); }}
        onEditService={(service) => { setServiceEditor(service); setShowServiceEditor(true); }}
        onDeleteService={async (service) => {
          if (!window.confirm(`Delete "${service.name}"?`)) return;
          try { await deleteService(project.workspaceId, project.id, service.id); await loadServices(); }
          catch (requestError) { setServicesError(requestError.message); }
        }}
        onAddDependency={onAddDependency} />;
      case 'dependencies': return <DependenciesTab dependencies={dependencies} loading={dependenciesLoading}
        error={dependenciesError} canEdit={canEdit} onAddDependency={onAddDependency}
        onDeleteDependency={async (dependency) => {
          if (!window.confirm(`Delete dependency "${dependency.sourceServiceName} → ${dependency.targetServiceName}"?`)) return;
          try {
            await deleteDependency(project.workspaceId, project.id, dependency.id);
            await Promise.all([loadDependencies(), loadServices()]);
          } catch (requestError) { setDependenciesError(requestError.message); }
        }} />;
      case 'graph': return <LiveGraphTab project={project} canEdit={canEdit}
        revision={`${dependencyRevision}-${dataRevision}-${services.length}-${dependencies.length}`}
        onProjectDataChanged={refreshProjectData}
        onBlastRadius={(serviceId) => onNavigate('blast-radius', serviceId ? { serviceId } : undefined)} />;
      default: return <OverviewTab services={services} dependencies={dependencies} summary={serviceSummary} dependencySummary={dependencySummary} incidents={incidents} incidentSummary={incidentSummary} />;
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-text-primary">{project?.name || 'Payment Gateway V2'}</h1>
              <span className={`px-2 py-0.5 text-xs rounded-full ${healthBadge(projectHealth)}`}>{projectHealth}</span>
            </div>
            <p className="text-sm text-text-muted mt-0.5">{project?.description || project?.desc || 'No description'}</p>
          </div>
        </div>
        {canEdit && <button onClick={() => setShowEditProject(true)} className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2">
          <Edit2 size={14} />
          Edit Project
        </button>}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs">{memberInitials(owner)}</div>
          <div>
            <div className="text-xs text-text-muted">Project Owner</div>
            <div className="text-text-primary font-medium text-xs">{owner?.displayName || owner?.email || 'Loading…'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {memberPreview.map((member) => (
              <div key={member.userId} title={`${member.displayName} · ${member.role}`} className="w-7 h-7 rounded-full bg-dark-card-2 border-2 border-dark-card flex items-center justify-center text-white font-semibold text-xs">{memberInitials(member)}</div>
            ))}
            {extraMembers > 0 && <div className="w-7 h-7 rounded-full bg-dark-card-2 border-2 border-dark-card flex items-center justify-center text-text-muted text-xs">+{extraMembers}</div>}
          </div>
          <div className="text-xs text-text-muted">Team Members</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-text-muted" />
          <div>
            <div className="text-xs text-text-muted">Created At</div>
            <div className="text-xs text-text-primary font-medium">{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-text-muted" />
          <div>
            <div className="text-xs text-text-muted">Project ID</div>
            <div className="text-xs text-text-primary font-medium">{project?.id || 'PRJ-0012'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dark-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id && !tab.external ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderTabContent()}

      {showEditProject && <EditProjectPopup project={project}
        onUpdated={() => setProjectRevision((value) => value + 1)}
        onClose={() => setShowEditProject(false)} />}
      {showServiceEditor && <AddServicePopup project={project} service={serviceEditor}
        members={team.members}
        onSaved={loadServices}
        onClose={() => setShowServiceEditor(false)} />}
    </div>
  );
}
