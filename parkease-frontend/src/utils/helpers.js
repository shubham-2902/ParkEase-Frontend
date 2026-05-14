import { BOOKING_STATUS, LOT_STATUS, SPOT_STATUS } from './constants';

// ── Format currency ────────────────────────────────────────────
export const formatCurrency = (amount) => {
  if (amount == null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// ── Format date ────────────────────────────────────────────────
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year:   'numeric',
    month:  'short',
    day:    '2-digit',
  }).format(new Date(dateString));
};

// ── Format date + time ─────────────────────────────────────────
export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    year:   'numeric',
    month:  'short',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// ── Format duration in minutes ─────────────────────────────────
export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ── Booking status badge ───────────────────────────────────────
export const getBookingBadge = (status) => {
  return BOOKING_STATUS[status] || {
    label: status, badge: 'badge-gray'
  };
};

// ── Lot status badge ───────────────────────────────────────────
export const getLotBadge = (status) => {
  return LOT_STATUS[status] || {
    label: status, badge: 'badge-gray'
  };
};

// ── Spot status color ──────────────────────────────────────────
export const getSpotStatusColor = (status) => {
  return SPOT_STATUS[status]?.color || 'bg-slate-300';
};

// ── Truncate text ──────────────────────────────────────────────
export const truncate = (text, length = 50) => {
  if (!text) return '';
  return text.length > length
    ? text.substring(0, length) + '...'
    : text;
};

// ── Parse error message from API response ──────────────────────
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error  ||
    error?.message                ||
    'Something went wrong. Please try again.'
  );
};

// ── Convert datetime to ISO for input[type=datetime-local] ─────
export const toDatetimeLocal = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── Calculate parking duration in hours ───────────────────────
export const calcDurationHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const diff = new Date(endTime) - new Date(startTime);
  return Math.max(1, diff / (1000 * 60 * 60));
};

// ── Estimate fare ─────────────────────────────────────────────
export const estimateFare = (startTime, endTime, pricePerHour) => {
  const hours = calcDurationHours(startTime, endTime);
  return Math.round(hours * pricePerHour * 100) / 100;
};

// ── Debounce ──────────────────────────────────────────────────
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ── Generate receipt number ───────────────────────────────────
export const generateReceiptNo = (paymentId) => {
  return `PKSE-${new Date().getFullYear()}-${String(paymentId).padStart(6, '0')}`;
};

/**
 * Checks if a parking lot is currently open based on its 'isOpen' toggle
 * and its 'openTime'/'closeTime' operating hours.
 */
export const isLotCurrentlyOpen = (lot) => {
  if (!lot) return false;

  // 1. Manual toggle (Manager override)
  if (lot.isOpen === false) return false;

  // 2. Operating hours
  if (!lot.openTime || !lot.closeTime) return true;

  const now = new Date();
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const parseToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m, s] = timeStr.split(':').map(Number);
    return (h * 3600) + (m * 60) + (s || 0);
  };

  const openSeconds  = parseToSeconds(lot.openTime);
  const closeSeconds = parseToSeconds(lot.closeTime);

  // Handle midnight wrap-around (e.g., 22:00 to 04:00)
  if (closeSeconds < openSeconds) {
    return currentSeconds >= openSeconds || currentSeconds <= closeSeconds;
  }

  return currentSeconds >= openSeconds && currentSeconds <= closeSeconds;
};