import React, { useState, useEffect } from 'react';
import { Check, Mail, X } from 'lucide-react';

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Sidebar from './components/Sidebar';
import ProjectHub from './pages/ProjectHub';
import CreateProjectPopup from './pages/CreateProjectPopup';
import ProjectDetails from './pages/ProjectDetails';
import GraphVisualization from './pages/GraphVisualization';
import BlastRadiusAnalysis from './pages/BlastRadiusAnalysis';
import AddServicePopup from './pages/AddServicePopup';
import AddDependencyPopup from './pages/AddDependencyPopup';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamManagement from './pages/TeamManagement';
import NotificationsPage from './pages/NotificationsPage';
import UserProfile from './pages/UserProfile';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import { supabase } from './supabaseClient';
import {
  acceptProjectInvitation, bootstrapCurrentUser, listMyInvitations,
  rejectProjectInvitation, resetCurrentUserCache, getIncidentSummary, listProjects,
} from './api';

const NAVIGATION_STORAGE_KEY = 'nervix:last-navigation';
const projectPages = new Set(['project-details', 'blast-radius', 'analytics', 'teams', 'settings']);

const readSavedNavigation = () => {
  try { return JSON.parse(localStorage.getItem(NAVIGATION_STORAGE_KEY) || 'null'); }
  catch { return null; }
};

export default function App() {

  // Start on the login page instead of home. Once you have real auth,
  // flip this based on whether a session/token already exists.
  const [activePage, setActivePage] = useState('login');
  const [pageHistory, setPageHistory] = useState([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [dependencyRevision, setDependencyRevision] = useState(0);
  const [simulationServiceId, setSimulationServiceId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [notificationProject, setNotificationProject] = useState(null);
  const [userData, setUserData] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationError, setInvitationError] = useState('');
  const [invitationBusy, setInvitationBusy] = useState(false);
  const [projectHubRevision, setProjectHubRevision] = useState(0);
  const [notificationBadge, setNotificationBadge] = useState(false);
  const authPages = ['login', 'signup', 'forgot-password'];
  const isAuthPage = authPages.includes(activePage);



  //supabase auth
  useEffect(() => {
    let active = true;

    const bootstrapSession = async (session) => {
      if (!session) {
        resetCurrentUserCache();
        localStorage.removeItem(NAVIGATION_STORAGE_KEY);
        if (active) {
          setUserData(null);
          setSelectedProject(null);
          setActivePage('login');
        }
        return;
      }
      try {
        const profile = await bootstrapCurrentUser();
        if (active) {
          const saved = readSavedNavigation();
          setUserData(profile);
          listMyInvitations()
            .then((items) => active && setPendingInvitations(items))
            .catch((error) => active && setInvitationError(error.message));
          if (saved?.selectedProject?.id && projectPages.has(saved.activePage)) {
            setSelectedProject(saved.selectedProject);
            setActivePage(saved.activePage);
          } else {
            setSelectedProject(null);
            setActivePage('home');
          }
        }
      } catch (err) {
        console.error('Auth sync failed:', err);
        if (active) {
          setUserData(null);
          setActivePage('login');
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => bootstrapSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => bootstrapSession(session), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userData || isAuthPage) return;
    localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify({
      activePage,
      selectedProject,
    }));
  }, [activePage, selectedProject, userData, isAuthPage]);

  useEffect(() => {
    const workspaceId = userData?.workspaces?.[0]?.id;
    if (!workspaceId || isAuthPage) {
      setNotificationBadge(false);
      return undefined;
    }
    let active = true;
    let refreshing = false;
    const refreshNotificationBadge = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const projects = await listProjects(workspaceId);
        const summaries = await Promise.all(projects.map((item) =>
          getIncidentSummary(item.workspaceId || workspaceId, item.id)));
        if (active) setNotificationBadge(summaries.some((summary) => (summary?.active || 0) > 0));
      } catch (error) {
        console.warn('Notification badge refresh failed:', error.message);
      } finally {
        refreshing = false;
      }
    };
    refreshNotificationBadge();
    const timer = window.setInterval(refreshNotificationBadge, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [userData, isAuthPage]);



  /*const user = {
    name: 'Krishna Singh',
    role: 'Administrator',
    initials: 'KS',
  };*/

  const handleNavigate = (page, options) => {
    if (page === 'blast-radius') setSimulationServiceId(options?.serviceId || null);
    if (page === 'alerts') setNotificationProject(projectPages.has(activePage) ? selectedProject : null);
    if (page === 'home') {
      setPageHistory([]);
    } else if (page !== activePage) {
      setPageHistory((h) => [...h, activePage]);
    }
    setActivePage(page);
  };

  const handleBack = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory((h) => h.slice(0, -1));
      setActivePage(prev);
    } else if (selectedProject && projectPages.has(activePage) && activePage !== 'project-details') {
      setActivePage('project-details');
    } else {
      setActivePage('home');
      setPageHistory([]);
    }
  };

  const handleNewProject = () => {
    setShowCreateProject(true);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    if (project?.workspaceId && project?.id) {
      getIncidentSummary(project.workspaceId, project.id)
        .then((summary) => setNotificationBadge((summary?.active || 0) > 0))
        .catch(() => {});
    }
    setPageHistory((h) => [...h, activePage]);
    setActivePage('project-details');
  };

  const handleAddService = () => {
    setShowAddService(true);
  };

  const handleAddDependency = () => {
    setShowAddDependency(true);
  };

  const respondToCurrentInvitation = async (accept) => {
    const invitation = pendingInvitations[0];
    if (!invitation) return;
    setInvitationBusy(true);
    setInvitationError('');
    try {
      if (accept) {
        await acceptProjectInvitation(invitation.id);
        setProjectHubRevision((value) => value + 1);
      } else {
        await rejectProjectInvitation(invitation.id);
      }
      setPendingInvitations((current) => current.slice(1));
    } catch (error) {
      setInvitationError(error.message);
    } finally {
      setInvitationBusy(false);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'signup':
        return <Signup onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={handleNavigate} />;
      case 'home':
        return (
          <ProjectHub
            userData={userData}
            revision={projectHubRevision}
            onNavigate={handleNavigate}
            onNewProject={handleNewProject}
            onSelectProject={handleSelectProject}
          />
        );
      case 'project-details':
        return (
          <ProjectDetails
            project={selectedProject}
            onBack={handleBack}
            onNavigate={handleNavigate}
            onAddService={handleAddService}
            onAddDependency={handleAddDependency}
            dependencyRevision={dependencyRevision}
          />
        );
      case 'graph':
        return (
          <GraphVisualization
            project={selectedProject}
            onBack={handleBack}
            onBlastRadius={() => handleNavigate('blast-radius')}
          />
        );
      case 'blast-radius':
        return (
          <BlastRadiusAnalysis
            onBack={handleBack}
            project={selectedProject}
            initialServiceId={simulationServiceId}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage
            onBack={handleBack}
            project={selectedProject}
          />
        );
      case 'teams':
        return (
          <TeamManagement
            onBack={handleBack}
            project={selectedProject}
          />
        );
      case 'alerts':
        return (
          <NotificationsPage
            onBack={handleBack}
            project={notificationProject}
            onBadgeChange={setNotificationBadge}
          />
        );
      case 'activity':
        return (
          <ActivityPage
            onBack={handleBack}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            onBack={handleBack}
            project={selectedProject}
          />
        );
        case 'profile':
          return (
            <UserProfile
              userData={userData}
              onBack={handleBack}
              onNavigate={handleNavigate}
            />
          );
      default:
        return (
          <ProjectHub
            userData={userData}
            revision={projectHubRevision}
            onNavigate={handleNavigate}
            onNewProject={handleNewProject}
            onSelectProject={handleSelectProject}
          />
        );
    }
  };

  // Auth pages (login/signup/forgot-password) render full-screen with no
  // Sidebar and no app shell, since the user isn't "in" the app yet.
  if (isAuthPage) {
    return <div className="min-h-screen bg-dark-bg">{renderPage()}</div>;
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar activePage={activePage} setActivePage={handleNavigate} user={userData} showNotificationBadge={notificationBadge} />
      <main className="flex-1 ml-56 min-h-screen overflow-auto">
        {renderPage()}
      </main>

      {showCreateProject && (
        <CreateProjectPopup
          onClose={() => setShowCreateProject(false)}
          onCreate={() => setShowCreateProject(false)}
        />
      )}

      {showAddService && (
        <AddServicePopup
          onClose={() => setShowAddService(false)}
        />
      )}

      {showAddDependency && (
        <AddDependencyPopup
          project={selectedProject}
          onClose={() => setShowAddDependency(false)}
          onCreated={() => setDependencyRevision((value) => value + 1)}
        />
      )}

      {pendingInvitations[0] && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-sm p-5">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-dark-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Mail size={18} /></div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Project Invitation</h2>
                <p className="text-xs text-text-muted mt-0.5">{pendingInvitations.length} pending invitation{pendingInvitations.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">{pendingInvitations[0].invitedByName}</span> invited you to
                </div>
                <div className="text-xl font-semibold text-text-primary mt-1">{pendingInvitations[0].projectName}</div>
                <div className="text-xs text-text-muted mt-1">{pendingInvitations[0].role} role · expires {new Date(pendingInvitations[0].expiresAt).toLocaleDateString()}</div>
              </div>
              {pendingInvitations[0].message && <div className="p-3 bg-dark-card-2 rounded-lg text-sm text-text-secondary">“{pendingInvitations[0].message}”</div>}
              {invitationError && <div className="p-3 bg-danger/10 text-danger text-xs rounded-lg">{invitationError}</div>}
              <div className="flex gap-3">
                <button disabled={invitationBusy} onClick={() => respondToCurrentInvitation(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-danger border border-danger/30 rounded-lg hover:bg-danger/10 disabled:opacity-50 flex items-center justify-center gap-2">
                  <X size={15} /> Reject
                </button>
                <button disabled={invitationBusy} onClick={() => respondToCurrentInvitation(true)}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-success hover:bg-emerald-600 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  <Check size={15} /> Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
