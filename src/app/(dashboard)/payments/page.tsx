'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate, getFullName, getInitials } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Payment, PaymentMethod, PaymentStatus, Member } from '@/lib/types';
import { DollarSign, Clock, AlertTriangle, FileText } from 'lucide-react';

const demoPayments: (Payment & { member?: Member })[] = [
  { id: '1', member_id: '1', amount: 49.99, status: 'paid', method: 'card', payment_date: '2025-06-01', created_at: '', member: { id: '1', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '2', member_id: '2', amount: 29.99, status: 'paid', method: 'cash', payment_date: '2025-06-01', created_at: '', member: { id: '2', first_name: 'Mike', last_name: 'Chen', email: 'mike@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '3', member_id: '3', amount: 49.99, status: 'overdue', method: 'card', payment_date: '2025-05-15', due_date: '2025-05-30', created_at: '', member: { id: '3', first_name: 'Emily', last_name: 'Davis', email: 'emily@email.com', phone: '', status: 'paused', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '4', member_id: '4', amount: 449.99, status: 'paid', method: 'stripe', payment_date: '2025-05-28', created_at: '', member: { id: '4', first_name: 'James', last_name: 'Wilson', email: 'james@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '5', member_id: '5', amount: 29.99, status: 'failed', method: 'card', payment_date: '2025-05-20', created_at: '', member: { id: '5', first_name: 'Lisa', last_name: 'Park', email: 'lisa@email.com', phone: '', status: 'expired', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '6', member_id: '6', amount: 134.99, status: 'pending', method: 'bank_transfer', payment_date: '2025-06-02', created_at: '', member: { id: '6', first_name: 'David', last_name: 'Brown', email: 'david@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { member?: Member })[]>(demoPayments);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ member_id: '', amount: '', method: 'cash' as PaymentMethod, notes: '', status: 'paid' as PaymentStatus });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('payments')
          .select('*, member:members(id, first_name, last_name, email, status)')
          .order('payment_date', { ascending: false });
        if (data && data.length > 0) setPayments(data as unknown as (Payment & { member?: Member })[]);

        const { data: membersData } = await supabase.from('members').select('*').eq('archived', false).order('first_name');
        if (membersData) setMembers(membersData);
      } catch { /* demo */ }
    };
    fetchData();
  }, [supabase]);

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('payments').insert({
        member_id: form.member_id,
        amount: parseFloat(form.amount),
        method: form.method,
        status: form.status,
        notes: form.notes || null,
        payment_date: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      toast.success('Payment logged successfully!');
      setShowModal(false);
      // Refresh
      window.location.reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to log payment');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = (payment: Payment & { member?: Member }) => {
    if (payment.member) {
      window.open(`/payments/invoice/${payment.id}`, '_blank');
    }
  };

  const filteredPayments = statusFilter === 'all'
    ? payments
    : payments.filter(p => p.status === statusFilter);

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const failedCount = payments.filter(p => p.status === 'failed' || p.status === 'overdue').length;

  return (
    <>
      <Header title="Payments" subtitle="Payment management" />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Payments & Billing</h2>
            <p className="page-subtitle">{payments.length} transactions</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Payment</button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="stat-card animate-in">
            <div className="stat-card-header">
              <span className="stat-card-label">Total Revenue</span>
              <span className="stat-card-icon" style={{ color: 'var(--status-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} strokeWidth={2} />
              </span>
            </div>
            <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-header">
              <span className="stat-card-label">Pending/Overdue</span>
              <span className="stat-card-icon" style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} strokeWidth={2} />
              </span>
            </div>
            <div className="stat-card-value">{formatCurrency(pendingAmount)}</div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-header">
              <span className="stat-card-label">Failed/Overdue</span>
              <span className="stat-card-icon" style={{ color: 'var(--status-expired)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} strokeWidth={2} />
              </span>
            </div>
            <div className="stat-card-value" style={{ color: failedCount > 0 ? 'var(--status-expired)' : undefined }}>{failedCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}>
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {payment.member ? (
                        <div className="table-member-cell">
                          <div className="table-member-avatar">
                            {getInitials(payment.member.first_name, payment.member.last_name)}
                          </div>
                          <div>
                            <div className="table-member-name">
                              {getFullName(payment.member.first_name, payment.member.last_name)}
                            </div>
                            <div className="table-member-email">{payment.member.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unknown</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{payment.method.replace('_', ' ')}</td>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td><StatusBadge status={payment.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => generateInvoice(payment)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={14} /> Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log Payment Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Log Payment</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleLogPayment}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Member</label>
                    <select className="form-select" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required>
                      <option value="">Select member...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{getFullName(m.first_name, m.last_name)} — {m.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Amount ($)</label>
                      <input className="form-input" type="number" step="0.01" value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Method</label>
                      <select className="form-select" value={form.method}
                        onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="stripe">Stripe</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Optional payment notes..." rows={3} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Log Payment'}
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
