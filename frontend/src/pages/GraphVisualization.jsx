import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, Filter, Layers, Maximize2, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getProjectGraph, runProjectHealthCheck } from '../api';

const healthColor = { HEALTHY: '#10B981', WARNING: '#F59E0B', ERROR: '#EF4444', UNKNOWN: '#64748B' };
const impactColor = { DIRECT_AT_RISK: '#F97316', INDIRECT_AT_RISK: '#A855F7' };

export default function GraphVisualization({ onBack, onBlastRadius, project }) {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [showFilter, setShowFilter] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGraph = async (quiet = false) => {
    if (!project?.workspaceId || !project?.id) return;
    if (!quiet) setLoading(true);
    try {
      const value = await getProjectGraph(project.workspaceId, project.id);
      setGraph(value || { nodes: [], edges: [] });
      setSelectedNode((current) => value?.nodes?.find((node) => node.id === current?.id) || value?.nodes?.[0] || null);
      if (!quiet) setError('');
    } catch (requestError) {
      if (!quiet) setError(requestError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
    const timer = window.setInterval(() => loadGraph(true), 30000);
    return () => window.clearInterval(timer);
  }, [project?.workspaceId, project?.id]);

  const monitorNow = async () => {
    setMonitoring(true);
    setError('');
    try {
      await runProjectHealthCheck(project.workspaceId, project.id);
      await loadGraph(true);
      setShowMonitor(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setMonitoring(false);
    }
  };

  const positionedNodes = useMemo(() => positionNodes(graph.nodes || []), [graph.nodes]);
  const visibleNodes = positionedNodes.filter((node) =>
    node.name.toLowerCase().includes(search.toLowerCase())
      && (healthFilter === 'ALL' || node.healthStatus === healthFilter));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const byId = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));
  const outgoing = (graph.edges || []).filter((edge) => edge.sourceServiceId === selectedNode?.id);
  const incoming = (graph.edges || []).filter((edge) => edge.targetServiceId === selectedNode?.id);

  if (loading) return <div className="p-20 text-center text-text-muted">Loading architecture graph...</div>;

  return <div className="p-6 space-y-6">
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        {onBack && <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors"><ArrowLeft size={20} /></button>}
        <div><h1 className="text-xl font-semibold text-text-primary">Architecture Graph - {project?.name || graph.projectName || 'Project'}</h1></div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search nodes in graph..." className="pl-9 pr-4 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-52" /></div>
        <button onClick={() => setShowFilter((value) => !value)} className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2"><Filter size={14} />Filter</button>
        <button className="px-3 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center gap-2"><Layers size={14} />Layout</button>
        <button onClick={monitorNow} disabled={monitoring} className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Activity size={15} className={monitoring ? 'animate-pulse' : ''} />{monitoring ? 'Checking...' : 'Health Monitoring'}</button>
        <button onClick={onBlastRadius} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">Blast Radius Analysis</button>
      </div>
    </div>

    {showFilter && <div className="bg-dark-card border border-dark-border rounded-xl p-4"><select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)} className="px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary"><option value="ALL">All health states</option>{['HEALTHY', 'WARNING', 'ERROR', 'UNKNOWN'].map((value) => <option key={value}>{value}</option>)}</select></div>}
    {error && <div className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg text-sm">{error}</div>}

    <div className="bg-dark-card border border-dark-border rounded-xl p-4" style={{ height: '600px' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Legend color="#10B981" label="Healthy" /><Legend color="#F59E0B" label="Warning" /><Legend color="#EF4444" label="Error" /><Legend color="#64748B" label="Unknown" />
          <Legend color="#F97316" label="Direct impact" ring /><Legend color="#A855F7" label="Indirect impact" ring />
        </div>
        <div className="flex items-center gap-2"><Icon icon={ZoomOut} /><Icon icon={ZoomIn} /><Icon icon={Maximize2} /></div>
      </div>
      {!visibleNodes.length ? <div className="h-[520px] flex items-center justify-center text-text-muted bg-dark-bg/50 rounded-lg border border-dark-border">No services match the current graph filter.</div>
        : <svg width="100%" height="520" viewBox="0 0 800 600" className="bg-dark-bg/50 rounded-lg border border-dark-border">
          <defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#374151" /></marker></defs>
          {(graph.edges || []).map((edge) => {
            const from = byId[edge.sourceServiceId]; const to = byId[edge.targetServiceId];
            if (!from || !to || !visibleIds.has(from.id) || !visibleIds.has(to.id)) return null;
            return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)" />;
          })}
          {visibleNodes.map((node) => {
            const impact = impactColor[node.dependencyImpact];
            return <g key={node.id} onClick={() => setSelectedNode(node)} className="cursor-pointer">
              <circle cx={node.x} cy={node.y} r="28" fill={healthColor[node.healthStatus] || healthColor.UNKNOWN} opacity="0.15" />
              {impact && <circle cx={node.x} cy={node.y} r="25" fill="none" stroke={impact} strokeWidth="4" strokeDasharray={node.impactDepth > 1 ? '5 4' : undefined} />}
              <circle cx={node.x} cy={node.y} r={selectedNode?.id === node.id ? 14 : 12} fill={healthColor[node.healthStatus] || healthColor.UNKNOWN} stroke={selectedNode?.id === node.id ? '#E5E7EB' : 'none'} strokeWidth="2" />
              <text x={node.x} y={node.y + 31} textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="500">{node.name}</text>
            </g>;
          })}
        </svg>}
    </div>

    <div className="bg-dark-card border border-dark-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Node Details</h3>
      {!selectedNode ? <div className="text-sm text-text-muted">Select a node to view service details.</div> : <div className="p-3 bg-dark-card-2 rounded-lg border border-dark-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: healthColor[selectedNode.healthStatus] }} /><span className="text-sm text-text-primary font-medium">{selectedNode.name}</span><span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{selectedNode.healthStatus}</span>{selectedNode.dependencyImpact !== 'CLEAR' && <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">{selectedNode.dependencyImpact.replaceAll('_', ' ')}</span>}</div>
          <div className="flex items-center gap-6 text-sm text-text-secondary flex-wrap"><span>Type: {selectedNode.serviceType}</span><span>Dependencies: {selectedNode.dependencyCount}</span><span>Dependents: {selectedNode.dependentCount}</span><span>Response Time: {selectedNode.responseTimeMs == null ? '—' : `${selectedNode.responseTimeMs}ms`}</span></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm"><Detail label="Monitoring endpoint" value={selectedNode.endpointUrl || 'Not configured'} /><Detail label="Last checked" value={selectedNode.lastHealthCheckAt ? new Date(selectedNode.lastHealthCheckAt).toLocaleString() : 'Never'} /><Detail label="Observation" value={selectedNode.healthMessage || 'No health evidence yet'} /></div>
        {selectedNode.impactSourceName && <div className="mt-3 p-2 bg-warning/10 text-warning text-sm rounded-lg">Runtime impact originates from {selectedNode.impactSourceName} at dependency depth {selectedNode.impactDepth}.</div>}
        <div className="grid md:grid-cols-2 gap-4 mt-4"><Relations title="This service depends on" edges={outgoing} keyName="targetServiceId" byId={byId} /><Relations title="Services depending on this service" edges={incoming} keyName="sourceServiceId" byId={byId} /></div>
      </div>}
    </div>

    {showMonitor && <HealthMonitorModal graph={graph} onClose={() => setShowMonitor(false)} onCheck={monitorNow} monitoring={monitoring} />}
  </div>;
}

function HealthMonitorModal({ graph, onClose, onCheck, monitoring }) {
  return <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-5"><div className="w-full max-w-5xl max-h-[88vh] overflow-y-auto bg-dark-card border border-dark-border rounded-xl shadow-2xl">
    <div className="sticky top-0 bg-dark-card p-5 border-b border-dark-border flex items-start justify-between"><div><h2 className="text-lg font-semibold text-text-primary">Service Health Monitoring</h2><p className="text-sm text-text-muted mt-1">Health is measured from service endpoints; dependency risk is calculated separately.</p></div><button onClick={onClose}><X className="text-text-muted" /></button></div>
    <div className="p-5 space-y-4"><div className="p-4 bg-primary/5 border border-primary/30 rounded-lg text-sm text-text-secondary"><strong className="text-text-primary">How to use:</strong> add a base URL or direct health URL in the service form. Nervix automatically tries the configured URL, <code>/actuator/health</code>, <code>/health</code>, <code>/healthz</code> and readiness paths every 30 seconds. `UNKNOWN` means no endpoint or no observation, not that the service is inactive.</div>
      <div className="flex justify-end"><button onClick={onCheck} disabled={monitoring} className="px-4 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-sm">{monitoring ? 'Checking endpoints...' : 'Check all now'}</button></div>
      <div className="overflow-x-auto border border-dark-border rounded-lg"><table className="w-full text-sm"><thead className="bg-dark-card-2"><tr className="text-left text-text-muted">{['Service', 'Endpoint', 'Health', 'Latency', 'Last checked', 'Impact'].map((value) => <th className="p-3" key={value}>{value}</th>)}</tr></thead><tbody>{(graph.nodes || []).map((node) => <tr key={node.id} className="border-t border-dark-border"><td className="p-3 text-text-primary">{node.name}</td><td className="p-3 text-text-secondary max-w-xs truncate">{node.endpointUrl || <span className="text-warning">Not configured</span>}</td><td className="p-3">{node.healthStatus}</td><td className="p-3 text-text-secondary">{node.responseTimeMs == null ? '—' : `${node.responseTimeMs}ms`}</td><td className="p-3 text-text-secondary">{node.lastHealthCheckAt ? new Date(node.lastHealthCheckAt).toLocaleString() : 'Never'}</td><td className="p-3 text-text-secondary">{node.dependencyImpact === 'CLEAR' ? 'No current risk' : node.dependencyImpact.replaceAll('_', ' ')}</td></tr>)}</tbody></table></div>
    </div>
  </div></div>;
}

function positionNodes(nodes) { const count = Math.max(nodes.length, 1); return nodes.map((node, index) => { const angle = (Math.PI * 2 * index / count) - Math.PI / 2; return { ...node, x: 400 + Math.cos(angle) * 265, y: 290 + Math.sin(angle) * 205 }; }); }
function Legend({ color, label, ring }) { return <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${ring ? 'border-2 bg-transparent' : ''}`} style={ring ? { borderColor: color } : { backgroundColor: color }} /><span className="text-xs text-text-secondary">{label}</span></div>; }
function Icon({ icon: IconComponent }) { return <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors"><IconComponent size={16} /></button>; }
function Detail({ label, value }) { return <div><div className="text-xs text-text-muted">{label}</div><div className="text-text-secondary mt-1 break-all">{value}</div></div>; }
function Relations({ title, edges, keyName, byId }) { return <div><div className="text-xs text-text-muted mb-1">{title}</div>{edges.length ? edges.map((edge) => <div key={edge.id} className="text-sm text-text-secondary">→ {byId[edge[keyName]]?.name || edge[keyName]}</div>) : <div className="text-sm text-text-muted">None</div>}</div>; }
