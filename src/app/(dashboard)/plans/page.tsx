'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { MembershipPlan, PlanInterval } from '@/lib/types';
import { Check } from 'lucide-react';

const demoPlans: MembershipPlan[] = [
  { id: '1', name: 'Basic Monthly', description: 'Access to gym floor and cardio equipment', interval: 'monthly', price: 29.99, features: ['Gym floor access', 'Cardio equipment', 'Locker room'], is_active: true, created_at: '', updated_at: '' },
  { id: '2', name: 'Premium Monthly', description: 'Full access including classes and sauna', interval: 'monthly', price: 49.99, features: ['Full gym access', 'Group classes', 'Sauna & steam', 'Locker room', '1 PT session/month'], is_active: true, created_at: '', updated_at: '' },
  { id: '3', name: 'Basic Quarterly', description: 'Save 10% with quarterly billing', interval: 'quarterly', price: 80.99, features: ['Gym floor access', 'Cardio equipment', 'Locker room', '10% savings'], is_active: true, created_at: '', updated_at: '' },
  { id: '4', name: 'Premium Quarterly', description: 'Full access, quarterly savings', interval: 'quarterly', price: 134.99, features: ['Full gym access', 'Group classes', 'Sauna & steam', 'Locker room', '3 PT sessions/quarter', '15% savings'], is_active: true, created_at: '', updated_at: '' },
  { id: '5', name: 'Annual Elite', description: 'Best value — everything included', interval: 'annual', price: 449.99, features: ['Full gym access', 'Unlimited classes', 'Sauna & steam', 'Priority locker', '12 PT sessions/year', 'Guest passes', '25% savings'], is_active: true, created_at: '', updated_at: '' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>(demoPlans);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState({ name: '', description: '', interval: 'monthly' as PlanInterval, price: '', features: '' });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await supabase.from('membership_plans').select('*').order('price');
        if (data && data.length > 0) {
          setPlans(data.map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as unknown as string || '[]') })));
        }
      } catch { /* use demo */ }
    };
    fetchPlans();
  }, [supabase]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({ name: '', description: '', interval: 'monthly', price: '', features: '' });
    setShowModal(true);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      price: plan.price.toString(),
      features: plan.features.join('\n'),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const features = form.features.split('\n').map(f => f.trim()).filter(Boolean);

    try {
      if (editingPlan) {
        const { error } = await supabase.from('membership_plans').update({
          name: form.name,
          description: form.description,
          interval: form.interval,
          price: parseFloat(form.price),
          features,
        }).eq('id', editingPlan.id);
        if (error) throw error;
        setPlans(plans.map(p => p.id === editingPlan.id ? { ...p, ...form, price: parseFloat(form.price), features } : p));
        toast.success('Plan updated!');
      } else {
        const { data, error } = await supabase.from('membership_plans').insert({
          name: form.name,
          description: form.description,
          interval: form.interval,
          price: parseFloat(form.price),
          features,
        }).select().single();
        if (error) throw error;
        if (data) setPlans([...plans, { ...data, features }]);
        toast.success('Plan created!');
      }
      setShowModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (plan: MembershipPlan) => {
    try {
      await supabase.from('membership_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
      setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated');
    } catch {
      toast.error('Failed to update plan');
    }
  };

  const intervalLabel = (interval: string) => {
    switch (interval) {
      case 'monthly': return '/month';
      case 'quarterly': return '/quarter';
      case 'annual': return '/year';
      default: return '';
    }
  };

  return (
    <>
      <Header title="Membership Plans" subtitle="Manage plan tiers" />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Membership Plans</h2>
            <p className="page-subtitle">{plans.length} plans configured</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={openCreateModal}>+ Create Plan</button>
          </div>
        </div>

        <div className="grid-3">
          {plans.map((plan, index) => (
            <div key={plan.id} className={`plan-card animate-in ${index === 1 ? 'featured' : ''}`}
              style={{ opacity: plan.is_active ? 1 : 0.5 }}>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-description">{plan.description}</div>
              <div className="plan-price">
                <span className="plan-price-amount">{formatCurrency(plan.price)}</span>
                <span className="plan-price-interval">{intervalLabel(plan.interval)}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="plan-feature">
                    <span className="plan-feature-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-active)' }}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditModal(plan)}>
                  Edit
                </button>
                <button
                  className={`btn btn-sm ${plan.is_active ? 'btn-danger' : 'btn-primary'}`}
                  style={{ flex: 1 }}
                  onClick={() => togglePlanStatus(plan)}
                >
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Plan Name</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Billing Interval</label>
                      <select className="form-select" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value as PlanInterval })}>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price ($)</label>
                      <input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Features (one per line)</label>
                    <textarea className="form-textarea" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })}
                      placeholder="Gym floor access&#10;Cardio equipment&#10;Locker room" rows={5} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner" /> : (editingPlan ? 'Update Plan' : 'Create Plan')}
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
