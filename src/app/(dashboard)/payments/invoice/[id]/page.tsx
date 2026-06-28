'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import Image from 'next/image';
import { Printer, ArrowLeft } from 'lucide-react';

export default function InvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;

  // Demo invoice data
  const invoice = {
    invoice_number: `INV-${invoiceId?.substring(0, 8).toUpperCase() || '001'}`,
    date: formatDate(new Date().toISOString()),
    due_date: formatDate(new Date(Date.now() + 30 * 86400000).toISOString()),
    status: 'paid' as const,
    member: { name: 'Sarah Johnson', email: 'sarah@email.com', phone: '555-0101', address: '123 Main St, Washington DC' },
    items: [
      { description: 'Premium Monthly Membership', quantity: 1, unit_price: 49.99, total: 49.99 },
    ],
    subtotal: 49.99,
    tax: 4.00,
    total: 53.99,
  };

  return (
    <>
      <Header title="Invoice" subtitle={`Payments → ${invoice.invoice_number}`} />
      <div className="page-content">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={() => window.history.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="invoice">
          <div className="invoice-header">
            <div className="invoice-logo">
              <Image src="/dmviron-logo.png" alt="DMVIron" width={48} height={48} style={{ borderRadius: '10px' }} />
              <div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>DMVIron</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Premium Fitness</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="invoice-number">{invoice.invoice_number}</div>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Bill To</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{invoice.member.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{invoice.member.email}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{invoice.member.phone}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{invoice.member.address}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Invoice Date</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>{invoice.date}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Due Date</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>{invoice.due_date}</div>
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Subtotal</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Tax</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.tax)}</td>
              </tr>
              <tr className="invoice-total-row">
                <td colSpan={3} style={{ textAlign: 'right' }}>Total</td>
                <td style={{ textAlign: 'right', color: 'var(--brand-primary)' }}>{formatCurrency(invoice.total)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 'var(--space-10)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-primary)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
              DMVIron Fitness — Thank you for your membership! • support@dmviron.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
