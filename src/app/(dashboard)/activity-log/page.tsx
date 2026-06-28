'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import { timeAgo } from '@/lib/utils';
import type { ActivityLogEntry } from '@/lib/types';
import {
  UserPlus,
  Edit2,
  Archive,
  CalendarCheck,
  CreditCard,
  XCircle,
  FileText,
  Gem,
  Link as LinkIcon,
  RefreshCw,
  Shield,
  MessageSquare,
  Settings,
  Pin
} from 'lucide-react';

const demoActivity: ActivityLogEntry[] = [
  { id: '1', staff_id: '1', action: 'member_checked_in', entity_type: 'attendance', entity_id: '1', details: { member_name: 'Sarah Johnson', method: 'qr_code' }, created_at: new Date(Date.now() - 300000).toISOString(), staff: { id: '1', email: '', full_name: 'Front Desk', role: 'staff', created_at: '', updated_at: '' } },
  { id: '2', staff_id: '1', action: 'payment_logged', entity_type: 'payment', entity_id: '2', details: { member_name: 'Mike Chen', amount: 49.99 }, created_at: new Date(Date.now() - 1800000).toISOString(), staff: { id: '1', email: '', full_name: 'Admin', role: 'admin', created_at: '', updated_at: '' } },
  { id: '3', staff_id: '1', action: 'member_created', entity_type: 'member', entity_id: '3', details: { member_name: 'Ryan Taylor' }, created_at: new Date(Date.now() - 3600000).toISOString(), staff: { id: '1', email: '', full_name: 'Admin', role: 'admin', created_at: '', updated_at: '' } },
  { id: '4', staff_id: '2', action: 'note_added', entity_type: 'note', entity_id: '4', details: { member_name: 'Sarah Johnson' }, created_at: new Date(Date.now() - 7200000).toISOString(), staff: { id: '2', email: '', full_name: 'Jane Staff', role: 'staff', created_at: '', updated_at: '' } },
  { id: '5', staff_id: '1', action: 'subscription_created', entity_type: 'subscription', entity_id: '5', details: { member_name: 'Ryan Taylor', plan: 'Premium Monthly' }, created_at: new Date(Date.now() - 10800000).toISOString(), staff: { id: '1', email: '', full_name: 'Admin', role: 'admin', created_at: '', updated_at: '' } },
  { id: '6', staff_id: '2', action: 'member_checked_in', entity_type: 'attendance', entity_id: '6', details: { member_name: 'James Wilson', method: 'manual' }, created_at: new Date(Date.now() - 14400000).toISOString(), staff: { id: '2', email: '', full_name: 'Front Desk', role: 'staff', created_at: '', updated_at: '' } },
  { id: '7', staff_id: '1', action: 'plan_updated', entity_type: 'plan', entity_id: '7', details: { plan_name: 'Premium Monthly', change: 'Price updated' }, created_at: new Date(Date.now() - 86400000).toISOString(), staff: { id: '1', email: '', full_name: 'Admin', role: 'admin', created_at: '', updated_at: '' } },
  { id: '8', staff_id: '1', action: 'member_archived', entity_type: 'member', entity_id: '8', details: { member_name: 'David Brown' }, created_at: new Date(Date.now() - 172800000).toISOString(), staff: { id: '1', email: '', full_name: 'Admin', role: 'admin', created_at: '', updated_at: '' } },
];

const actionIcons: Record<string, React.ComponentType<any>> = {
  member_created: UserPlus,
  member_updated: Edit2,
  member_archived: Archive,
  member_checked_in: CalendarCheck,
  payment_logged: CreditCard,
  payment_failed: XCircle,
  invoice_generated: FileText,
  plan_created: Gem,
  plan_updated: Gem,
  subscription_created: LinkIcon,
  subscription_changed: RefreshCw,
  staff_created: Shield,
  note_added: MessageSquare,
  settings_updated: Settings,
};

const actionLabels: Record<string, string> = {
  member_created: 'created a new member',
  member_updated: 'updated member',
  member_archived: 'archived member',
  member_checked_in: 'checked in',
  payment_logged: 'logged a payment',
  payment_failed: 'flagged failed payment',
  invoice_generated: 'generated an invoice',
  plan_created: 'created a new plan',
  plan_updated: 'updated a plan',
  subscription_created: 'created subscription',
  subscription_changed: 'changed subscription',
  staff_created: 'added staff member',
  note_added: 'added a note',
  settings_updated: 'updated settings',
};

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>(demoActivity);
  const [filter, setFilter] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data } = await supabase
          .from('activity_log')
          .select('*, staff:profiles(full_name, role)')
          .order('created_at', { ascending: false })
          .limit(100);
        if (data && data.length > 0) setActivities(data as unknown as ActivityLogEntry[]);
      } catch { /* demo */ }
    };
    fetchActivity();
  }, [supabase]);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.action.startsWith(filter));

  return (
    <>
      <Header title="Activity Log" subtitle="Audit trail" />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Activity Log</h2>
            <p className="page-subtitle">Track all staff actions</p>
          </div>
        </div>

        <div className="filters-bar">
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Activities</option>
            <option value="member">Members</option>
            <option value="payment">Payments</option>
            <option value="plan">Plans</option>
            <option value="subscription">Subscriptions</option>
            <option value="note">Notes</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 'var(--space-5)' }}>
            <div className="activity-timeline">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-item-header" style={{ gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--brand-primary)' }}>
                      {(() => {
                        const IconComponent = actionIcons[activity.action] || Pin;
                        return <IconComponent size={16} />;
                      })()}
                    </span>
                    <span className="activity-item-user">
                      {activity.staff?.full_name || 'System'}
                    </span>
                    <span className="activity-item-action">
                      {actionLabels[activity.action] || activity.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    {!!(activity.details as any)?.member_name && (
                      <span style={{ fontWeight: 600 }}>{(activity.details as any).member_name}</span>
                    )}
                    {!!(activity.details as any)?.plan_name && (
                      <span style={{ fontWeight: 600 }}>{(activity.details as any).plan_name}</span>
                    )}
                    {!!(activity.details as any)?.amount && (
                      <span> — ${(activity.details as any).amount}</span>
                    )}
                    {!!(activity.details as any)?.method && (
                      <span style={{ color: 'var(--text-muted)' }}> via {(activity.details as any).method}</span>
                    )}
                  </div>
                  <div className="activity-item-time">{timeAgo(activity.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
