import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createService, updateService } from '../api';

export default function AddServicePopup({ project, service, members = [], onClose, onSaved }) {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [serviceType, setType] = useState(service?.serviceType || 'API');
  const [versionLabel, setVersion] = useState(service?.versionLabel || 'v1.0.0');
  const [lifecycleStatus, setLifecycle] = useState(service?.lifecycleStatus || 'ACTIVE');
  const [technology, setTechnology] = useState(service?.technology || '');
  const [repositoryUrl, setRepositoryUrl] = useState(service?.repositoryUrl || '');
  const [endpointUrl, setEndpointUrl] = useState(service?.endpointUrl || '');
  const [runtimeMode, setRuntimeMode] = useState(service?.runtimeMode || 'EXTERNAL');
  const [ownerUserId, setOwner] = useState(service?.ownerUserId || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      name, description, serviceType, versionLabel, healthStatus: 'UNKNOWN', lifecycleStatus,
      technology, repositoryUrl,
      endpointUrl: runtimeMode === 'LOCAL_MANAGED' ? 'managed://auto' : endpointUrl,
      ownerUserId: ownerUserId || null, tags: [],
    };
    try {
      const saved = service
        ? await updateService(project.workspaceId, project.id, service.id, body)
        : await createService(project.workspaceId, project.id, body);
      onSaved(saved);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={submit} className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">{service ? 'Edit Service' : 'Add New Service'}</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Service Name"><input required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} className="field" /></Field>
            <Field label="Version"><input required maxLength={50} value={versionLabel} onChange={(e) => setVersion(e.target.value)} className="field" /></Field>
            <Field label="Service Type"><select value={serviceType} onChange={(e) => setType(e.target.value)} className="field">
              {['API','DATABASE','GATEWAY','CACHE','QUEUE','EVENT','WORKER','EXTERNAL'].map((value) => <option key={value}>{value}</option>)}
            </select></Field>
            <Field label="Lifecycle"><select value={lifecycleStatus} onChange={(e) => setLifecycle(e.target.value)} className="field">
              {['ACTIVE','DEPRECATED','RETIRED'].map((value) => <option key={value}>{value}</option>)}
            </select></Field>
            <Field label="Owner"><select value={ownerUserId} onChange={(e) => setOwner(e.target.value)} className="field">
              <option value="">Current user</option>
              {members.map((member) => <option key={member.userId} value={member.userId}>{member.displayName} · {member.role}</option>)}
            </select></Field>
            <Field label="Technology"><input maxLength={100} value={technology} onChange={(e) => setTechnology(e.target.value)} placeholder="Spring Boot, PostgreSQL..." className="field" /></Field>
            <Field label="Repository URL"><input value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/..." className="field" /></Field>
            <Field label="Runtime deployment"><select value={runtimeMode} onChange={(e) => setRuntimeMode(e.target.value)} className="field">
              <option value="EXTERNAL">Register existing organization service</option>
              <option value="LOCAL_MANAGED">Provision local managed runtime</option>
            </select><span className="block text-xs text-text-muted mt-1">External is production-style registration. Local managed creates a real HTTP listener for failure testing.</span></Field>
            {runtimeMode === 'EXTERNAL' ? <Field label="Health or readiness URL"><input required type="url" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} placeholder="https://orders.example.com/actuator/health" className="field" />
              <span className="block text-xs text-text-muted mt-1">Use the endpoint published by the service deployment. Nervix measures health; the user never selects it.</span>
            </Field> : <Field label="Managed endpoint"><div className="field text-text-muted">Assigned automatically when the service is created</div>
              <span className="block text-xs text-text-muted mt-1">Nervix allocates a localhost port and exposes /health and /ready.</span></Field>}
          </div>
          <Field label="Description"><textarea rows={3} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-none" /></Field>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? 'Saving…' : service ? 'Save Changes' : 'Create Service'}
          </button>
        </div>
        <style>{`.field{width:100%;padding:.55rem .75rem;background:#0D1730;border:1px solid rgba(93,173,226,.18);border-radius:.5rem;color:#E8E0CC;font-size:.875rem}.field:focus{outline:none;border-color:#3B82F6}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block"><span className="block text-sm text-text-secondary mb-1.5">{label}</span>{children}</label>;
}
