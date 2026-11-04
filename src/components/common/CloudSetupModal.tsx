'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  Database,
  X
} from 'lucide-react';
import { testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';
import { appStore } from '@/lib/store';

interface CloudSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSetupModal: React.FC<CloudSetupModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncCloudMessage, setSyncCloudMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({ success: false, message: `Error: ${(err as Error).message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncCloudRecords = async () => {
    setSyncingCloud(true);
    setSyncCloudMessage(null);
    try {
      const res = await appStore.syncWithCloud();
      if (res.success) {
        setSyncCloudMessage(`Successfully synchronized ${res.count} records from Supabase Cloud!`);
      } else {
        setSyncCloudMessage(`Notice: ${res.error || 'Failed to sync'}`);
      }
    } catch (err: unknown) {
      setSyncCloudMessage(`Sync error: ${(err as Error).message}`);
    } finally {
      setSyncingCloud(false);
      setTimeout(() => setSyncCloudMessage(null), 4000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const envTemplate = `# Gateway Security: Live Supabase Configuration
NEXT_PUBLIC_APP_NAME="Gateway Security"
NEXT_PUBLIC_DEFAULT_COMMUNITY_ID="a0000000-0000-0000-0000-000000000001"

# Paste your real credentials from Supabase Dashboard -> Project Settings -> API:
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Cloud Realtime & Multi-Device Setup
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border ${
                  isSupabaseConfigured 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isSupabaseConfigured ? 'Supabase Configured' : 'Local Mesh Mode'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Connect Supabase to enable guards and flat owners on real phones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Real-time explanation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3.5">
            <Smartphone className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 text-sm mb-1">
                How Multiple Persons Use the App in Real Life
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Currently, when testing in 2 browser tabs on one PC, the tabs communicate via browser memory.
                In a real gated apartment, <strong>Security Guard</strong> uses a tablet at the gate, while <strong>Flat Owners</strong> use their personal smartphones inside their apartments. 
                Connecting <strong>Supabase Realtime</strong> provides the cloud WebSocket backbone that synchronizes all phones in under 150ms over 4G/5G/Wi-Fi!
              </p>
            </div>
          </div>

          {/* Test connection card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-900 text-sm">Connection Diagnostic</span>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Supabase Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{testResult.success ? 'Connected!' : 'Notice'}</div>
                  <div className="mt-0.5 text-slate-600">{testResult.message}</div>
                </div>
              </div>
            )}

            {!testResult && (
              <div className="text-xs text-slate-500">
                Click above to ping your Supabase database and verify table schemas and permissions.
              </div>
            )}

            {isSupabaseConfigured && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Force Cloud Pull / Refresh</div>
                  <div className="text-[11px] text-slate-500">Sync all visitor entries from Supabase to this screen</div>
                </div>
                <button
                  onClick={handleSyncCloudRecords}
                  disabled={syncingCloud}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
                  <span>{syncingCloud ? 'Syncing...' : 'Sync Live Records'}</span>
                </button>
              </div>
            )}

            {syncCloudMessage && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{syncCloudMessage}</span>
              </div>
            )}
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Step-by-Step Setup Instructions
            </h4>

            {/* Step 1 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-slate-900">
                  Step 1: Create Free Supabase Project
                </span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1"
                >
                  Open Supabase <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-600">
                Sign in to <span className="font-mono text-slate-800">supabase.com</span>, click <strong>New Project</strong>, pick a database password, and choose region (e.g. Mumbai / Singapore).
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="font-semibold text-xs text-slate-900 mb-2">
                Step 2: Run SQL Migrations in Supabase SQL Editor
              </div>
              <p className="text-xs text-slate-600 mb-2">
                In Supabase Dashboard, click <strong>SQL Editor</strong> &gt; <strong>New Query</strong>. Run these 5 migration files located in your project&apos;s <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">migrations/</code> folder in order:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                  1. 01_init_schema.sql
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                  2. 02_rls_policies.sql
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                  3. 03_seed_data.sql
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                  4. 04_storage_setup.sql
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-300 bg-emerald-50/30 font-mono text-[11px] text-emerald-800 col-span-1 sm:col-span-2">
                  5. 05_enable_realtime.sql (Enables instant WebSockets &amp; Multi-Phone Sync)
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-slate-900">
                  Step 3: Add Credentials to <span className="font-mono">.env.local</span>
                </span>
                <button
                  onClick={() => copyToClipboard(envTemplate, 'env')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                >
                  {copiedStep === 'env' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Template
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                In Supabase, go to <strong>Project Settings</strong> &gt; <strong>API</strong>. Copy your Project URL and anon public key into <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">gateway-security/.env.local</code>:
              </p>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
{envTemplate}
              </pre>
            </div>

            {/* Step 4 */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="font-semibold text-xs text-slate-900 mb-1">
                Step 4: Instant Multi-Phone Testing on Local Wi-Fi
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                While your Next.js server is running on port 3001, connect your mobile phone to the same Wi-Fi network and open:
              </p>
              <div className="mt-2 p-2.5 bg-slate-900 text-white font-mono text-xs rounded-lg flex items-center justify-between">
                <span>http://192.168.0.137:3001</span>
                <span className="text-emerald-400 text-[10px]">Your LAN IP</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Open <strong>/guard</strong> on tablet 1 and <strong>/resident</strong> on phone 2. As soon as Guard registers a visitor, Phone 2 receives the push notification instantly!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current Server Port: <strong className="text-slate-800">3001</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0B132B] hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
