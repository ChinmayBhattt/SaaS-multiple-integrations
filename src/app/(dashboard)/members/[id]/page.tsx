'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { getInitials, getFullName, formatDate, formatCurrency, timeAgo, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Member, Payment, AttendanceRecord, MemberNote } from '@/lib/types';
import { Mail, Phone, Calendar, Edit, Archive, QrCode, User, FileText } from 'lucide-react';

// Demo data
const demoMember: Member = {
  id: '1', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@email.com',
  phone: '555-0101', status: 'active', join_date: '2025-01-15',
  date_of_birth: '1995-03-22', emergency_contact: 'Tom Johnson', emergency_phone: '555-0200',
  created_at: '2025-01-15', updated_at: '2025-06-01', archived: false,
};

const demoPayments: Payment[] = [
  { id: '1', member_id: '1', amount: 49.99, status: 'paid', method: 'card', payment_date: '2025-06-01', created_at: '' },
  { id: '2', member_id: '1', amount: 49.99, status: 'paid', method: 'card', payment_date: '2025-05-01', created_at: '' },
  { id: '3', member_id: '1', amount: 49.99, status: 'paid', method: 'cash', payment_date: '2025-04-01', created_at: '' },
];

const demoAttendance: AttendanceRecord[] = [
  { id: '1', member_id: '1', check_in_time: new Date(Date.now() - 86400000).toISOString(), method: 'qr_code', created_at: '' },
  { id: '2', member_id: '1', check_in_time: new Date(Date.now() - 172800000).toISOString(), method: 'manual', created_at: '' },
  { id: '3', member_id: '1', check_in_time: new Date(Date.now() - 345600000).toISOString(), method: 'qr_code', created_at: '' },
];

const demoNotes: MemberNote[] = [
  { id: '1', member_id: '1', staff_id: '1', content: 'Interested in personal training sessions. Follow up next week.', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: '', staff: { id: '1', email: '', full_name: 'Admin', role: 'admin', created_at: '', updated_at: '' } },
  { id: '2', member_id: '1', staff_id: '1', content: 'Completed onboarding tour. Very enthusiastic about group classes.', created_at: new Date(Date.now() - 604800000).toISOString(), updated_at: '', staff: { id: '1', email: '', full_name: 'Front Desk', role: 'staff', created_at: '', updated_at: '' } },
];

type TabId = 'profile' | 'payments' | 'attendance' | 'notes';

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;
  const [member, setMember] = useState<Member>(demoMember);
  const [payments, setPayments] = useState<Payment[]>(demoPayments);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(demoAttendance);
  const [notes, setNotes] = useState<MemberNote[]>(demoNotes);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(demoMember);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberId)
          .single();

        if (memberData) {
          setMember(memberData);
          setEditForm(memberData);

          // Fetch related data
          const [paymentsRes, attendanceRes, notesRes] = await Promise.all([
            supabase.from('payments').select('*').eq('member_id', memberId).order('payment_date', { ascending: false }),
            supabase.from('attendance').select('*').eq('member_id', memberId).order('check_in_time', { ascending: false }).limit(20),
            supabase.from('member_notes').select('*, staff:profiles(full_name, role)').eq('member_id', memberId).order('created_at', { ascending: false }),
          ]);

          if (paymentsRes.data?.length) setPayments(paymentsRes.data);
          if (attendanceRes.data?.length) setAttendance(attendanceRes.data);
          if (notesRes.data?.length) setNotes(notesRes.data as unknown as MemberNote[]);
        }
      } catch {
        // Use demo data
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [memberId, supabase]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          date_of_birth: editForm.date_of_birth,
          emergency_contact: editForm.emergency_contact,
          emergency_phone: editForm.emergency_phone,
          status: editForm.status,
        })
        .eq('id', memberId);

      if (error) throw error;
      setMember(editForm);
      setIsEditing(false);
      toast.success('Member updated successfully!');
    } catch {
      toast.error('Failed to update member');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('member_notes')
        .insert({
          member_id: memberId,
          staff_id: user.id,
          content: newNote,
        })
        .select('*, staff:profiles(full_name, role)')
        .single();

      if (error) throw error;
      if (data) setNotes([data as unknown as MemberNote, ...notes]);
      setNewNote('');
      toast.success('Note added!');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this member?')) return;
    try {
      await supabase.from('members').update({ archived: true }).eq('id', memberId);
      toast.success('Member archived');
      window.location.href = '/members';
    } catch {
      toast.error('Failed to archive member');
    }
  };

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'payments', label: 'Payments', count: payments.length },
    { id: 'attendance', label: 'Attendance', count: attendance.length },
    { id: 'notes', label: 'Notes', count: notes.length },
  ];

  return (
    <>
      <Header title="Member Detail" subtitle={`Members → ${getFullName(member.first_name, member.last_name)}`} />
      <div className="page-content">
        {/* Member Profile Header */}
        <div className="member-profile-header">
          <div className="member-avatar-large">
            {member.photo_url ? (
              <img src={member.photo_url} alt="" />
            ) : (
              getInitials(member.first_name, member.last_name)
            )}
          </div>
          <div className="member-info">
            <h2 className="member-name-large">
              {getFullName(member.first_name, member.last_name)}
            </h2>
            <div className="member-meta">
              <StatusBadge status={member.status} />
              <span className="member-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> {member.email}
              </span>
              <span className="member-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} /> {member.phone}
              </span>
              <span className="member-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Joined {formatDate(member.join_date)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Edit size={14} /> Edit
                </span>
              )}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleArchive}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Archive size={14} /> Archive
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn('tab', activeTab === tab.id && 'active')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ marginLeft: '6px', opacity: 0.6 }}>({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-body">
              {isEditing ? (
                <div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input className="form-input" type="date" value={editForm.date_of_birth || ''}
                        onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Member['status'] })}>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <div className="grid-2">
                  <div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{member.email}</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{member.phone}</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                        {member.date_of_birth ? formatDate(member.date_of_birth) : '—'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="form-group">
                      <label className="form-label">Emergency Contact</label>
                      <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{member.emergency_contact || '—'}</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Emergency Phone</label>
                      <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{member.emergency_phone || '—'}</p>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Member ID</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>{member.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Payment History</h3>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{payment.method}</td>
                      <td><StatusBadge status={payment.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Attendance History</h3>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                {attendance.length} visits recorded
              </span>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Method</th>
                    <th>Time Ago</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.check_in_time, 'MMM d, yyyy h:mm a')}</td>
                      <td>
                        <span className={cn('badge', record.method === 'qr_code' ? 'badge-active' : 'badge-pending')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {record.method === 'qr_code' ? (
                            <>
                              <QrCode size={12} /> QR Scan
                            </>
                          ) : (
                            <>
                              <User size={12} /> Manual
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{timeAgo(record.check_in_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            {/* Add Note */}
            <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="card-body">
                <textarea
                  className="form-textarea"
                  placeholder="Add a note about this member..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </button>
                </div>
              </div>
            </div>

            {/* Notes List */}
            {notes.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <span className="note-author">{note.staff?.full_name || 'Staff'}</span>
                  <span className="note-date">{timeAgo(note.created_at)}</span>
                </div>
                <p className="note-content">{note.content}</p>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={32} strokeWidth={1.5} />
                </div>
                <div className="empty-state-title">No notes yet</div>
                <div className="empty-state-text">Add a note to track interactions with this member</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
