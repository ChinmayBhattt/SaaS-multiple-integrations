'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Profile, UserRole } from '@/lib/types';
import { Shield, User, Check, X } from 'lucide-react';

const demoStaff: Profile[] = [
  { id: '1', email: 'admin@dmviron.com', full_name: 'John Admin', role: 'admin', created_at: '2024-01-01', updated_at: '' },
  { id: '2', email: 'frontdesk@dmviron.com', full_name: 'Jane Staff', role: 'staff', created_at: '2024-06-15', updated_at: '' },
  { id: '3', email: 'trainer@dmviron.com', full_name: 'Mike Trainer', role: 'staff', created_at: '2025-01-10', updated_at: '' },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<Profile[]>(demoStaff);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'staff' as UserRole });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').order('created_at');
        if (data && data.length > 0) setStaff(data);
      } catch { /* demo */ }
    };
    fetchStaff();
  }, [supabase]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role: form.role,
          },
        },
      });
      if (error) throw error;
      toast.success('Staff account created!');
      setShowModal(false);
      setForm({ email: '', full_name: '', password: '', role: 'staff' });
      // Refresh
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at');
      if (profiles) setStaff(profiles);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (staffId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', staffId);
      if (error) throw error;
      setStaff(staff.map(s => s.id === staffId ? { ...s, role: newRole } : s));
      toast.success('Role updated!');
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <>
      <Header title="Staff" subtitle="Team management" />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Staff Management</h2>
            <p className="page-subtitle">{staff.length} team members</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Staff</button>
          </div>
        </div>

        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="table-member-cell">
                        <div className="table-member-avatar" style={{ background: person.role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : undefined }}>
                          {person.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="table-member-name">{person.full_name}</div>
                      </div>
                    </td>
                    <td>{person.email}</td>
                    <td>
                      <span className={`badge ${person.role === 'admin' ? 'badge-active' : 'badge-pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {person.role === 'admin' ? (
                          <>
                            <Shield size={12} /> Admin
                          </>
                        ) : (
                          <>
                            <User size={12} /> Staff
                          </>
                        )}
                      </span>
                    </td>
                    <td>{formatDate(person.created_at)}</td>
                    <td>
                      <select
                        className="filter-select"
                        style={{ minWidth: 120 }}
                        value={person.role}
                        onChange={(e) => handleRoleChange(person.id, e.target.value as UserRole)}
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Info */}
        <div className="grid-2" style={{ marginTop: 'var(--space-8)' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="card-title">Admin Permissions</h3>
            </div>
            <div className="card-body">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {['Full member management', 'Create & manage plans', 'View all payments', 'Manage staff accounts', 'Access AI insights', 'View activity logs', 'Configure settings'].map((perm) => (
                  <li key={perm} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--status-active)', display: 'flex', alignItems: 'center' }}><Check size={14} strokeWidth={3} /></span> {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--brand-primary)' }} />
              <h3 className="card-title">Staff Permissions</h3>
            </div>
            <div className="card-body">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {['View members', 'Check members in', 'Log payments', 'Add member notes', 'View attendance'].map((perm) => (
                  <li key={perm} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--status-active)', display: 'flex', alignItems: 'center' }}><Check size={14} strokeWidth={3} /></span> {perm}
                  </li>
                ))}
                {['Manage staff', 'Delete members', 'Configure settings', 'Access AI insights'].map((perm) => (
                  <li key={perm} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--status-expired)', display: 'flex', alignItems: 'center' }}><X size={14} strokeWidth={3} /></span> {perm}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Create Staff Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Add Staff Member</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreateStaff}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
