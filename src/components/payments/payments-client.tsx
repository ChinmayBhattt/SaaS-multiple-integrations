"use client";

import { useState } from "react";
import { logPayment, simulateStripePayment, markOverduePayments } from "@/lib/actions/gym";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getMemberName } from "@/lib/utils";
import type { Payment, Member } from "@/lib/types/database";
import { Plus, CreditCard, Check, X } from "lucide-react";

export function PaymentsClient({
  payments,
  members,
}: {
  payments: (Payment & { members: Pick<Member, "first_name" | "last_name" | "email"> | null })[];
  members: Pick<Member, "id" | "first_name" | "last_name">[];
}) {
  const [showForm, setShowForm] = useState(false);

  async function handleLogPayment(formData: FormData) {
    await logPayment(formData);
    setShowForm(false);
    window.location.reload();
  }

  async function handleStripeSim(paymentId: string, success: boolean) {
    await simulateStripePayment(paymentId, success);
    window.location.reload();
  }

  async function handleMarkOverdue() {
    await markOverduePayments();
    window.location.reload();
  }

  const overdue = payments.filter((p) => p.status === "overdue" || p.status === "failed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Payments & Billing</h1>
          <p className="text-zinc-400">{overdue.length} overdue/failed payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkOverdue}>Mark Overdue</Button>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Log Payment</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Log Payment</CardTitle></CardHeader>
          <CardContent>
            <form action={handleLogPayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Member</Label>
                <select name="member_id" required className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100">
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{getMemberName(m)}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input name="amount" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select name="status" className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100">
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <select name="method" className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100">
                    <option value="manual">Manual</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input name="due_date" type="date" />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-4 p-4">
                <CreditCard className="h-5 w-5 text-zinc-500" />
                <div className="flex-1">
                  <p className="font-medium text-zinc-100">
                    {payment.members ? getMemberName(payment.members) : "Unknown"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {payment.invoice_number} · Due {formatDate(payment.due_date)}
                    {payment.stripe_payment_id && ` · ${payment.stripe_payment_id}`}
                  </p>
                </div>
                <p className="font-semibold text-zinc-200">{formatCurrency(payment.amount_cents)}</p>
                <Badge status={payment.status}>{payment.status}</Badge>
                {payment.status === "pending" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleStripeSim(payment.id, true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Stripe <Check size={14} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleStripeSim(payment.id, false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Stripe <X size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {!payments.length && <p className="p-8 text-center text-zinc-500">No payments yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
