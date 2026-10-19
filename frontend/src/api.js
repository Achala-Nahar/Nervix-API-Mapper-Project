import axios from 'axios';
import { supabase } from './supabaseClient';

const API_ROOT = 'http://localhost:8080/api/v1';
const api = axios.create({ baseURL: API_ROOT });
let currentUserSubject;
let currentUserRequest;
let currentUserBootstrapRequest;

export const resetCurrentUserCache = () => {
  currentUserSubject = undefined;
  currentUserRequest = undefined;
  currentUserBootstrapRequest = undefined;
};

const axiosResponse = (config, data, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Created',
  headers: {},
  config,
});

// Compatibility bridge for the existing Login, Signup and App components.
// It preserves their UI while routing authentication through the Supabase
// session required by the Spring resource server.
axios.interceptors.request.use(async (config) => {
  const url = config.url || '';
  if (url.endsWith('/auth/login')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    config.adapter = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error) throw error;
      return axiosResponse(config, {
        message: 'LOGIN_SUCCESS',
        token: data.session.access_token,
      });
    };
  } else if (url.endsWith('/auth/signup') || url.endsWith('/auth/oauth-signup')) {
    config.adapter = async () => axiosResponse(config, { message: 'PROFILE_PROVISIONED_BY_API' }, 201);
  } else if (url.includes('/auth/user/')) {
    config.adapter = async () => {
      const response = await api.get('/users/me');
      return axiosResponse(config, response.data.data);
    };
  }
  return config;
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.status === 401
      ? 'Your session is not valid. Please sign out and sign in again.'
      : error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  },
);

const payload = (response) => response.data.data;
const projectsPath = (workspaceId) => `/workspaces/${workspaceId}/projects`;
const servicesPath = (workspaceId, projectId) => `${projectsPath(workspaceId)}/${projectId}/services`;
const dependenciesPath = (workspaceId, projectId) => `${projectsPath(workspaceId)}/${projectId}/dependencies`;
const graphPath = (workspaceId, projectId) => `${projectsPath(workspaceId)}/${projectId}/graph`;
const incidentsPath = (workspaceId, projectId) => `${projectsPath(workspaceId)}/${projectId}/incidents`;

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const subject = session?.user?.id;
  if (!subject) throw new Error('Your session has expired. Please sign in again.');

  if (currentUserSubject !== subject) {
    currentUserSubject = subject;
    currentUserRequest = undefined;
    currentUserBootstrapRequest = undefined;
  }

  if (!currentUserRequest) {
    currentUserRequest = api.get('/users/me')
      .then(payload)
      .catch((error) => {
        currentUserRequest = undefined;
        throw error;
      });
  }
  return currentUserRequest;
};
export const listProjects = async (workspaceId) => payload(await api.get(projectsPath(workspaceId)));
export const createProject = async (workspaceId, body) => payload(await api.post(projectsPath(workspaceId), body));
export const updateProject = async (workspaceId, projectId, body) =>
  payload(await api.put(`${projectsPath(workspaceId)}/${projectId}`, body));
export const deleteProject = async (workspaceId, projectId) =>
  api.delete(`${projectsPath(workspaceId)}/${projectId}`);
export const listProjectMembers = async (workspaceId, projectId) =>
  payload(await api.get(`${projectsPath(workspaceId)}/${projectId}/members`));
export const getProjectTeam = async (workspaceId, projectId) =>
  payload(await api.get(`${projectsPath(workspaceId)}/${projectId}/team`));
export const changeProjectMemberRole = async (workspaceId, projectId, userId, role) =>
  payload(await api.put(`${projectsPath(workspaceId)}/${projectId}/members/${userId}/role`, { role }));
export const removeProjectMember = async (workspaceId, projectId, userId) =>
  api.delete(`${projectsPath(workspaceId)}/${projectId}/team/members/${userId}`);
export const createProjectInvitation = async (workspaceId, projectId, body) =>
  payload(await api.post(`${projectsPath(workspaceId)}/${projectId}/invitations`, body));
export const revokeProjectInvitation = async (workspaceId, projectId, invitationId) =>
  api.delete(`${projectsPath(workspaceId)}/${projectId}/invitations/${invitationId}`);
export const listMyInvitations = async () =>
  payload(await api.get('/invitations/me'));
export const acceptProjectInvitation = async (invitationId) =>
  payload(await api.post(`/invitations/me/${invitationId}/accept`));
export const rejectProjectInvitation = async (invitationId) =>
  payload(await api.post(`/invitations/me/${invitationId}/reject`));

export const bootstrapCurrentUser = async () => {
  const profile = await getCurrentUser();
  if (!currentUserBootstrapRequest) {
    currentUserBootstrapRequest = Promise.resolve(profile);
  }
  return currentUserBootstrapRequest;
};
export const listServices = async (workspaceId, projectId) =>
  payload(await api.get(servicesPath(workspaceId, projectId)));
export const getServiceSummary = async (workspaceId, projectId) =>
  payload(await api.get(`${servicesPath(workspaceId, projectId)}/summary`));
export const createService = async (workspaceId, projectId, body) =>
  payload(await api.post(servicesPath(workspaceId, projectId), body));
export const updateService = async (workspaceId, projectId, serviceId, body) =>
  payload(await api.put(`${servicesPath(workspaceId, projectId)}/${serviceId}`, body));
export const deleteService = async (workspaceId, projectId, serviceId) =>
  api.delete(`${servicesPath(workspaceId, projectId)}/${serviceId}`);
export const listDependencies = async (workspaceId, projectId) =>
  payload(await api.get(dependenciesPath(workspaceId, projectId)));
export const getDependencySummary = async (workspaceId, projectId) =>
  payload(await api.get(`${dependenciesPath(workspaceId, projectId)}/summary`));
export const createDependency = async (workspaceId, projectId, body) =>
  payload(await api.post(dependenciesPath(workspaceId, projectId), body));
export const updateDependency = async (workspaceId, projectId, dependencyId, body) =>
  payload(await api.put(`${dependenciesPath(workspaceId, projectId)}/${dependencyId}`, body));
export const deleteDependency = async (workspaceId, projectId, dependencyId) =>
  api.delete(`${dependenciesPath(workspaceId, projectId)}/${dependencyId}`);
export const getProjectGraph = async (workspaceId, projectId) =>
  payload(await api.get(graphPath(workspaceId, projectId)));
export const reconcileProjectGraph = async (workspaceId, projectId) =>
  payload(await api.post(`${graphPath(workspaceId, projectId)}/reconcile`));
export const runProjectHealthCheck = async (workspaceId, projectId) =>
  payload(await api.post(`${projectsPath(workspaceId)}/${projectId}/health/check`));
export const stopManagedRuntime = async (workspaceId, projectId, serviceId) =>
  payload(await api.post(`${servicesPath(workspaceId, projectId)}/${serviceId}/runtime/stop`));
export const restartManagedRuntime = async (workspaceId, projectId, serviceId) =>
  payload(await api.post(`${servicesPath(workspaceId, projectId)}/${serviceId}/runtime/restart`));
export const degradeManagedRuntime = async (workspaceId, projectId, serviceId) =>
  payload(await api.post(`${servicesPath(workspaceId, projectId)}/${serviceId}/runtime/degrade`));
export const listIncidents = async (workspaceId, projectId) =>
  payload(await api.get(incidentsPath(workspaceId, projectId)));
export const getIncidentSummary = async (workspaceId, projectId) =>
  payload(await api.get(`${incidentsPath(workspaceId, projectId)}/summary`));
export const detectIncidents = async (workspaceId, projectId) =>
  payload(await api.post(`${incidentsPath(workspaceId, projectId)}/detect`));
export const createIncident = async (workspaceId, projectId, body) =>
  payload(await api.post(incidentsPath(workspaceId, projectId), body));
export const acknowledgeIncident = async (workspaceId, projectId, incidentId, body = {}) =>
  payload(await api.post(`${incidentsPath(workspaceId, projectId)}/${incidentId}/acknowledge`, body));
export const resolveIncident = async (workspaceId, projectId, incidentId, body) =>
  payload(await api.post(`${incidentsPath(workspaceId, projectId)}/${incidentId}/resolve`, body));
export const reopenIncident = async (workspaceId, projectId, incidentId) =>
  payload(await api.post(`${incidentsPath(workspaceId, projectId)}/${incidentId}/reopen`));
export const getProjectAnalytics = async (workspaceId, projectId, range = 'DAYS_30') =>
  payload(await api.get(`${projectsPath(workspaceId)}/${projectId}/analytics`, { params: { range } }));
