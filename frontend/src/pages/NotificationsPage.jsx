import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Eye, RotateCcw, Search, ShieldAlert, X } from 'lucide-react';
import {
  acknowledgeIncident, bootstrapCurrentUser, detectIncidents,
  listIncidents, listProjects,
  reopenIncident, resolveIncident,
} from '../api';

const severityStyle = {
  CRITICAL: 'bg-danger/10 text-danger', HIGH: 'bg-warning/10 text-warning',
  MEDIUM: 'bg-amber-500/10 text-amber-400', LOW: 'bg-primary/10 text-primary',
};

export default function NotificationsPage({ onBack, project, onBadgeChange }) {
  const [activeProject,setActiveProject]=useState(project||null);
  const [projects,setProjects]=useState([]);
  const [incidents,setIncidents]=useState([]);
  const [tab,setTab]=useState('All'); const [query,setQuery]=useState(''); const [status,setStatus]=useState('OPEN');
  const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const [resolving,setResolving]=useState(null); const [viewing,setViewing]=useState(null);
  useEffect(()=>{setActiveProject(project||null)},[project?.id]);
  useEffect(()=>{if(project)return;bootstrapCurrentUser().then(profile=>{
    const workspaceId=profile.workspaces?.[0]?.id;if(workspaceId)return listProjects(workspaceId);
    return [];
  }).then(setProjects).catch(e=>setError(e.message))},[project?.id]);
  const load=async()=>{setLoading(true);setError('');try{
    if(activeProject?.workspaceId&&activeProject?.id){
      await detectIncidents(activeProject.workspaceId,activeProject.id);
      const items=await listIncidents(activeProject.workspaceId,activeProject.id);
      setIncidents(items);onBadgeChange?.(items.some(item=>item.status!=='RESOLVED'));
    } else {setIncidents([]);}
  }catch(e){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[activeProject?.workspaceId,activeProject?.id]);
  const canEdit=['OWNER','ADMIN','EDITOR'].includes(activeProject?.currentUserRole);
  const visible=useMemo(()=>incidents.filter(i=>{
    if(tab==='Faults'&&!['CRITICAL','HIGH'].includes(i.severity))return false;
    if(tab==='Alerts'&&!['MEDIUM','LOW'].includes(i.severity))return false;
    // These are operational work queues, not literal database-status filters:
    // Open = complete incident feed; Acknowledged = work awaiting acknowledgement;
    // Resolved = acknowledged/open work that still needs resolution.
    if(status==='ACKNOWLEDGED'&&i.status!=='OPEN')return false;
    if(status==='RESOLVED'&&i.status==='RESOLVED')return false;
    const term=query.trim().toLowerCase();return !term||i.title.toLowerCase().includes(term)||i.serviceName.toLowerCase().includes(term);
  }),[incidents,tab,status,query]);
  const action=async(fn)=>{setError('');try{await fn();await load()}catch(e){setError(e.message)}};
  return <div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg"><ArrowLeft size={20}/></button>
      <div><h1 className="text-xl font-semibold text-text-primary">Notifications & Incidents</h1>
        <p className="text-sm text-text-muted mt-1">{activeProject?.name||'Select a project'} · automatically detected operational events</p></div></div>
      {activeProject&&<div className="px-3 py-2 bg-success/10 text-success rounded-lg text-xs">Automatic health detection active</div>}
    </div>
    {error&&<div className="p-3 bg-danger/10 text-danger rounded-lg text-sm">{error}</div>}
    {!activeProject&&<div className="bg-dark-card border border-dark-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-text-primary">Choose a project</h2>
      <p className="text-sm text-text-muted mt-1 mb-4">Select which project's faults, alerts and incident history you want to view.</p>
      <div className="grid grid-cols-3 gap-3">{projects.map(item=><button key={item.id} onClick={()=>setActiveProject(item)}
        className="text-left p-4 bg-dark-card-2 border border-dark-border rounded-lg hover:border-primary">
        <div className="text-sm font-medium text-text-primary">{item.name}</div><div className="text-xs text-text-muted mt-1">{item.services||0} services</div></button>)}
        {!projects.length&&!loading&&<div className="text-sm text-text-muted">No accessible projects found.</div>}</div>
    </div>}
    {activeProject&&<>
    <div className="flex border-b border-dark-border">{['All','Faults','Alerts'].map(t=>
      <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2.5 text-sm border-b-2 ${tab===t?'border-primary text-primary':'border-transparent text-text-muted'}`}>
        {t}</button>)}</div>
    <div className="flex gap-3"><div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-3 text-text-muted"/>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search incident or service…" className="w-full pl-9 pr-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary"/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
        <option value="OPEN">Open</option><option value="ACKNOWLEDGED">Acknowledged</option>
        <option value="RESOLVED">Resolved</option></select></div>
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      {loading?<div className="p-12 text-center text-text-muted">Loading live notifications…</div>:
      visible.length?<div className="divide-y divide-dark-border">{visible.map(i=><div key={i.id} className="p-4 flex gap-4 items-start">
        <ShieldAlert size={19} className={i.severity==='CRITICAL'?'text-danger':'text-warning'}/><div className="flex-1 min-w-0">
          <div className="flex gap-2 items-center"><span className="text-sm font-medium text-text-primary">{i.title}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${severityStyle[i.severity]}`}>{i.severity}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-card-2 text-text-muted">{i.status}</span></div>
          <div className="text-xs text-text-secondary mt-1">{i.serviceName} · {i.category}{i.assignedToName?` · ${i.assignedToName}`:''}</div>
          {i.description&&<div className="text-xs text-text-muted mt-1">{i.description}</div>}</div>
        {canEdit&&i.status==='OPEN'&&<button onClick={()=>action(()=>acknowledgeIncident(activeProject.workspaceId,activeProject.id,i.id))} className="px-3 py-2 text-xs border border-warning/30 text-warning rounded-lg">Acknowledge</button>}
        {canEdit&&i.status!=='RESOLVED'&&<button onClick={()=>setResolving(i)} className="px-3 py-2 text-xs bg-success text-white rounded-lg flex gap-1"><Check size={13}/>Resolve</button>}
        {i.status==='RESOLVED'&&<button onClick={()=>setViewing(i)} className="px-3 py-2 text-xs border border-primary/30 text-primary rounded-lg flex gap-1"><Eye size={13}/>View Resolution</button>}
        {canEdit&&i.status==='RESOLVED'&&<button onClick={()=>action(()=>reopenIncident(activeProject.workspaceId,activeProject.id,i.id))} className="px-3 py-2 text-xs border border-warning/30 text-warning rounded-lg flex gap-1"><RotateCcw size={13}/>Reopen</button>}
      </div>)}</div>:<div className="p-12 text-center text-text-muted">No incidents match the current filters.</div>}
    </div>
    {resolving&&<ResolutionDialog incident={resolving} onClose={()=>setResolving(null)} onResolve={async note=>{
      await resolveIncident(activeProject.workspaceId,activeProject.id,resolving.id,{resolutionNote:note});
      setResolving(null);
      await load();
    }}/>}
    {viewing&&<ResolutionViewer incident={viewing} onClose={()=>setViewing(null)}/>}
    </>}
  </div>;
}

function ResolutionDialog({incident,onClose,onResolve}){
  const [note,setNote]=useState('');const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  const submit=async e=>{e.preventDefault();if(!note.trim()){setError('Enter how the incident was resolved.');return}
    setSaving(true);try{await onResolve(note.trim())}catch(x){setError(x.message);setSaving(false)}};
  return <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-5"><form onSubmit={submit} className="w-full max-w-lg bg-dark-card border border-dark-border rounded-xl shadow-2xl">
    <div className="p-5 border-b border-dark-border flex justify-between"><div><h2 className="text-lg font-semibold text-text-primary">Resolve Incident</h2><p className="text-xs text-text-muted mt-1">{incident.serviceName} · {incident.title}</p></div><button type="button" onClick={onClose}><X size={18}/></button></div>
    <div className="p-5"><label className="text-sm text-text-secondary">Resolution solution</label><textarea autoFocus rows={5} maxLength={5000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Describe the investigation, fix and recovery steps…" className="mt-2 w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"/>
      <div className="text-xs text-text-muted mt-2">Resolving automatically records acknowledgement and shares this note with all project members.</div>{error&&<div className="text-danger text-sm mt-2">{error}</div>}</div>
    <div className="p-5 border-t border-dark-border flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary">Cancel</button><button disabled={saving} className="px-4 py-2 bg-success text-white rounded-lg">{saving?'Resolving…':'Confirm Resolution'}</button></div>
  </form></div>
}

function ResolutionViewer({incident,onClose}){
  return <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-5"><div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-xl shadow-2xl">
    <div className="p-5 border-b border-dark-border flex justify-between"><div><h2 className="text-lg font-semibold text-text-primary">Resolution Details</h2><p className="text-xs text-text-muted mt-1">{incident.serviceName} · {incident.title}</p></div><button onClick={onClose}><X size={18}/></button></div>
    <div className="p-5 space-y-4"><div className="grid grid-cols-2 gap-3"><div className="bg-dark-card-2 rounded-lg p-3"><div className="text-xs text-text-muted">Resolved by</div><div className="text-sm text-text-primary mt-1">{incident.resolvedByName||'Automatic recovery'}</div></div>
      <div className="bg-dark-card-2 rounded-lg p-3"><div className="text-xs text-text-muted">Resolved at</div><div className="text-sm text-text-primary mt-1">{incident.resolvedAt?new Date(incident.resolvedAt).toLocaleString():'—'}</div></div></div>
      <div><div className="text-xs text-text-muted mb-2">Resolution solution</div><div className="p-4 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-secondary whitespace-pre-wrap">{incident.resolutionNote||'No resolution note was recorded.'}</div></div></div>
    <div className="p-5 border-t border-dark-border flex justify-end"><button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-lg">Close</button></div>
  </div></div>
}

