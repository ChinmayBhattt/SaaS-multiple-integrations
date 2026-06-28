'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import { getFullName, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Member } from '@/lib/types';
import { Camera, Play, Square, CheckCircle2 } from 'lucide-react';

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [checkedInMember, setCheckedInMember] = useState<Member | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const processCheckin = async (memberId: string) => {
    try {
      // Find member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (memberError || !member) {
        toast.error('Member not found!');
        return;
      }

      if (member.status !== 'active') {
        toast.error(`Member status is "${member.status}" — cannot check in`);
        return;
      }

      // Record attendance
      const { error } = await supabase.from('attendance').insert({
        member_id: memberId,
        method: 'qr_code',
      });

      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          staff_id: user.id,
          action: 'member_checked_in',
          entity_type: 'attendance',
          entity_id: memberId,
          details: { member_name: getFullName(member.first_name, member.last_name), method: 'qr_code' },
        });
      }

      setCheckedInMember(member);
      toast.success(`${getFullName(member.first_name, member.last_name)} checked in!`);
    } catch {
      toast.error('Failed to process check-in');
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setScanResult(null);
    setCheckedInMember(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          setScanResult(decodedText);
          await scanner.stop();
          setScanning(false);
          await processCheckin(decodedText);
        },
        () => { /* ignore errors during scanning */ }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      toast.error('Camera access denied or not available');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      // Scanner would need to be stored in ref for proper cleanup
      setScanning(false);
    } catch { /* ignore */ }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      await processCheckin(manualId.trim());
      setManualId('');
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setCheckedInMember(null);
  };

  return (
    <>
      <Header title="QR Scanner" subtitle="Attendance → Scanner" />
      <div className="page-content">
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>QR Check-in Scanner</h2>
          <p className="page-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
            Scan a member&apos;s QR code or enter their ID manually
          </p>

          {/* Scanner Result / Success */}
          {checkedInMember ? (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <div className="card-body">
                <div className="qr-success">
                  <div className="qr-success-icon" style={{ color: 'var(--status-active)', display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                    <CheckCircle2 size={48} strokeWidth={2} />
                  </div>
                  <div className="member-avatar-large" style={{ width: 72, height: 72, fontSize: 'var(--text-2xl)' }}>
                    {getInitials(checkedInMember.first_name, checkedInMember.last_name)}
                  </div>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                    {getFullName(checkedInMember.first_name, checkedInMember.last_name)}
                  </h3>
                  <p style={{ color: 'var(--status-active)', fontWeight: 600 }}>
                    Successfully Checked In!
                  </p>
                  <button className="btn btn-primary" onClick={resetScanner}>
                    Scan Next Member
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* QR Scanner */}
              <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                  <div
                    id="qr-reader"
                    ref={scannerRef}
                    className="qr-scanner-container"
                    style={{
                      minHeight: scanning ? 300 : 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-4)',
                      background: scanning ? 'transparent' : 'var(--bg-tertiary)',
                    }}
                  >
                    {!scanning && (
                      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                          <Camera size={48} strokeWidth={1.5} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                          Camera preview will appear here
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    className={`btn ${scanning ? 'btn-danger' : 'btn-primary'} btn-lg`}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={scanning ? stopScanner : startScanner}
                  >
                    {scanning ? (
                      <>
                        <Square size={18} /> Stop Scanner
                      </>
                    ) : (
                      <>
                        <Play size={18} /> Start Scanner
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Manual ID Entry */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Manual Entry</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <input
                      className="form-input"
                      placeholder="Enter member ID..."
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!manualId.trim()}>
                      Check In
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
