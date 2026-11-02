// Utilities for Gateway Security

export function maskPhoneNumber(phone: string): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) return phone;
  
  const last4 = clean.slice(-4);
  const first2 = clean.slice(-10, -8);
  return `+91 ${first2}XXX-XX${last4}`;
}

export function formatIndianPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    const num = clean.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  return phone;
}

export function validateIndianPhone(phone: string): boolean {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return /^[6-9]\d{9}$/.test(clean);
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return /^[6-9]\d{9}$/.test(clean.slice(2));
  }
  return false;
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  if (typeof window === 'undefined') {
    return 'Recently';
  }
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  if (typeof window === 'undefined') {
    return '24 Oct, 11:30 AM';
  }
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function calculateDuration(startTime: string, endTime?: string): string {
  if (!startTime) return '—';
  if (typeof window === 'undefined' && !endTime) {
    return '25 mins';
  }
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const totalMins = Math.max(0, Math.floor((end - start) / 60000));

  if (totalMins < 60) {
    return `${totalMins} min${totalMins !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`;
}

export function getCategoryBadge(category: string): { label: string; bg: string; text: string; icon: string } {
  switch (category) {
    case 'delivery':
      return { label: 'Delivery', bg: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50', text: 'text-amber-800 dark:text-amber-300', icon: 'Package' };
    case 'cab':
      return { label: 'Cab / Taxi', bg: 'bg-sky-100 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700/50', text: 'text-sky-800 dark:text-sky-300', icon: 'Car' };
    case 'service':
      return { label: 'Service / Tech', bg: 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/50', text: 'text-purple-800 dark:text-purple-300', icon: 'Wrench' };
    case 'daily_staff':
      return { label: 'Daily Staff / Maid', bg: 'bg-indigo-100 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/50', text: 'text-indigo-800 dark:text-indigo-300', icon: 'UserCheck' };
    case 'guest':
    default:
      return { label: 'Personal Guest', bg: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/50', text: 'text-emerald-800 dark:text-emerald-300', icon: 'User' };
  }
}

export function getDeliveryCategoryBadge(category?: string): { label: string; bg: string; text: string; dot: string } {
  switch (category) {
    case 'food':
      return { 
        label: 'Food Delivery', 
        bg: 'bg-orange-50 border-orange-300', 
        text: 'text-orange-800', 
        dot: 'bg-orange-500' 
      };
    case 'courier':
      return { 
        label: 'Courier & Parcel', 
        bg: 'bg-sky-50 border-sky-300', 
        text: 'text-sky-800', 
        dot: 'bg-sky-500' 
      };
    case 'grocery':
      return { 
        label: 'Instant Grocery', 
        bg: 'bg-emerald-50 border-emerald-300', 
        text: 'text-emerald-800', 
        dot: 'bg-emerald-500' 
      };
    case 'e_commerce':
      return { 
        label: 'E-Commerce', 
        bg: 'bg-purple-50 border-purple-300', 
        text: 'text-purple-800', 
        dot: 'bg-purple-500' 
      };
    case 'other':
    default:
      return { 
        label: 'Delivery & Logistics', 
        bg: 'bg-amber-50 border-amber-300', 
        text: 'text-amber-800', 
        dot: 'bg-amber-500' 
      };
  }
}

