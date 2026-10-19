import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, Plus, Search, Trash2, X } from 'lucide-react';
import InviteTeamMemberPopup from './InviteTeamMemberPopup';
import {
  changeProjectMemberRole, getProjectTeam, removeProjectMember, revokeProjectInvitation,
} from '../api';

const initials = (name, email) => (name || email || '?').split(/\s+/)
  .map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function TeamManagement({ onBack, project }) {
  const [team, setTeam] = useState({ members: [], invitations: [], currentUserRole: 'VIEWER' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showInvitationStatus, setShowInvitationStatus] = useState(false);

  const load = async () => {
    if (!project?.workspaceId || !project?.id) {
      setError('Select a persisted project before opening Team Management.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try { setTeam(await getProjectTeam(project.workspaceId, project.id)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [project?.workspaceId, project?.id]);

  const canManage = ['OWNER', 'ADMIN'].includes(team.currentUserRole);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return !term ? team.members : team.members.filter((member) =>
      member.displayName.toLowerCase().includes(term) || member.email.toLowerCase().includes(term));
  }, [team.members, query]);

  const changeRole = async (member, role) => {
    setError('');
    try {
      const updated = await changeProjectMemberRole(project.workspaceId, project.id, member.userId, role);
      setTeam((current) => ({ ...current,
        members: current.members.map((item) => item.userId === updated.userId ? updated : item) }));
    } catch (requestError) { setError(requestError.message); }
  };

  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.displayName} from this project?`)) return;
    setError('');
    try {
      await removeProjectMember(project.workspaceId, project.id, member.userId);
      setTeam((current) => ({ ...current,
        members: current.members.filter((item) => item.userId !== member.userId) }));
    } catch (requestError) { setError(requestError.message); }
  };

  const revoke = async (invitation) => {
    setError('');
    try {
      await revokeProjectInvitation(project.workspaceId, project.id, invitation.id);
      setTeam((current) => ({ ...current,
        invitations: current.invitations.filter((item) => item.id !== invitation.id) }));
    } catch (requestError) { setError(requestError.message); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Team Management</h1>
            <p className="text-sm text-text-muted mt-1">{project?.name || 'Project'} · Your role: {team.currentUserRole}</p>
          </div>
        </div>
        {canManage && <div className="flex items-center gap-3">
          <button onClick={() => setShowInvitationStatus(true)}
            className="flex items-center gap-2 px-4 py-2 border border-dark-border text-text-secondary hover:border-primary hover:text-primary rounded-lg text-sm font-medium">
            <Mail size={16} /> Invitation Status
            {team.invitations.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{team.invitations.length}</span>}
          </button>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium">
            <Plus size={16} /> Invite Member
          </button>
        </div>}
      </div>

      {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members..."
          className="w-full pl-10 pr-3 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary" />
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-text-muted">Loading project team…</div> :
          <table className="w-full">
            <thead><tr className="border-b border-dark-border">
              {['Member', 'Email', 'Role', 'Joined At', 'Actions'].map((label) =>
                <th key={label} className="text-left text-xs text-text-muted font-medium px-4 py-3">{label}</th>)}
            </tr></thead>
            <tbody>{visible.map((member) => {
              const owner = member.role === 'OWNER';
              const adminRestriction = team.currentUserRole === 'ADMIN' && member.role === 'ADMIN';
              const editable = canManage && !owner && !adminRestriction;
              const allowedRoles = team.currentUserRole === 'OWNER'
                ? ['ADMIN', 'EDITOR', 'VIEWER'] : ['EDITOR', 'VIEWER'];
              return <tr key={member.userId} className="border-b border-dark-border/50">
                <td className="px-4 py-3"><div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {initials(member.displayName, member.email)}
                  </div><span className="text-sm text-text-primary font-medium">{member.displayName}</span>
                </div></td>
                <td className="px-4 py-3 text-sm text-text-secondary">{member.email}</td>
                <td className="px-4 py-3">{editable ?
                  <select value={member.role} onChange={(e) => changeRole(member, e.target.value)}
                    className="bg-dark-card-2 border border-dark-border rounded px-2 py-1 text-xs text-text-primary">
                    {allowedRoles.map((role) => <option key={role}>{role}</option>)}
                  </select> :
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{member.role}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{new Date(member.joinedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{editable &&
                  <button onClick={() => remove(member)} className="p-1.5 text-text-muted hover:text-danger"><Trash2 size={16} /></button>}
                </td>
              </tr>;
            })}</tbody>
          </table>}
      </div>

      {showInvite && <InviteTeamMemberPopup project={project} currentUserRole={team.currentUserRole}
        onClose={() => setShowInvite(false)}
        onInvited={(invitation) => setTeam((current) => ({ ...current,
          invitations: [invitation, ...current.invitations] }))} />}
      {showInvitationStatus && <InvitationStatusPopup invitations={team.invitations}
        onRevoke={revoke} onClose={() => setShowInvitationStatus(false)} />}
    </div>
  );
}

function InvitationStatusPopup({ invitations, onRevoke, onClose }) {
  return <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-5">
    <div className="w-full max-w-2xl bg-dark-card border border-dark-border rounded-xl shadow-2xl">
      <div className="p-5 border-b border-dark-border flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-text-primary">Invitation Status</h2>
          <p className="text-xs text-text-muted mt-1">Track every project invitation and its latest response.</p></div>
        <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-dark-card-2 rounded-lg"><X size={18}/></button>
      </div>
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {invitations.length > 0 ? <div className="space-y-3">{invitations.map((invitation) =>
          <div key={invitation.id} className="flex items-center gap-4 p-3 bg-dark-card-2 rounded-lg">
            <div className="flex-1 min-w-0"><div className="text-sm text-text-primary truncate">{invitation.email}</div>
              <div className="text-xs text-text-muted">{invitation.role} · invited {new Date(invitation.createdAt).toLocaleDateString()}</div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              invitation.status === 'ACCEPTED' ? 'bg-success/10 text-success'
                : invitation.status === 'REJECTED' ? 'bg-danger/10 text-danger'
                  : invitation.status === 'PENDING' ? 'bg-warning/10 text-warning'
                    : 'bg-dark-card text-text-muted'
            }`}>{invitation.status}</span>
            {invitation.status === 'PENDING' && <button title="Revoke invitation"
              onClick={() => onRevoke(invitation)} className="p-1.5 text-text-muted hover:text-danger"><X size={16}/></button>}
          </div>)}</div> :
          <div className="py-12 text-center"><Mail size={28} className="mx-auto text-text-muted mb-3"/>
            <div className="text-sm text-text-secondary">No invitations have been sent for this project.</div></div>}
      </div>
      <div className="p-5 border-t border-dark-border flex justify-end">
        <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Close</button>
      </div>
    </div>
  </div>;
}
