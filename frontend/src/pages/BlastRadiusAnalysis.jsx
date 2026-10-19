import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Play, ChevronDown, TriangleAlert as AlertTriangle } from 'lucide-react';
import { listDependencies, listServices } from '../api';

export default function BlastRadiusAnalysis({ onBack, project, initialServiceId }) {
  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [failedId, setFailedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!project?.workspaceId || !project?.id || project?.demo) {
      setLoading(false);
      return () => { active = false; };
    }
    Promise.all([
      listServices(project.workspaceId, project.id),
      listDependencies(project.workspaceId, project.id),
    ]).then(([serviceItems, dependencyItems]) => {
      if (!active) return;
      setServices(serviceItems);
      setDependencies(dependencyItems);
      setFailedId(serviceItems.some((service) => service.id === initialServiceId)
        ? initialServiceId : (serviceItems[0]?.id || ''));
    }).catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [project?.workspaceId, project?.id, project?.demo, initialServiceId]);

  const serviceById = useMemo(() =>
    Object.fromEntries(services.map((service) => [service.id, service])), [services]);

  const simulate = () => {
    if (!failedId) return;
    const distance = new Map([[failedId, 0]]);
    const queue = [failedId];
    while (queue.length) {
      const affectedTarget = queue.shift();
      const nextDistance = distance.get(affectedTarget) + 1;
      dependencies.filter((dependency) => dependency.targetServiceId === affectedTarget)
        .forEach((dependency) => {
          if (!distance.has(dependency.sourceServiceId)) {
            distance.set(dependency.sourceServiceId, nextDistance);
            queue.push(dependency.sourceServiceId);
          }
        });
    }
    const impacted = [...distance.entries()].filter(([id]) => id !== failedId)
      .map(([id, depth]) => ({
        ...serviceById[id],
        depth,
        impact: depth === 1 ? 'High' : depth === 2 ? 'Medium' : 'Low',
      })).filter((value) => value.id);
    setResult({ failed: serviceById[failedId], impacted });
  };

  const impactColor = (impact) => impact === 'High' ? '#EF4444' : impact === 'Medium' ? '#F59E0B' : '#10B981';

  return <div className="p-6 space-y-6">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg"><ArrowLeft size={20} /></button>
      <div><h1 className="text-xl font-semibold text-text-primary">Blast Radius Analysis</h1>
        <p className="text-sm text-text-muted mt-1">Simulate failure impact using this project’s live dependency graph</p></div>
    </div>
    {error && <div className="p-4 bg-danger/10 text-danger rounded-lg text-sm">{error}</div>}
    <div className="bg-dark-card border border-dark-border rounded-xl p-5">
      <div className="flex items-end gap-4 mb-6">
        <label className="flex-1"><span className="block text-sm text-text-secondary mb-1.5">Select Failed Service</span>
          <div className="relative"><select disabled={loading} value={failedId} onChange={(event) => { setFailedId(event.target.value); setResult(null); }}
            className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary appearance-none">
            {!services.length && <option value="">No services available</option>}
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} /></div>
        </label>
        <button disabled={!failedId} onClick={simulate}
          className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          <Play size={16} />Simulate Failure
        </button>
      </div>
      {!result ? <div className="h-80 flex items-center justify-center text-text-muted border border-dark-border rounded-lg bg-dark-card-2">
        Select a service and run the simulation.
      </div> : <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card-2 border border-dark-border rounded-lg p-4 h-[420px]">
          <svg width="100%" height="100%" viewBox="0 0 500 390">
            {[55, 105, 155].map((radius) => <circle key={radius} cx="250" cy="195" r={radius} fill="none" stroke="#374151" strokeDasharray="4 4" />)}
            {result.impacted.map((service, index) => {
              const angle = (Math.PI * 2 * index) / Math.max(result.impacted.length, 1) - Math.PI / 2;
              const radius = Math.min(55 + service.depth * 50, 155);
              const x = 250 + Math.cos(angle) * radius, y = 195 + Math.sin(angle) * radius;
              return <g key={service.id}><line x1="250" y1="195" x2={x} y2={y} stroke={impactColor(service.impact)} strokeWidth="2" />
                <circle cx={x} cy={y} r="13" fill={impactColor(service.impact)} />
                <text x={x} y={y + 26} textAnchor="middle" fill="#CBD5E1" fontSize="10">{service.name}</text></g>;
            })}
            <circle cx="250" cy="195" r="18" fill="#EF4444" />
            <text x="250" y="225" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="600">{result.failed.name}</text>
          </svg>
        </div>
        <div className="space-y-4">
          <div className="bg-dark-card-2 border border-dark-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Impact Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Summary value={result.impacted.length} label="Affected" color="text-danger" />
              <Summary value={result.impacted.filter((item) => item.impact === 'High').length} label="High" color="text-danger" />
              <Summary value={Math.max(0, ...result.impacted.map((item) => item.depth))} label="Max Depth" color="text-warning" />
            </div>
          </div>
          <div className="bg-dark-card-2 border border-dark-border rounded-lg p-4 max-h-[290px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Impacted Services</h3>
            {!result.impacted.length ? <div className="flex items-center gap-2 text-sm text-success"><AlertTriangle size={15} />No upstream services are affected.</div>
              : result.impacted.map((service) => <div key={service.id} className="flex items-center gap-3 py-2 border-b border-dark-border/50">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: impactColor(service.impact) }} />
                <span className="flex-1 text-sm text-text-secondary">{service.name}</span>
                <span className="text-xs" style={{ color: impactColor(service.impact) }}>{service.impact} · depth {service.depth}</span>
              </div>)}
          </div>
        </div>
      </div>}
    </div>
  </div>;
}

function Summary({ value, label, color }) {
  return <div><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="text-xs text-text-muted">{label}</div></div>;
}
