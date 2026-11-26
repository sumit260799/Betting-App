const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = (isAdmin = false) => {
  const token = localStorage.getItem('apl_auth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isAdmin) {
    headers['x-admin-pin'] = sessionStorage.getItem('apl_admin_pin') || 'admin2026';
  }
  return headers;
};

export const api = {
  // Auth
  sendOtp: async (email) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  verifyOtp: async (email, otp, name) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, otp, name }),
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Deposits (UPI QR + UTR)
  getMyDeposits: async () => {
    const res = await fetch(`${API_BASE}/deposits/my`, { headers: getHeaders() });
    return res.json();
  },

  requestDeposit: async (amount, utr, playerNote = '') => {
    const res = await fetch(`${API_BASE}/deposits`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, utr, playerNote, paymentMethod: 'UPI' }),
    });
    return res.json();
  },

  // Teams & Matches
  getTeams: async () => {
    const res = await fetch(`${API_BASE}/teams`, { headers: getHeaders() });
    return res.json();
  },

  getMatches: async () => {
    const res = await fetch(`${API_BASE}/matches`, { headers: getHeaders() });
    return res.json();
  },

  // Bets
  getAllBets: async () => {
    const res = await fetch(`${API_BASE}/bets/all`, { headers: getHeaders() });
    return res.json();
  },

  getMyBets: async () => {
    const res = await fetch(`${API_BASE}/bets/my`, { headers: getHeaders() });
    return res.json();
  },

  placeBet: async (betData) => {
    const res = await fetch(`${API_BASE}/bets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(betData),
    });
    return res.json();
  },

  // Withdrawals
  getMyWithdrawals: async () => {
    const res = await fetch(`${API_BASE}/withdrawals/my`, { headers: getHeaders() });
    return res.json();
  },

  requestWithdrawal: async (amount, { payoutMethod = 'UPI', payoutDetails = '', payoutNote = '' } = {}) => {
    const res = await fetch(`${API_BASE}/withdrawals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, payoutMethod, payoutDetails, payoutNote }),
    });
    return res.json();
  },

  // Admin Controls
  adminGetBets: async () => {
    const res = await fetch(`${API_BASE}/admin/bets`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  adminGetDeposits: async () => {
    const res = await fetch(`${API_BASE}/admin/deposits`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  adminProcessDeposit: async (depositId, action, adminNote = '') => {
    const res = await fetch(`${API_BASE}/admin/deposits/process`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ depositId, action, adminNote }),
    });
    return res.json();
  },

  adminGetWithdrawals: async () => {
    const res = await fetch(`${API_BASE}/admin/withdrawals`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  adminProcessWithdrawal: async (withdrawalId, action, adminNote = '') => {
    const res = await fetch(`${API_BASE}/admin/withdrawals/process`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ withdrawalId, action, adminNote }),
    });
    return res.json();
  },

  adminGetOddsConfig: async () => {
    const res = await fetch(`${API_BASE}/admin/odds-config`, {
      headers: getHeaders(true),
    });
    return res.json();
  },

  adminUpdateOddsConfig: async (oddsConfig) => {
    const res = await fetch(`${API_BASE}/admin/odds-config`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ oddsConfig }),
    });
    return res.json();
  },

  adminToggleGlobal: async (isOpen) => {
    const res = await fetch(`${API_BASE}/admin/emergency-lock`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ isOpen, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminToggleTeamBetting: async (isOpen) => {
    const res = await fetch(`${API_BASE}/admin/team-betting-lock`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ isOpen, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminToggleMatch: async (matchId, isOpen) => {
    const res = await fetch(`${API_BASE}/admin/match-lock`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ matchId, isOpen, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminRecordScore: async (data) => {
    const res = await fetch(`${API_BASE}/admin/match-result`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ ...data, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminSetSemiFinalMatches: async ({ sf1, sf2, advance = false }) => {
    const res = await fetch(`${API_BASE}/admin/set-sf-matches`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ sf1, sf2, advance, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminAdvanceSF: async (payload) => {
    const body = Array.isArray(payload)
      ? { top4TeamIds: payload, adminPin: 'admin2026' }
      : { ...(payload || {}), adminPin: 'admin2026' };
    const res = await fetch(`${API_BASE}/admin/advance-sf`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    return res.json();
  },

  adminAdvanceFinal: async (finalistIds) => {
    const res = await fetch(`${API_BASE}/admin/advance-final`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ finalistIds, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminCrownChampion: async (championId) => {
    const res = await fetch(`${API_BASE}/admin/crown-champion`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ championId, adminPin: 'admin2026' }),
    });
    return res.json();
  },

  adminReset: async () => {
    const res = await fetch(`${API_BASE}/admin/reset`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ adminPin: 'admin2026' }),
    });
    return res.json();
  },
};
