'use client';

import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  Phone, 
  CheckCircle2 
} from 'lucide-react';
import { SosAlert } from '@/types';
import { appStore } from '@/lib/store';
import { TimeAgo } from '@/components/common/TimeDisplay';

interface ActiveSosBannerProps {
  alerts: SosAlert[];
}

export const ActiveSosBanner: React.FC<ActiveSosBannerProps> = ({ alerts }) => {
  const activeAlerts = alerts.filter(a => a.status === 'active');

  if (activeAlerts.length === 0) return null;

  const handleResolve = (id: string) => {
    appStore.resolveSosAlert(id, 'resolved');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-white animate-pulse" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-white animate-bounce" />;
      case 'lift_entrapment':
        return <AlertTriangle className="w-5 h-5 text-white animate-pulse" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-white animate-pulse" />;
    }
  };

  return (
    <div className="space-y-3">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-red-600 text-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-red-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-red-700/80 rounded-2xl border border-red-400 shrink-0">
              {getIcon(alert.alert_type)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-red-700 px-2.5 py-0.5 rounded-full">
                  🚨 ACTIVE EMERGENCY SOS
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-200">
                  {alert.alert_type.replace('_', ' ')}
                </span>
                <span className="text-xs text-red-200">
                  Triggered <TimeAgo date={alert.created_at} />
                </span>
              </div>

              <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                {alert.block_name} • Flat {alert.flat_number} — {alert.resident_name}
              </div>

              <div className="flex items-center gap-3 text-xs text-red-100 mt-1 flex-wrap">
                <a
                  href={`tel:${alert.resident_phone}`}
                  className="inline-flex items-center gap-1 font-bold bg-red-700/80 hover:bg-red-800 px-2.5 py-1 rounded-lg text-white"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Resident: {alert.resident_phone}</span>
                </a>
                {alert.notes && <span>Note: {alert.notes}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => handleResolve(alert.id)}
              className="w-full md:w-auto px-4 py-2.5 bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ACKNOWLEDGE & RESOLVE</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
