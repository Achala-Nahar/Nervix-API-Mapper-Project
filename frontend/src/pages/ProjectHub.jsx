import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Shield, Clock, TriangleAlert as AlertTriangle, Activity } from 'lucide-react';
import { bootstrapCurrentUser, listProjects } from '../api';
import CreateProjectPopup from './CreateProjectPopup';

const demoProjects = [
  { id: 'PRJ-0012', name: 'Payment Gateway V2', icon: 'P', color: 'bg-blue-500', desc: 'Microservice architecture for payment processing system', services: 25, dependencies: 44, status: 'Good', updated: '2m ago', demo: true },
  { id: 'PRJ-0013', name: 'User Management', icon: 'U', color: 'bg-purple-500', desc: 'User identity and access management system', services: 18, dependencies: 32, status: 'Stable', updated: '5m ago', demo: true },
  { id: 'PRJ-0014', name: 'Inventory System', icon: 'I', color: 'bg-amber-500', desc: 'Inventory tracking and management system', services: 15, dependencies: 23, status: 'Stable', updated: '10m ago', demo: true },
];

const recentActivity = [
  { icon: AlertTriangle, color: 'text-danger', text: 'Payment Service triggered a fault', time: '2m ago' },
  { icon: AlertTriangle, color: 'text-danger', text: 'User Service database connection failed', time: '5m ago' },
  { icon: Activity, color: 'text-warning', text: 'Auth Service response time high', time: '10m ago' },
  { icon: Shield, color: 'text-success', text: 'New service Notification Service added', time: '15m ago' },
];
const colors = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'];

export default function ProjectHub({ userData, onNavigate, onSelectProject, revision = 0 }) {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const profile = await bootstrapCurrentUser();
      const id = profile.workspaces?.[0]?.id;
      if (!id) throw new Error('No workspace is assigned to this account.');
      setWorkspaceId(id);
      setProjects(await listProjects(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, [revision]);

  const cards = projects.length
    ? projects.map((project, index) => ({
        ...project,
        icon: project.name.charAt(0).toUpperCase(),
        color: colors[index % colors.length],
        desc: project.description || 'No description',
        services: project.services ?? 0,
        dependencies: project.dependencies ?? 0,
        updated: project.updatedAt ? new Date(project.updatedAt).toLocaleString() : 'just now',
      }))
    : demoProjects;

  const visibleCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return !term ? cards : cards.filter((project) =>
      project.name.toLowerCase().includes(term) || project.desc.toLowerCase().includes(term));
  }, [cards, query]);

  const initials = (userData?.displayName || userData?.fullName || userData?.email || 'User')
    .split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Project Hub</h1>
          <p className="text-sm text-text-muted mt-1">Manage and monitor all your API ecosystem projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collections, services..."
              className="pl-10 pr-4 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-64" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New Project
          </button>
          <button onClick={() => onNavigate('profile')}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm hover:bg-primary-hover transition-colors">
            {initials}
          </button>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Featured Collections</h2>
          <button className="text-sm text-primary hover:underline">View all</button>
        </div>
        {loading && <div className="pb-3 text-sm text-text-muted">Loading workspace projects…</div>}
        {error && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">{error}</div>}
        <div className="grid grid-cols-3 gap-4">
          {visibleCards.map((project) => (
            <button key={project.id} onClick={() => onSelectProject(project)}
              className="text-left bg-dark-card-2 border border-dark-border rounded-lg p-4 hover:border-primary/50 hover:bg-dark-card-2/80 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 ${project.color} rounded-lg flex items-center justify-center text-white font-semibold`}>{project.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{project.name}</div>
                    <div className="text-xs text-text-muted line-clamp-2">{project.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-success rounded-full" /><span className="text-xs text-text-muted">{project.status}</span></div>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>{project.services} Services</span><span>{project.dependencies} Dependencies</span>
              </div>
              <div className="text-xs text-text-muted mt-2">Updated {project.updated}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            <button className="text-sm text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`} />
                <div className="flex-1 text-sm text-text-secondary">{activity.text}</div>
                <div className="text-xs text-text-muted flex items-center gap-1"><Clock size={12} />{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateProjectPopup workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreate={(project) => { setProjects((current) => [project, ...current]); setShowCreate(false); }} />
      )}
    </div>
  );
}
