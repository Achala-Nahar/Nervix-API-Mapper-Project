import React from 'react';
import { ArrowLeft, Search, Filter, Plus, Link2, MoveHorizontal as MoreHorizontal, ChevronDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Shield } from 'lucide-react';

const services = [
  { name: 'API Gateway', type: 'Gateway', health: 'Healthy', dependencies: 3, dependents: 5, healthScore: 98 },
  { name: 'Auth Service', type: 'API', health: 'Healthy', dependencies: 4, dependents: 6, healthScore: 96 },
  { name: 'User Service', type: 'API', health: 'Warning', dependencies: 5, dependents: 4, healthScore: 82 },
  { name: 'Payment Service', type: 'API', health: 'Healthy', dependencies: 6, dependents: 3, healthScore: 94 },
  { name: 'Inventory Service', type: 'API', health: 'Healthy', dependencies: 5, dependents: 2, healthScore: 92 },
  { name: 'Notification Service', type: 'API', health: 'Healthy', dependencies: 2, dependents: 1, healthScore: 95 },
  { name: 'Database', type: 'Database', health: 'Healthy', dependencies: 0, dependents: 8, healthScore: 99 },
  { name: 'Redis Cache', type: 'Cache', health: 'Healthy', dependencies: 0, dependents: 3, healthScore: 97 },
  { name: 'Order Service', type: 'API', health: 'Healthy', dependencies: 4, dependents: 2, healthScore: 93 },
  { name: 'Email Service', type: 'API', health: 'Healthy', dependencies: 1, dependents: 0, healthScore: 91 },
  { name: 'Analytics Service', type: 'API', health: 'Healthy', dependencies: 2, dependents: 0, healthScore: 90 },
  { name: 'File Service', type: 'API', health: 'Healthy', dependencies: 3, dependents: 1, healthScore: 88 },
];

const healthBadge = (health) => {
  const styles = {
    Healthy: 'bg-success/10 text-success',
    Warning: 'bg-warning/10 text-warning',
    Error: 'bg-danger/10 text-danger',
  };
  return styles[health] || styles.Healthy;
};

const healthIcon = (health) => {
  switch (health) {
    case 'Healthy': return <CheckCircle size={14} className="text-success" />;
    case 'Warning': return <AlertTriangle size={14} className="text-warning" />;
    case 'Error': return <AlertTriangle size={14} className="text-danger" />;
    default: return <CheckCircle size={14} className="text-success" />;
  }
};

export default function ServicesManagement({ onBack, onAddService, onAddDependency }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Services</h1>
            <p className="text-sm text-text-muted mt-1">Manage all services in your project</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2">
            <Filter size={14} />
            Filter
          </button>
          <button
            onClick={onAddDependency}
            className="flex items-center gap-2 px-4 py-2 bg-dark-card-2 border border-dark-border hover:border-primary text-text-primary rounded-lg text-sm font-medium transition-colors"
          >
            <Link2 size={16} />
            Add Dependency
          </button>
          <button
            onClick={onAddService}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Service
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-secondary hover:border-primary transition-colors">
            <span>All Types</span>
            <ChevronDown size={14} />
          </button>
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-secondary hover:border-primary transition-colors">
            <span>All Health</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Service Name</th>
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Type</th>
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Health</th>
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Dependencies</th>
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Dependents</th>
              <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, i) => (
              <tr key={i} className="border-b border-dark-border/50 hover:bg-dark-card-2/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dark-card-2 rounded-lg flex items-center justify-center border border-dark-border">
                      <Shield size={14} className="text-primary" />
                    </div>
                    <span className="text-sm text-text-primary font-medium">{service.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-text-secondary">{service.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${healthBadge(service.health)}`}>
                    {healthIcon(service.health)}
                    {service.health}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-text-secondary">{service.dependencies}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-text-secondary">{service.dependents}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <Link2 size={14} />
                    </button>
                    <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
