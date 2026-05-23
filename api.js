import axios from 'axios'
import { getSession } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ============ LEADS ENDPOINTS ============

export const leadsApi = {
  // Get all leads with pagination and filters
  list: (page = 1, limit = 20, filters = {}) => {
    const params = { page, limit, ...filters }
    return api.get('/api/leads', { params })
  },

  // Get single lead
  get: (id) => api.get(`/api/leads/${id}`),

  // Create lead
  create: (data) => api.post('/api/leads', data),

  // Update lead
  update: (id, data) => api.put(`/api/leads/${id}`, data),

  // Delete lead
  delete: (id) => api.delete(`/api/leads/${id}`),

  // Claim lead
  claim: (id) => api.post(`/api/leads/${id}/claim`),

  // Get lead activities
  getActivities: (id) => api.get(`/api/leads/${id}/activities`),
}

// ============ STATS ENDPOINTS ============

export const statsApi = {
  // Get dashboard stats
  getStats: () => api.get('/api/stats'),
}

// ============ REPS ENDPOINTS ============

export const repsApi = {
  // Get all reps
  list: () => api.get('/api/reps'),

  // Get single rep
  get: (id) => api.get(`/api/reps/${id}`),
}

export default api
