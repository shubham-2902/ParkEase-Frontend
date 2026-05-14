// ── API Base URL ──────────────────────────────────────────────
// Reads from .env — falls back to localhost for safety
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ── Local Storage Keys ────────────────────────────────────────
export const TOKEN_KEY   = 'parkease_token';
export const REFRESH_KEY = 'parkease_refresh';
export const USER_KEY    = 'parkease_user';

// ── Roles ──────────────────────────────────────────────────────
export const ROLES = {
  DRIVER:  'DRIVER',
  MANAGER: 'MANAGER',
  ADMIN:   'ADMIN',
};

// ── Booking Status ─────────────────────────────────────────────
export const BOOKING_STATUS = {
  RESERVED:  { label: 'Reserved',  badge: 'badge-blue'  },
  ACTIVE:    { label: 'Active',    badge: 'badge-green' },
  COMPLETED: { label: 'Completed', badge: 'badge-gray'  },
  CANCELLED: { label: 'Cancelled', badge: 'badge-red'   },
};

// ── Spot Status ────────────────────────────────────────────────
export const SPOT_STATUS = {
  AVAILABLE:   { label: 'Available',   color: 'bg-emerald-500' },
  RESERVED:    { label: 'Reserved',    color: 'bg-amber-500'   },
  OCCUPIED:    { label: 'Occupied',    color: 'bg-red-500'     },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-slate-400'   },
};

// ── Lot Status ─────────────────────────────────────────────────
export const LOT_STATUS = {
  PENDING:   { label: 'Pending',   badge: 'badge-yellow' },
  APPROVED:  { label: 'Approved',  badge: 'badge-green'  },
  REJECTED:  { label: 'Rejected',  badge: 'badge-red'    },
  SUSPENDED: { label: 'Suspended', badge: 'badge-gray'   },
};

// ── Spot Types ─────────────────────────────────────────────────
export const SPOT_TYPES = [
  { value: 'COMPACT',   label: 'Compact'   },
  { value: 'STANDARD',  label: 'Standard'  },
  { value: 'LARGE',     label: 'Large'     },
  { value: 'EV',        label: 'EV'        },
  { value: 'MOTORBIKE', label: 'Motorbike' },
];

// ── Vehicle Types ──────────────────────────────────────────────
export const VEHICLE_TYPES = [
  { value: 'TWO_WHEELER',  label: 'Two Wheeler'  },
  { value: 'FOUR_WHEELER', label: 'Four Wheeler' },
  { value: 'HEAVY',        label: 'Heavy'        },
];

// ── Payment Modes ──────────────────────────────────────────────
export const PAYMENT_MODES = [
  { value: 'CARD',       label: 'Card'        },
  { value: 'UPI',        label: 'UPI'         },
  { value: 'WALLET',     label: 'Wallet'      },
  { value: 'NETBANKING', label: 'Net Banking' },
  { value: 'CASH',       label: 'Cash'        },
];

// ── Razorpay — reads from .env ──────────────────────────────────
export const RAZORPAY_KEY =
  import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE';

// ── Pagination ─────────────────────────────────────────────────
export const PAGE_SIZE = 10;

// ── Map defaults (India) ───────────────────────────────────────
export const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629 };
export const DEFAULT_RADIUS_KM  = 10;