import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createProjectInvitation } from '../api';

export default function InviteTeamMemberPopup({ project, currentUserRole, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const roles = currentUserRole === 'OWNER'
    ? ['ADMIN', 'EDITOR', 'VIEWER']
    : ['EDITOR', 'VIEWER'];

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const invitation = await createProjectInvitation(
        project.workspaceId, project.id, { email, role, message });
      onInvited(invitation);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={submit} className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Invite Team Member</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Email Address</label>
            <input required type="email" maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Project role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary">
              {roles.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Message (optional)</label>
            <textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message for the invitation"
              className="w-full px-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary resize-none" />
          </div>
          <p className="text-xs text-text-muted">
            The invitation is valid for seven days. The invited user must accept it from Notifications before the project is added to their Project Hub.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
          <button disabled={saving} className="px-4 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {saving ? 'Sending…' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}
