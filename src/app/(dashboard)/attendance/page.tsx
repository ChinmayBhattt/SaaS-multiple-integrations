'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import { formatDate, getFullName, getInitials, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { AttendanceRecord, Member } from '@/lib/types';
import { QrCode, User } from 'lucide-react';

const demoTraffic = [
  { hour: '6 AM', count: 12 }, { hour: '7 AM', count: 25 }, { hour: '8 AM', count: 30 },
  { hour: '9 AM', count: 18 }, { hour: '10 AM', count: 15 }, { hour: '11 AM', count: 10 },
  { hour: '12 PM', count: 22 }, { hour: '1 PM', count: 20 }, { hour: '2 PM', count: 14 },
  { hour: '3 PM', count: 16 }, { hour: '4 PM', count: 28 }, { hour: '5 PM', count: 42 },
  { hour: '6 PM', count: 45 }, { hour: '7 PM', count: 38 }, { hour: '8 PM', count: 25 },
  { hour: '9 PM', count: 15 }, { hour: '10 PM', count: 8 },
];

const demoCheckins: (AttendanceRecord & { member?: Member })[] = [
  { id: '1', member_id: '1', check_in_time: new Date(Date.now() - 1800000).toISOString(), method: 'qr_code', created_at: '', member: { id: '1', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '2', member_id: '2', check_in_time: new Date(Date.now() - 3600000).toISOString(), method: 'manual', created_at: '', member: { id: '2', first_name: 'Mike', last_name: 'Chen', email: 'mike@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '3', member_id: '4', check_in_time: new Date(Date.now() - 5400000).toISOString(), method: 'qr_code', created_at: '', member: { id: '4', first_name: 'James', last_name: 'Wilson', email: 'james@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
  { id: '4', member_id: '7', check_in_time: new Date(Date.now() - 7200000).toISOString(), method: 'manual', created_at: '', member: { id: '7', first_name: 'Ana', last_name: 'Martinez', email: 'ana@email.com', phone: '', status: 'active', join_date: '', created_at: '', updated_at: '', archived: false } },
];

export default function AttendancePage() {
  const [checkins, setCheckins] = useState(demoCheckins);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchMember, setSearchMember] = useState('');
  const [todayCount, setTodayCount] = useState(67);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('attendance')
          .select('*, member:members(id, first_name, last_name, email, status)')
          .gte('check_in_time', today)
          .order('check_in_time', { ascending: false });

        if (data && data.length > 0) {
          setCheckins(data as unknown as (AttendanceRecord & { member?: Member })[]);
          setTodayCount(data.length);
        }

        const { data: membersData } = await supabase.from('members').select('*').eq('status', 'active').eq('archived', false);
        if (membersData) setMembers(membersData);
      } catch { /* demo */ }
    };
    fetchData();
  }, [supabase]);

  const handleManualCheckin = async (member: Member) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('attendance').insert({
        member_id: member.id,
        method: 'manual',
      });
      if (error) throw error;

      if (user) {
        await supabase.from('activity_log').insert({
          staff_id: user.id,
          action: 'member_checked_in',
          entity_type: 'attendance',
          entity_id: member.id,
          details: { member_name: getFullName(member.first_name, member.last_name), method: 'manual' },
        });
      }

      const newCheckin: AttendanceRecord & { member?: Member } = {
        id: Date.now().toString(),
        member_id: member.id,
        check_in_time: new Date().toISOString(),
        method: 'manual',
        created_at: new Date().toISOString(),
        member,
      };
      setCheckins([newCheckin, ...checkins]);
      setTodayCount(todayCount + 1);
      setSearchMember('');
      toast.success(`${getFullName(member.first_name, member.last_name)} checked in!`);
    } catch {
      toast.error('Failed to check in');
    }
  };

  const filteredMembers = searchMember
    ? members.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchMember.toLowerCase()) ||
      m.email.toLowerCase().includes(searchMember.toLowerCase())
    ).slice(0, 5)
    : [];

  return (
    <>
      <Header title="Attendance" subtitle="Gym check-ins" />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Attendance Tracking</h2>
            <p className="page-subtitle">{todayCount} check-ins today</p>
          </div>
          <div className="page-header-actions">
            <Link href="/attendance/scanner" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <QrCode size={16} /> QR Scanner
            </Link>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
          {/* Manual Check-in */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Check-in</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="Search member by name or email..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                />
              </div>
              {filteredMembers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-3)', border: '1px solid var(--border-primary)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onClick={() => handleManualCheckin(member)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className="table-member-avatar">{getInitials(member.first_name, member.last_name)}</div>
                        <div>
                          <div className="table-member-name" style={{ fontSize: 'var(--text-sm)' }}>{getFullName(member.first_name, member.last_name)}</div>
                          <div className="table-member-email">{member.email}</div>
                        </div>
                      </div>
                      <span className="btn btn-primary btn-sm">Check In</span>
                    </div>
                  ))}
                </div>
              )}
              {searchMember && filteredMembers.length === 0 && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No active members found
                </p>
              )}
            </div>
          </div>

          {/* Hourly Traffic Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Today&apos;s Traffic</h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Hourly</span>
            </div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demoTraffic}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" stroke="#4a4a5e" fontSize={10} interval={2} />
                  <YAxis stroke="#4a4a5e" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  <Bar dataKey="count" name="Check-ins" fill="#00b4d8" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Today's Check-ins */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today&apos;s Check-ins</h3>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{checkins.length} entries</span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Time</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((checkin) => (
                  <tr key={checkin.id}>
                    <td>
                      <div className="table-member-cell">
                        <div className="table-member-avatar">
                          {checkin.member ? getInitials(checkin.member.first_name, checkin.member.last_name) : '?'}
                        </div>
                        <div>
                          <div className="table-member-name">
                            {checkin.member ? getFullName(checkin.member.first_name, checkin.member.last_name) : 'Unknown'}
                          </div>
                          <div className="table-member-email">{checkin.member?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(checkin.check_in_time, 'h:mm a')}</td>
                    <td>
                      <span className={cn('badge', checkin.method === 'qr_code' ? 'badge-active' : 'badge-pending')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {checkin.method === 'qr_code' ? (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
