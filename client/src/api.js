const API_BASE = '/api/v1';

export const getAuthToken = () => localStorage.getItem('vistaro_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('vistaro_token', token);
  else localStorage.removeItem('vistaro_token');
};

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth & Personas
  getDemoUsers: () => apiRequest('/auth/demo-users'),
  switchDemo: (userId) => apiRequest('/auth/switch-demo', { method: 'POST', body: JSON.stringify({ userId }) }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),

  // Opportunities
  getOpportunities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/opportunities${query ? `?${query}` : ''}`);
  },
  getInvitedOpportunities: () => apiRequest('/opportunities/invited'),
  getOpportunity: (id) => apiRequest(`/opportunities/${id}`),
  createOpportunity: (data) => apiRequest('/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  updateOpportunity: (id, data) => apiRequest(`/opportunities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  publishOpportunity: (id) => apiRequest(`/opportunities/${id}/publish`, { method: 'POST' }),
  closeOpportunity: (id) => apiRequest(`/opportunities/${id}/close`, { method: 'POST' }),
  saveOpportunity: (id, notes = '') => apiRequest(`/opportunities/${id}/save`, { method: 'POST', body: JSON.stringify({ notes }) }),
  unsaveOpportunity: (id) => apiRequest(`/opportunities/${id}/save`, { method: 'DELETE' }),

  // Tender Invitations (Private Tenders)
  getTenderInvitations: (oppId) => apiRequest(`/opportunities/${oppId}/invitations`),
  inviteVendorToTender: (oppId, data) => apiRequest(`/opportunities/${oppId}/invitations`, { method: 'POST', body: JSON.stringify(data) }),
  revokeTenderInvitation: (oppId, invId) => apiRequest(`/opportunities/${oppId}/invitations/${invId}`, { method: 'DELETE' }),

  // Vendors
  getVendors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/vendors${query ? `?${query}` : ''}`);
  },
  getVendor: (id) => apiRequest(`/vendors/${id}`),
  getMyVendorProfile: () => apiRequest('/vendors/me'),
  updateMyVendorProfile: (data) => apiRequest('/vendors/me', { method: 'PATCH', body: JSON.stringify(data) }),
  addPortfolioItem: (data) => apiRequest('/vendors/me/portfolio', { method: 'POST', body: JSON.stringify(data) }),

  // Proposals & Readiness
  getMyProposals: () => apiRequest('/proposals/mine'),
  getOpportunityProposals: (oppId) => apiRequest(`/proposals/opportunity/${oppId}`),
  getProposal: (id) => apiRequest(`/proposals/${id}`),
  submitProposal: (oppId, data) => apiRequest(`/proposals/opportunity/${oppId}`, { method: 'POST', body: JSON.stringify(data) }),
  evaluateProposal: (id, data) => apiRequest(`/proposals/${id}/evaluations`, { method: 'POST', body: JSON.stringify(data) }),
  sendClarification: (id, message) => apiRequest(`/proposals/${id}/clarification`, { method: 'POST', body: JSON.stringify({ message }) }),
  recordDecision: (id, decision, reason) => apiRequest(`/proposals/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),

  getReadiness: (oppId) => apiRequest(`/readiness/opportunity/${oppId}`),
  updateReadiness: (oppId, checklist_items) => apiRequest(`/readiness/opportunity/${oppId}`, { method: 'POST', body: JSON.stringify({ checklist_items }) }),

  // Buyer Enquiries
  getEnquiries: () => apiRequest('/enquiries'),
  getEnquiry: (id) => apiRequest(`/enquiries/${id}`),
  sendVendorEnquiry: (vendorOrgId, data) => apiRequest(`/enquiries/vendor/${vendorOrgId}`, { method: 'POST', body: JSON.stringify(data) }),
  replyEnquiry: (id, message) => apiRequest(`/enquiries/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Services & Promotions
  getServices: () => apiRequest('/services'),
  getService: (slug) => apiRequest(`/services/${slug}`),
  submitServiceRequest: (data) => apiRequest('/services/requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyServiceRequests: () => apiRequest('/services/requests/mine'),
  getServiceRequest: (id) => apiRequest(`/services/requests/${id}`),
  updateServiceRequestStatus: (id, data) => apiRequest(`/services/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  createServiceQuote: (requestId, data) => apiRequest(`/services/requests/${requestId}/quotes`, { method: 'POST', body: JSON.stringify(data) }),
  respondToServiceQuote: (quoteId, decision, reason) => apiRequest(`/services/quotes/${quoteId}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),
  addServiceMilestone: (requestId, data) => apiRequest(`/services/requests/${requestId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  updateServiceMilestone: (milestoneId, data) => apiRequest(`/services/milestones/${milestoneId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Tasks & Notifications
  getTasks: () => apiRequest('/tasks'),
  createTask: (data) => apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => apiRequest(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),

  // Contextual AI Assistant
  askAssistant: (query, context = {}) => apiRequest('/assistant/messages', { method: 'POST', body: JSON.stringify({ query, context }) }),
  getAssistantHistory: () => apiRequest('/assistant/history'),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminServiceQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/service-queue${query ? `?${query}` : ''}`);
  },
  getAdminAuditLogs: () => apiRequest('/admin/audit-logs'),
  getAdminUsers: () => apiRequest('/admin/users')
};
