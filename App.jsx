import React, { useState, useEffect } from 'react'
import { leadsApi, statsApi, repsApi } from './api'
import { supabase, getUser, signIn, signOut, onAuthStateChange } from './supabase'

// ============ HELPER FUNCTIONS ============

// Format date
function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format time
function formatTime(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get status badge color
function getStatusBadgeClass(status) {
  const classes = {
    new: 'badge-new',
    claimed: 'badge-claimed',
    contacted: 'badge-contacted',
    qualified: 'badge-qualified',
    proposal_sent: 'badge-proposal',
    closed_won: 'badge-won',
    closed_lost: 'badge-lost',
  }
  return classes[status] || 'badge-new'
}

// Get priority badge color
function getPriorityBadgeClass(priority) {
  const classes = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }
  return classes[priority] || 'badge-low'
}

// Check if user is admin
function isAdmin(user) {
  return user?.user_metadata?.role === 'admin' || user?.role === 'admin'
}

// ============ UI COMPONENTS ============

// Loading Spinner
function Spinner() {
  return <div className="spinner"></div>
}

// Alert Component
function Alert({ type, message, onClose }) {
  if (!message) return null
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

// Modal Component
function Modal({ isOpen, title, children, onClose, footer }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ============ LOGIN PAGE ============

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) throw signInError
      onLogin()
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 className="card-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Devign Leads
        </h1>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <>
                <Spinner /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
          Demo: Use any email/password. Backend will validate.
        </p>
      </div>
    </div>
  )
}

// ============ DASHBOARD PAGE ============

function DashboardPage({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await statsApi.getStats()
      setStats(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <Spinner />
      </div>
    )
  }

  const s = stats || {}

  return (
    <div>
      <div className="header">
        <h1>Dashboard</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-4">
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Total Leads
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{s.total_leads || 0}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Claimed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {s.claimed_leads || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Unclaimed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {s.unclaimed_leads || 0}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Closed Won
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {s.closed_won || 0}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activity</h2>
        </div>
        {s.recent_activities && s.recent_activities.length > 0 ? (
          <div style={{ fontSize: '0.875rem' }}>
            {s.recent_activities.slice(0, 5).map((activity, i) => (
              <div key={i} style={{ paddingBottom: '1rem', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ fontWeight: '500' }}>{activity.lead_company}</div>
                <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{activity.action}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {formatDate(activity.created_at)} {formatTime(activity.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>No recent activity</p>
        )}
      </div>
    </div>
  )
}

// ============ LEADS TABLE PAGE ============

function LeadsPage({ user, onRefresh }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [page, filters])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await leadsApi.list(page, limit, {
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
      })
      setLeads(response.data.leads || [])
      setTotal(response.data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value })
    setPage(1)
  }

  const handlePriorityChange = (e) => {
    setFilters({ ...filters, priority: e.target.value })
    setPage(1)
  }

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value })
    setPage(1)
  }

  const handleLeadClick = (lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="header">
        <div>
          <h1>Leads</h1>
          <p className="card-subtitle">Total: {total} leads</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Lead
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search..."
          value={filters.search}
          onChange={handleSearchChange}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <select
          className="form-select"
          value={filters.status}
          onChange={handleStatusChange}
          style={{ minWidth: '150px' }}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="claimed">Claimed</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>
        <select
          className="form-select"
          value={filters.priority}
          onChange={handlePriorityChange}
          style={{ minWidth: '150px' }}
        >
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner />
        </div>
      ) : leads.length > 0 ? (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Claimed By</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: '500' }}>{lead.company_name}</td>
                    <td>{lead.contact_name}</td>
                    <td>{lead.email}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td>{lead.claimed_by || '-'}</td>
                    <td>{formatDate(lead.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleLeadClick(lead)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No leads found</p>
        </div>
      )}

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchLeads()
        }}
      />

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          isOpen={showDetailModal}
          lead={selectedLead}
          user={user}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedLead(null)
          }}
          onSuccess={() => {
            setShowDetailModal(false)
            setSelectedLead(null)
            fetchLeads()
          }}
        />
      )}
    </div>
  )
}

// ============ CREATE LEAD MODAL ============

function CreateLeadModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    city: '',
    country: '',
    priority: 'medium',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.company_name.trim()) {
      setError('Company name is required')
      return
    }

    try {
      setLoading(true)
      await leadsApi.create(formData)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
        Cancel
      </button>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creating...' : 'Create Lead'}
      </button>
    </>
  )

  return (
    <Modal isOpen={isOpen} title="Create New Lead" onClose={onClose} footer={footer}>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Company Name *</label>
          <input
            type="text"
            name="company_name"
            className="form-input"
            value={formData.company_name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contact Name</label>
          <input
            type="text"
            name="contact_name"
            className="form-input"
            value={formData.contact_name}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="url"
              name="website"
              className="form-input"
              value={formData.website}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Industry</label>
            <input
              type="text"
              name="industry"
              className="form-input"
              value={formData.industry}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">City</label>
            <input
              type="text"
              name="city"
              className="form-input"
              value={formData.city}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              className="form-input"
              value={formData.country}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Priority</label>
          <select
            name="priority"
            className="form-select"
            value={formData.priority}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            name="notes"
            className="form-textarea"
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </form>
    </Modal>
  )
}

// ============ LEAD DETAIL MODAL ============

function LeadDetailModal({ isOpen, lead, user, onClose, onSuccess }) {
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editData, setEditData] = useState(lead)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchActivities()
    }
  }, [isOpen, lead.id])

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true)
      const response = await leadsApi.getActivities(lead.id)
      setActivities(response.data || [])
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleClaimLead = async () => {
    try {
      setClaimLoading(true)
      await leadsApi.claim(lead.id)
      onSuccess()
    } catch (err) {
      alert(err.message || 'Failed to claim lead')
    } finally {
      setClaimLoading(false)
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData({ ...editData, [name]: value })
  }

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true)
      setEditError('')
      await leadsApi.update(lead.id, editData)
      onSuccess()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteLead = async () => {
    try {
      setDeleteLoading(true)
      await leadsApi.delete(lead.id)
      onSuccess()
    } catch (err) {
      alert(err.message || 'Failed to delete lead')
    } finally {
      setDeleteLoading(false)
    }
  }

  const canEdit = isAdmin(user) || lead.claimed_by === user?.id
  const canClaim = lead.status === 'new' && !lead.claimed_by

  return (
    <Modal isOpen={isOpen} title={lead.company_name} onClose={onClose}>
      {!showEditForm ? (
        <>
          {/* View Mode */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Status
                </div>
                <span className={`badge ${getStatusBadgeClass(lead.status)}`}>{lead.status}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Priority
                </div>
                <span className={`badge ${getPriorityBadgeClass(lead.priority)}`}>{lead.priority}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Contact</div>
                <div>{lead.contact_name || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</div>
                <div>{lead.email || '-'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone</div>
                <div>{lead.phone || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Website</div>
                <div>{lead.website || '-'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Industry</div>
                <div>{lead.industry || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Location</div>
                <div>
                  {lead.city}
                  {lead.city && lead.country ? ', ' : ''}
                  {lead.country}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Claimed By</div>
              <div>{lead.claimed_by || 'Unclaimed'}</div>
            </div>

            {lead.notes && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Notes</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</div>
              </div>
            )}
          </div>

          {/* Activities */}
          <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>Activity Timeline</h3>
            {loadingActivities ? (
              <Spinner />
            ) : activities.length > 0 ? (
              <div style={{ fontSize: '0.875rem' }}>
                {activities.map((activity, i) => (
                  <div key={i} style={{ paddingBottom: '1rem', borderBottom: i < activities.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontWeight: '500' }}>{activity.action}</div>
                    <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                      {formatDate(activity.created_at)} {formatTime(activity.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No activities yet</p>
            )}
          </div>

          {/* Actions */}
          <div className="modal-footer">
            {canClaim && (
              <button className="btn btn-primary" onClick={handleClaimLead} disabled={claimLoading}>
                {claimLoading ? 'Claiming...' : 'Claim Lead'}
              </button>
            )}
            {canEdit && (
              <>
                <button className="btn btn-secondary" onClick={() => setShowEditForm(true)}>
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isAdmin(user) ? false : true}
                >
                  Delete
                </button>
              </>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>
              <p style={{ marginBottom: '1rem', color: '#7f1d1d' }}>
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteLead}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Edit Mode */}
          {editError && <Alert type="error" message={editError} onClose={() => setEditError('')} />}

          <form>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                name="company_name"
                className="form-input"
                value={editData.company_name}
                onChange={handleEditChange}
                disabled={editLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input
                type="text"
                name="contact_name"
                className="form-input"
                value={editData.contact_name}
                onChange={handleEditChange}
                disabled={editLoading}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={editData.email}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={editData.phone}
                  onChange={handleEditChange}
                  disabled={editLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={editData.status}
                onChange={handleEditChange}
                disabled={editLoading}
              >
                <option value="new">New</option>
                <option value="claimed">Claimed</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                className="form-select"
                value={editData.priority}
                onChange={handleEditChange}
                disabled={editLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                className="form-textarea"
                value={editData.notes}
                onChange={handleEditChange}
                disabled={editLoading}
              />
            </div>
          </form>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowEditForm(false)} disabled={editLoading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ============ MY LEADS PAGE ============

function MyLeadsPage({ user }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchMyLeads()
  }, [page])

  const fetchMyLeads = async () => {
    try {
      setLoading(true)
      const response = await leadsApi.list(page, limit)
      const myLeads = (response.data.leads || []).filter((lead) => lead.claimed_by === user?.id)
      setLeads(myLeads)
      setTotal(myLeads.length)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadClick = (lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <div className="header">
        <div>
          <h1>My Leads</h1>
          <p className="card-subtitle">Total: {total} leads</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner />
        </div>
      ) : leads.length > 0 ? (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: '500' }}>{lead.company_name}</td>
                    <td>{lead.contact_name}</td>
                    <td>{lead.email}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td>{formatDate(lead.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleLeadClick(lead)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No leads claimed yet</p>
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal
          isOpen={showDetailModal}
          lead={selectedLead}
          user={user}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedLead(null)
          }}
          onSuccess={() => {
            setShowDetailModal(false)
            setSelectedLead(null)
            fetchMyLeads()
          }}
        />
      )}
    </div>
  )
}

// ============ ADMIN REPS PAGE ============

function AdminRepsPage() {
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReps()
  }, [])

  const fetchReps = async () => {
    try {
      setLoading(true)
      const response = await repsApi.list()
      setReps(response.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeReps = reps.filter((rep) => rep.is_active).length
  const inactiveReps = reps.filter((rep) => !rep.is_active).length

  return (
    <div>
      <div className="header">
        <h1>Sales Representatives</h1>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="grid grid-3">
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Total Reps
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{reps.length}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Active
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {activeReps}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Inactive
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>
            {inactiveReps}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Spinner />
        </div>
      ) : reps.length > 0 ? (
        <div className="grid grid-3">
          {reps.map((rep) => (
            <div key={rep.id} className="card">
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{rep.full_name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                {rep.email}
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Role
                </div>
                <div style={{ fontWeight: '500' }}>{rep.role}</div>
              </div>
              <div>
                <span className={`badge ${rep.is_active ? 'badge-won' : 'badge-lost'}`}>
                  {rep.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#6b7280' }}>No sales representatives found</p>
        </div>
      )}
    </div>
  )
}

// ============ SIDEBAR NAVIGATION ============

function Sidebar({ currentPage, onPageChange, user, onLogout, mobileMenuOpen, onMobileMenuClose }) {
  const isAdminUser = isAdmin(user)

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="modal-overlay"
          onClick={onMobileMenuClose}
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        />
      )}

      <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-logo">Devign Leads</div>

        <ul className="nav-menu">
          <li className="nav-item">
            <button
              className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                onPageChange('dashboard')
                onMobileMenuClose()
              }}
            >
              📊 Dashboard
            </button>
          </li>

          <li className="nav-item">
            <button
              className={`nav-link ${currentPage === 'leads' ? 'active' : ''}`}
              onClick={() => {
                onPageChange('leads')
                onMobileMenuClose()
              }}
            >
              📋 Leads
            </button>
          </li>

          <li className="nav-item">
            <button
              className={`nav-link ${currentPage === 'my-leads' ? 'active' : ''}`}
              onClick={() => {
                onPageChange('my-leads')
                onMobileMenuClose()
              }}
            >
              ✓ My Leads
            </button>
          </li>

          {isAdminUser && (
            <>
              <li className="nav-divider"></li>
              <li className="nav-item">
                <button
                  className={`nav-link ${currentPage === 'admin-reps' ? 'active' : ''}`}
                  onClick={() => {
                    onPageChange('admin-reps')
                    onMobileMenuClose()
                  }}
                >
                  👥 Manage Reps
                </button>
              </li>
            </>
          )}
        </ul>

        <div className="nav-user">
          <div className="nav-user-email">{user?.email}</div>
          <button
            className="btn btn-secondary w-full"
            onClick={() => {
              onLogout()
              onMobileMenuClose()
            }}
            style={{ marginTop: '0.5rem' }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

// ============ MAIN APP ============

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Initialize auth
    const initAuth = async () => {
      try {
        const currentUser = await getUser()
        setUser(currentUser)
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      setUser(null)
      setCurrentPage('dashboard')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={() => window.location.reload()} />
  }

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <div className="main-content">
        {/* Mobile Menu Button */}
        <div style={{ display: 'none', marginBottom: '1rem' }} className="mobile-menu-btn">
          <button
            className="btn btn-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ '@media (max-width: 768px)': { display: 'block' } }}
          >
            ☰ Menu
          </button>
        </div>

        {/* Pages */}
        {currentPage === 'dashboard' && <DashboardPage user={user} />}
        {currentPage === 'leads' && <LeadsPage user={user} />}
        {currentPage === 'my-leads' && <MyLeadsPage user={user} />}
        {isAdmin(user) && currentPage === 'admin-reps' && <AdminRepsPage />}
      </div>
    </div>
  )
}
