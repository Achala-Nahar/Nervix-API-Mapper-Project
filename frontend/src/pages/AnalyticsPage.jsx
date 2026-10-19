import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Download, Activity, Clock, CircleAlert as AlertCircle,
  GitBranch, RefreshCw, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getProjectAnalytics } from '../api';

const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#64748B', '#06B6D4', '#EC4899', '#84CC16'];
const label = (value) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, character => character.toUpperCase());

const distribution = (values = {}) => Object.entries(values)
  .filter(([, value]) => value > 0)
  .map(([name, value], index) => ({ name: label(name), value, color: palette[index % palette.length] }));

export default function AnalyticsPage({ onBack, project }) {
  const [range, setRange] = useState('DAYS_30');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!project?.workspaceId || !project?.id) {
      setError('Select a project before opening Analytics.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setAnalytics(await getProjectAnalytics(project.workspaceId, project.id, range));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [project?.workspaceId, project?.id, range]);

  const dependencyData = useMemo(
    () => distribution(analytics?.dependencyTypeDistribution), [analytics],
  );
  const healthData = useMemo(
    () => distribution(analytics?.healthDistribution), [analytics],
  );
  const trendData = useMemo(
    () => Object.entries(analytics?.incidentTrend || {}).map(([name, incidents]) => ({ name, incidents })),
    [analytics],
  );

  const exportReport = () => {
    if (!analytics) return;
    const rows = [
      ['Nervix Project Analytics Report'],
      ['Project', project.name],
      ['Generated At', analytics.generatedAt],
      ['Range', analytics.range],
      [],
      ['Metric', 'Value'],
      ['Health Score', analytics.healthScore],
      ['Total Services', analytics.totalServices],
      ['Total Dependencies', analytics.totalDependencies],
      ['Incidents In Range', analytics.incidentsInRange],
      ['Active Incidents', analytics.activeIncidents],
      ['Critical Dependencies', analytics.criticalDependencies],
      ['Average Dependency Latency (ms)', analytics.averageLatencyMs],
      ['Isolated Services', analytics.isolatedServices],
      ['Single Points of Failure', analytics.singlePointsOfFailure],
      ['Unhealthy Critical Dependencies', analytics.unhealthyCriticalDependencies],
      [],
      ['Service Health', 'Count'],
      ...Object.entries(analytics.healthDistribution || {}),
      [],
      ['Dependency Type', 'Count'],
      ...Object.entries(analytics.dependencyTypeDistribution || {}),
      [],
      ['Incident Severity', 'Count'],
      ...Object.entries(analytics.incidentSeverityDistribution || {}),
      [],
      ['Incident Status', 'Count'],
      ...Object.entries(analytics.incidentStatusDistribution || {}),
      [],
      ['Top Connected Service', 'Incoming', 'Outgoing', 'Total', 'Health'],
      ...(analytics.topConnectedServices || []).map(item =>
        [item.name, item.incoming, item.outgoing, item.total, item.health]),
    ];
    const csv = rows.map(row => row.map(value =>
      `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9]+/gi, '-')}-analytics.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const stats = analytics ? [
    { label: 'Total Services', value: analytics.totalServices, icon: Activity, color: 'text-primary' },
    { label: 'Total Dependencies', value: analytics.totalDependencies, icon: GitBranch, color: 'text-success' },
    { label: 'Avg Dependency Latency', value: `${analytics.averageLatencyMs}ms`, icon: Clock, color: 'text-warning' },
    { label: 'Incidents in Range', value: analytics.incidentsInRange, icon: AlertCircle, color: 'text-danger' },
  ] : [];

  return <div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors">
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Analytics Overview</h1>
          <p className="text-sm text-text-muted mt-1">{project?.name || 'No project selected'} · live project intelligence</p>
        </div>
      </div>
      <div className="flex gap-3">
        <select value={range} onChange={event => setRange(event.target.value)}
          className="px-3 py-2 text-sm bg-dark-card-2 border border-dark-border rounded-lg text-text-primary">
          <option value="DAYS_7">Last 7 days</option>
          <option value="DAYS_30">Last 30 days</option>
          <option value="DAYS_90">Last 90 days</option>
          <option value="ALL">All time</option>
        </select>
        <button onClick={load} disabled={loading} className="p-2 border border-dark-border rounded-lg text-text-secondary hover:text-primary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
        </button>
        <button onClick={exportReport} disabled={!analytics}
          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary border border-dark-border rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-40">
          <Download size={14}/>Export Report
        </button>
      </div>
    </div>

    {error && <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">{error}</div>}
    {loading && !analytics && <div className="p-16 bg-dark-card border border-dark-border rounded-xl text-center text-text-muted">Calculating live project analytics…</div>}

    {analytics && <>
      <div className="grid grid-cols-4 gap-4">
        {stats.map(stat => <div key={stat.label} className="bg-dark-card border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3"><stat.icon size={18} className={stat.color}/><span className="text-sm text-text-muted">{stat.label}</span></div>
          <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
        </div>)}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <RiskCard icon={ShieldCheck} label="Project Health Score" value={`${analytics.healthScore}%`}
          tone={analytics.healthScore >= 80 ? 'text-success' : analytics.healthScore >= 55 ? 'text-warning' : 'text-danger'}/>
        <RiskCard icon={TriangleAlert} label="Active Incidents" value={analytics.activeIncidents} tone="text-danger"/>
        <RiskCard icon={GitBranch} label="Critical Dependencies" value={analytics.criticalDependencies} tone="text-warning"/>
        <RiskCard icon={AlertCircle} label="Unhealthy Critical Paths" value={analytics.unhealthyCriticalDependencies} tone="text-danger"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DistributionCard title="Dependency Type Distribution" data={dependencyData}/>
        <DistributionCard title="Service Health Distribution" data={healthData}/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-5">Incident Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}><CartesianGrid stroke="#243044" strokeDasharray="3 3"/>
                <XAxis dataKey="name" tick={{ fill: '#7D8BA6', fontSize: 10 }}/><YAxis allowDecimals={false} tick={{ fill: '#7D8BA6', fontSize: 11 }}/>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', borderRadius: 8 }}/>
                <Bar dataKey="incidents" fill="#3B82F6" radius={[4, 4, 0, 0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Top Connected Services</h3>
          <div className="space-y-4">{(analytics.topConnectedServices || []).map(service => {
            const maximum = Math.max(...analytics.topConnectedServices.map(item => item.total), 1);
            return <div key={service.serviceId} className="flex items-center gap-3">
              <div className="w-36 min-w-0"><div className="text-sm text-text-secondary truncate">{service.name}</div>
                <div className="text-[10px] text-text-muted">{service.incoming} in · {service.outgoing} out · {label(service.health)}</div></div>
              <div className="flex-1 bg-dark-card-2 rounded-full h-2 overflow-hidden"><div className="bg-primary h-full rounded-full" style={{ width: `${service.total / maximum * 100}%` }}/></div>
              <span className="text-sm text-text-muted w-8 text-right">{service.total}</span>
            </div>;
          })}
          {!analytics.topConnectedServices?.length && <div className="text-sm text-text-muted py-8 text-center">No service connections yet.</div>}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <RiskDetail label="Isolated services" value={analytics.isolatedServices} help="Services with no incoming or outgoing dependencies."/>
        <RiskDetail label="Single points of failure" value={analytics.singlePointsOfFailure} help="Services required by two or more other services."/>
        <RiskDetail label="Pending operational work" value={analytics.activeIncidents} help="Open and acknowledged incidents still requiring resolution."/>
      </div>
    </>}
  </div>;
}

function RiskCard({ icon: Icon, label: text, value, tone }) {
  return <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center gap-3">
    <div className="p-2 bg-dark-card-2 rounded-lg"><Icon size={18} className={tone}/></div>
    <div><div className="text-xs text-text-muted">{text}</div><div className={`text-xl font-semibold mt-1 ${tone}`}>{value}</div></div>
  </div>;
}

function DistributionCard({ title, data }) {
  return <div className="bg-dark-card border border-dark-border rounded-xl p-5">
    <h3 className="text-sm font-semibold text-text-primary mb-4">{title}</h3>
    {data.length ? <div className="flex items-center gap-6">
      <div className="w-44 h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={43} outerRadius={73} paddingAngle={2} dataKey="value">
        {data.map(item => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', borderRadius: 8 }}/></PieChart></ResponsiveContainer></div>
      <div className="space-y-3">{data.map(item => <div key={item.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}/><span className="text-sm text-text-secondary min-w-28">{item.name}</span><span className="text-sm text-text-muted">{item.value}</span></div>)}</div>
    </div> : <div className="h-44 flex items-center justify-center text-sm text-text-muted">No data available.</div>}
  </div>;
}

function RiskDetail({ label: text, value, help }) {
  return <div className="bg-dark-card border border-dark-border rounded-xl p-4"><div className="flex justify-between"><span className="text-sm text-text-secondary">{text}</span><span className="text-lg font-semibold text-text-primary">{value}</span></div><p className="text-xs text-text-muted mt-2">{help}</p></div>;
}
