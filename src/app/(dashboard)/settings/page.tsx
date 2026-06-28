'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';

export default function SettingsPage() {
  const [gymName, setGymName] = useState('DMVIron');
  const [gymEmail, setGymEmail] = useState('info@dmviron.com');
  const [gymPhone, setGymPhone] = useState('(202) 555-0100');
  const [gymAddress, setGymAddress] = useState('1234 Iron St, Washington, DC 20001');

  const [anthropicKey, setAnthropicKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');

  const handleSave = () => {
    toast.success('Settings saved!');
  };

  return (
    <>
      <Header title="Settings" subtitle="Configuration" />
      <div className="page-content">
        <div className="page-header">
          <div className="page-header-left">
            <h2 className="page-title">Settings</h2>
            <p className="page-subtitle">Configure your gym application</p>
          </div>
        </div>

        {/* Gym Profile */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Gym Profile</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <Image src="/dmviron-logo.png" alt="DMVIron" width={80} height={80} style={{ borderRadius: '14px' }} />
              <div>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{gymName}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Premium Fitness Center</p>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gym Name</label>
                <input className="form-input" value={gymName} onChange={(e) => setGymName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={gymEmail} onChange={(e) => setGymEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={gymPhone} onChange={(e) => setGymPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={gymAddress} onChange={(e) => setGymAddress(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave}>Save Profile</button>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">API Configuration</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Anthropic API Key (Claude AI)</label>
              <input
                className="form-input"
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
              <p className="form-hint">Required for AI Insights features (at-risk detection, email drafts, reports)</p>
            </div>
            <div className="form-group">
              <label className="form-label">Stripe Secret Key</label>
              <input
                className="form-input"
                type="password"
                placeholder="sk_test_..."
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
              />
              <p className="form-hint">Required for automated payment processing</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave}>Save Keys</button>
            </div>
          </div>
        </div>

        {/* Zapier Integration */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Zapier Integration</h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.7 }}>
              Use these webhook URLs in your Zapier Zaps to automate email reminders. Set up a polling trigger in Zapier pointed at these endpoints.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[
                { label: '7-Day Renewal Reminders', endpoint: '/api/webhooks/zapier?type=renewals', description: 'Returns members due for renewal in the next 7 days' },
                { label: 'Failed Payment Alerts', endpoint: '/api/webhooks/zapier?type=failed_payments', description: 'Returns members with failed or overdue payments' },
                { label: 'New Signup Welcome', endpoint: '/api/webhooks/zapier?type=new_signups', description: 'Returns members who signed up in the last 24 hours' },
              ].map((webhook) => (
                <div key={webhook.endpoint} style={{
                  padding: 'var(--space-4)', border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{webhook.label}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${webhook.endpoint}`);
                        toast.success('Copied to clipboard!');
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Copy size={14} /> Copy URL
                    </button>
                  </div>
                  <code style={{
                    fontSize: 'var(--text-xs)', color: 'var(--brand-primary)',
                    background: 'rgba(0, 180, 216, 0.08)', padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)', display: 'block',
                    marginBottom: 'var(--space-2)', wordBreak: 'break-all',
                  }}>
                    GET {webhook.endpoint}
                  </code>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{webhook.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: 'var(--status-expired)' }}>Danger Zone</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Reset Demo Data</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Clear all data and start fresh. This cannot be undone.</p>
              </div>
              <button className="btn btn-danger btn-sm">Reset Data</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
