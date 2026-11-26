import { useState, useEffect, useCallback } from 'react';
import { TEAMS, INITIAL_SCHEDULE } from '../data/tournamentData';
import confetti from 'canvas-confetti';
import { TournamentContext } from './TournamentContextInstance';
import { api } from '../services/api';
import { DEFAULT_ODDS_CONFIG, normalizeOddsConfig, calculatePoolWithConfig } from '../utils/oddsCalculator';

const STORAGE_KEY = 'apl_betting_app_state_v1';
const AUTH_KEY = 'apl_auth_user';
const TOKEN_KEY = 'apl_auth_token';

const mapBackendBet = (b) => ({
  id: b.id,
  userId: b.user_id,
  userName: b.user_name,
  type: b.type,
  targetId: b.target_id,
  teamId: b.team_id,
  stage: b.stage,
  amount: parseFloat(b.amount),
  odds: parseFloat(b.odds),
  status: b.status,
  payout: parseFloat(b.payout),
  createdAt: b.created_at
});

export const TournamentProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(AUTH_KEY);
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          teamBettingOpen: parsed.teamBettingOpen ?? true,
        };
      }
    } catch (err) {
      console.error('Error loading state from localStorage:', err);
    }

    return {
      currentStage: 'league',
      globalBettingOpen: true,
      teamBettingOpen: true,
      adminPin: 'admin2026',
      isAdmin: false,
      oddsConfig: DEFAULT_ODDS_CONFIG,
      matches: INITIAL_SCHEDULE,
      qualifiedTeamIds: {
        league: TEAMS.map(t => t.id),
        'semi-final': [],
        final: [],
        championId: null,
      },
      bets: [
        {
          id: 'bet_seed_1',
          userId: 'u_subhadip',
          userName: 'Subhadip',
          type: 'stage',
          stage: 'league',
          teamId: 'acceleron-mavericks',
          amount: 250,
          odds: 3.5,
          status: 'active',
          payout: 0,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'bet_seed_2',
          userId: 'u_prosenjit',
          userName: 'Prosenjit',
          type: 'stage',
          stage: 'league',
          teamId: 'acceleron-knight-riders',
          amount: 300,
          odds: 3.0,
          status: 'active',
          payout: 0,
          createdAt: new Date(Date.now() - 3000000).toISOString()
        },
        {
          id: 'bet_seed_3',
          userId: 'u_sourav',
          userName: 'Sourav D',
          type: 'match',
          targetId: 'm1',
          teamId: 'acceleron-super-xi',
          stage: 'league',
          amount: 150,
          odds: 2.2,
          status: 'active',
          payout: 0,
          createdAt: new Date(Date.now() - 2500000).toISOString()
        },
        {
          id: 'bet_seed_4',
          userId: 'u_manisha',
          userName: 'Manisha',
          type: 'match',
          targetId: 'm1',
          teamId: 'acceleron-strikers',
          stage: 'league',
          amount: 200,
          odds: 1.9,
          status: 'active',
          payout: 0,
          createdAt: new Date(Date.now() - 1500000).toISOString()
        }
      ],
      teamStats: TEAMS.reduce((acc, t) => {
        acc[t.id] = { played: 0, won: 0, lost: 0, tied: 0, points: 0, runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, nrr: 0 };
        return acc;
      }, {})
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (currentUser) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (err) {
      console.error('Error saving state:', err);
    }
  }, [state, currentUser]);

  const [adminBets, setAdminBets] = useState([]);
  const [adminBetsLoading, setAdminBetsLoading] = useState(false);
  const [adminBetsError, setAdminBetsError] = useState(null);

  const [myDeposits, setMyDeposits] = useState([]);
  const [adminDeposits, setAdminDeposits] = useState([]);
  const [adminDepositSummary, setAdminDepositSummary] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    totalApproved: 0,
    rejectedCount: 0,
  });
  const [adminDepositsLoading, setAdminDepositsLoading] = useState(false);
  const [adminDepositsError, setAdminDepositsError] = useState(null);

  const [myWithdrawals, setMyWithdrawals] = useState([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [adminWithdrawalSummary, setAdminWithdrawalSummary] = useState({
    paidCount: 0,
    pendingCount: 0,
    realizedProfit: 0,
    pendingProfit: 0,
    totalPaidOut: 0,
    pendingNetToPay: 0,
  });
  const [adminWithdrawalsLoading, setAdminWithdrawalsLoading] = useState(false);
  const [adminWithdrawalsError, setAdminWithdrawalsError] = useState(null);

  const fetchAdminBets = useCallback(async () => {
    setAdminBetsLoading(true);
    setAdminBetsError(null);
    try {
      const res = await api.adminGetBets();
      if (res && res.success) {
        setAdminBets(res.bets || []);
      } else {
        setAdminBetsError(res?.message || 'Failed to load admin bets ledger.');
      }
    } catch {
      setAdminBetsError('Cannot reach backend server to load player bet details.');
    } finally {
      setAdminBetsLoading(false);
    }
  }, []);

  const fetchAdminWithdrawals = useCallback(async () => {
    setAdminWithdrawalsLoading(true);
    setAdminWithdrawalsError(null);
    try {
      const res = await api.adminGetWithdrawals();
      if (res && res.success) {
        setAdminWithdrawals(res.withdrawals || []);
        if (res.summary) setAdminWithdrawalSummary(res.summary);
      } else {
        setAdminWithdrawalsError(res?.message || 'Failed to load withdrawals.');
      }
    } catch {
      setAdminWithdrawalsError('Cannot reach backend server to load withdrawals.');
    } finally {
      setAdminWithdrawalsLoading(false);
    }
  }, []);

  const fetchMyWithdrawals = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setMyWithdrawals([]);
      return;
    }
    try {
      const res = await api.getMyWithdrawals();
      if (res && res.success) {
        setMyWithdrawals(res.withdrawals || []);
      }
    } catch {
      // ignore offline
    }
  }, []);

  const fetchAdminDeposits = useCallback(async () => {
    setAdminDepositsLoading(true);
    setAdminDepositsError(null);
    try {
      const res = await api.adminGetDeposits();
      if (res && res.success) {
        setAdminDeposits(res.deposits || []);
        if (res.summary) setAdminDepositSummary(res.summary);
      } else {
        setAdminDepositsError(res?.message || 'Failed to load deposits.');
      }
    } catch {
      setAdminDepositsError('Cannot reach backend server to load deposits.');
    } finally {
      setAdminDepositsLoading(false);
    }
  }, []);

  const fetchMyDeposits = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setMyDeposits([]);
      return;
    }
    try {
      const res = await api.getMyDeposits();
      if (res && res.success) {
        setMyDeposits(res.deposits || []);
      }
    } catch {
      // ignore offline
    }
  }, []);

  const syncFromBackend = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const [matchesRes, betsRes, teamsRes, meRes, myDepRes, myWdRes] = await Promise.all([
        api.getMatches().catch(() => null),
        api.getAllBets().catch(() => null),
        api.getTeams().catch(() => null),
        token ? api.getMe().catch(() => null) : Promise.resolve(null),
        token ? api.getMyDeposits().catch(() => null) : Promise.resolve(null),
        token ? api.getMyWithdrawals().catch(() => null) : Promise.resolve(null),
      ]);

      setState(prev => {
        const next = { ...prev };

        if (matchesRes && matchesRes.success) {
          next.matches = matchesRes.matches;
          next.currentStage = matchesRes.tournamentState.currentStage;
          next.globalBettingOpen = matchesRes.tournamentState.globalBettingOpen;
          next.teamBettingOpen = matchesRes.tournamentState.teamBettingOpen ?? true;
          if (matchesRes.tournamentState.oddsConfig) {
            next.oddsConfig = normalizeOddsConfig(matchesRes.tournamentState.oddsConfig);
          }
          next.qualifiedTeamIds = {
            ...prev.qualifiedTeamIds,
            championId: matchesRes.tournamentState.championId,
            'semi-final': matchesRes.tournamentState.top4Teams || prev.qualifiedTeamIds['semi-final'],
            final: matchesRes.tournamentState.finalists || prev.qualifiedTeamIds.final,
          };
        }

        if (betsRes && betsRes.success) {
          next.bets = betsRes.bets.map(mapBackendBet);
        }

        if (teamsRes && teamsRes.success) {
          const syncedStats = { ...prev.teamStats };
          teamsRes.teams.forEach(t => {
            if (t.stats) {
              syncedStats[t.id] = { ...(syncedStats[t.id] || {}), ...t.stats };
            }
          });
          next.teamStats = syncedStats;
        }

        return next;
      });

      if (token && meRes) {
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setCurrentUser(null);
        }
      }

      if (token && myDepRes && myDepRes.success) {
        setMyDeposits(myDepRes.deposits || []);
      } else if (!token) {
        setMyDeposits([]);
      }

      if (token && myWdRes && myWdRes.success) {
        setMyWithdrawals(myWdRes.withdrawals || []);
      } else if (!token) {
        setMyWithdrawals([]);
      }
    } catch (e) {
      console.warn('Backend sync paused:', e.message);
    }
  }, []);

  // Synchronize state with backend on mount
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        syncFromBackend();
      }
    });
    return () => { isMounted = false; };
  }, [syncFromBackend]);

  // Load full admin bettor, deposit, and withdrawal ledgers whenever admin mode is active
  useEffect(() => {
    if (!state.isAdmin) return;
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        fetchAdminBets();
        fetchAdminDeposits();
        fetchAdminWithdrawals();
      }
    });
    return () => { isMounted = false; };
  }, [state.isAdmin, state.bets.length, state.matches, fetchAdminBets, fetchAdminDeposits, fetchAdminWithdrawals]);

  const getTeamById = (teamId) => {
    return TEAMS.find(t => t.id === teamId) || null;
  };

  const calculatePool = (type, targetId, eligibleTeamIds) => {
    const relevantBets = state.bets.filter(
      b => b.type === type && (type === 'stage' ? b.stage === targetId : b.targetId === targetId)
    );
    return calculatePoolWithConfig({
      type,
      targetId,
      eligibleTeamIds,
      bets: relevantBets,
      oddsConfig: state.oddsConfig,
    });
  };

  const updateOddsConfig = async (newConfig) => {
    try {
      const res = await api.adminUpdateOddsConfig(newConfig);
      if (res && res.success) {
        const normalized = normalizeOddsConfig(res.oddsConfig);
        setState(prev => ({ ...prev, oddsConfig: normalized }));
        await syncFromBackend();
        return { success: true, message: res.message, oddsConfig: normalized };
      }
      return { success: false, message: res?.message || 'Failed to update odds settings.' };
    } catch {
      return { success: false, message: 'Cannot reach backend server.' };
    }
  };

  const requestOtp = async (email) => {
    try {
      return await api.sendOtp(email);
    } catch {
      return { success: false, message: 'Cannot reach backend server. Please make sure BettingApp-server is running.' };
    }
  };

  const loginWithOtp = async (email, otp, name) => {
    try {
      const res = await api.verifyOtp(email, otp, name);
      if (res.success) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setCurrentUser(res.user);
        syncFromBackend();
        return { success: true, user: res.user };
      }
      return res;
    } catch {
      return { success: false, message: 'Cannot reach backend server. Please make sure BettingApp-server is running.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setMyDeposits([]);
    setMyWithdrawals([]);
  };

  const requestDeposit = async (amount, utr, playerNote = '') => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return { success: false, message: 'Please login with OTP first to add money.' };
    }
    try {
      const res = await api.requestDeposit(amount, utr, playerNote);
      if (res && res.success) {
        if (res.deposit) {
          setMyDeposits(prev => [res.deposit, ...prev]);
        }
        if (state.isAdmin) {
          fetchAdminDeposits();
        }
        return { success: true, message: res.message, deposit: res.deposit };
      }
      return { success: false, message: res?.message || 'Deposit request failed.' };
    } catch {
      return { success: false, message: 'Cannot reach backend server.' };
    }
  };

  const processAdminDeposit = async (depositId, action, adminNote = '') => {
    try {
      const res = await api.adminProcessDeposit(depositId, action, adminNote);
      if (res && res.success) {
        await Promise.all([fetchAdminDeposits(), syncFromBackend()]);
        return { success: true, message: res.message };
      }
      return { success: false, message: res?.message || 'Failed to process deposit.' };
    } catch {
      return { success: false, message: 'Cannot reach backend server.' };
    }
  };

  const toggleAdmin = (status = null) => {
    setState(prev => ({
      ...prev,
      isAdmin: status !== null ? status : !prev.isAdmin
    }));
  };

  const setGlobalBettingOpen = async (isOpen) => {
    try {
      await api.adminToggleGlobal(isOpen);
    } catch {
      // offline fallback
    }

    setState(prev => ({
      ...prev,
      globalBettingOpen: isOpen,
      matches: prev.matches.map(m => m.status === 'upcoming' ? { ...m, bettingOpen: isOpen } : m)
    }));
  };

  const setTeamBettingOpen = async (isOpen) => {
    try {
      await api.adminToggleTeamBetting(isOpen);
    } catch {
      // offline fallback
    }

    setState(prev => ({
      ...prev,
      teamBettingOpen: isOpen,
    }));
  };

  const setMatchBettingOpen = async (matchId, isOpen) => {
    try {
      await api.adminToggleMatch(matchId, isOpen);
    } catch {
      // offline fallback
    }

    setState(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id === matchId ? { ...m, bettingOpen: isOpen } : m)
    }));
  };

  const placeBet = async ({ type, targetId, teamId, amount, stage }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 20) {
      return { success: false, message: 'Minimum bet amount is ₹20' };
    }

    if (!currentUser || !localStorage.getItem(TOKEN_KEY)) {
      return { success: false, message: 'Please login with your email & OTP first!' };
    }

    try {
      const res = await api.placeBet({ type, targetId, teamId, amount: numAmount, stage });
      if (res && res.success) {
        setCurrentUser(prev => prev ? { ...prev, balance: res.newBalance } : prev);
        if (res.bet) {
          setState(prev => ({ ...prev, bets: [mapBackendBet(res.bet), ...prev.bets] }));
        }
        syncFromBackend();
        return { success: true, message: res.message };
      }
      return {
        success: false,
        message: res?.message || 'Failed to place bet.',
        isOpposingTeamConflict: res?.isOpposingTeamConflict,
      };
    } catch {
      return { success: false, message: 'Cannot reach backend server. Please make sure BettingApp-server is running.' };
    }
  };

  const recordMatchResult = async ({ matchId, winnerId, isTie, team1Score, team2Score, notes }) => {
    try {
      const res = await api.adminRecordScore({ matchId, winnerId, isTie, team1Score, team2Score, notes });
      if (res && res.success) {
        await syncFromBackend();
        return;
      }
    } catch {
      // fallback to local update if offline
    }

    setState(prev => {
      const matchIndex = prev.matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return prev;

      const targetMatch = prev.matches[matchIndex];
      const matchBets = prev.bets.filter(b => b.type === 'match' && b.targetId === matchId && b.status === 'active');
      const totalPool = matchBets.reduce((sum, b) => sum + Number(b.amount), 0);
      const winningBets = matchBets.filter(b => b.teamId === winnerId);
      const winningPool = winningBets.reduce((sum, b) => sum + Number(b.amount), 0);

      const updatedBets = prev.bets.map(bet => {
        if (bet.type === 'match' && bet.targetId === matchId && bet.status === 'active') {
          if (isTie) {
            return { ...bet, status: 'refunded', payout: bet.amount };
          } else if (bet.teamId === winnerId) {
            const payoutShare = winningPool > 0 ? (bet.amount / winningPool) * totalPool : bet.amount * bet.odds;
            return { ...bet, status: 'won', payout: Math.round(payoutShare) };
          } else {
            return { ...bet, status: 'lost', payout: 0 };
          }
        }
        return bet;
      });

      const updatedMatches = [...prev.matches];
      updatedMatches[matchIndex] = {
        ...targetMatch,
        status: 'completed',
        bettingOpen: false,
        result: {
          winnerId: isTie ? null : winnerId,
          isTie: !!isTie,
          team1Score,
          team2Score,
          notes: notes || (isTie ? 'Match tied' : `${getTeamById(winnerId)?.name} won`)
        }
      };

      return {
        ...prev,
        matches: updatedMatches,
        bets: updatedBets
      };
    });
  };

  const applyLocalSemiFinalMatchups = ({ sf1, sf2, top4TeamIds, advance }) => {
    let resolvedResult = { success: true, message: advance ? 'Advanced to Semi-Finals!' : 'Semi-Final matchups saved!' };
    setState(prev => {
      let sf1Pair;
      let sf2Pair;
      let qualified;

      if (sf1?.team1Id && sf1?.team2Id && sf2?.team1Id && sf2?.team2Id) {
        const slots = [sf1.team1Id, sf1.team2Id, sf2.team1Id, sf2.team2Id];
        if (new Set(slots).size !== 4) {
          resolvedResult = { success: false, message: 'All 4 Semi-Final team slots must be distinct teams.' };
          return prev;
        }
        sf1Pair = [sf1.team1Id, sf1.team2Id];
        sf2Pair = [sf2.team1Id, sf2.team2Id];
        qualified = slots;
      } else {
        qualified = top4TeamIds;
        if (!qualified || qualified.length !== 4) {
          const sorted = [...TEAMS].sort((a, b) => (prev.teamStats[b.id]?.points || 0) - (prev.teamStats[a.id]?.points || 0));
          qualified = sorted.slice(0, 4).map(t => t.id);
        }
        sf1Pair = [qualified[0], qualified[3]];
        sf2Pair = [qualified[1], qualified[2]];
      }

      const updatedMatches = prev.matches.map(m => {
        if (m.id === 'sf1' && m.status !== 'completed') {
          return {
            ...m,
            team1Id: sf1Pair[0],
            team2Id: sf1Pair[1],
            status: 'upcoming',
            bettingOpen: advance ? prev.globalBettingOpen : (m.status === 'upcoming' ? m.bettingOpen : false),
          };
        }
        if (m.id === 'sf2' && m.status !== 'completed') {
          return {
            ...m,
            team1Id: sf2Pair[0],
            team2Id: sf2Pair[1],
            status: 'upcoming',
            bettingOpen: advance ? prev.globalBettingOpen : (m.status === 'upcoming' ? m.bettingOpen : false),
          };
        }
        return m;
      });

      return {
        ...prev,
        currentStage: advance ? 'semi-final' : prev.currentStage,
        qualifiedTeamIds: { ...prev.qualifiedTeamIds, 'semi-final': qualified },
        matches: updatedMatches
      };
    });
    return resolvedResult;
  };

  const setSemiFinalMatches = async ({ sf1, sf2, advance = false }) => {
    try {
      const res = await api.adminSetSemiFinalMatches({ sf1, sf2, advance });
      if (res && res.success) {
        await syncFromBackend();
        return { success: true, message: res.message };
      }
      if (res && res.message) {
        return { success: false, message: res.message };
      }
    } catch {
      // fallback to local update if offline
    }

    return applyLocalSemiFinalMatchups({ sf1, sf2, advance });
  };

  const advanceToSemiFinals = async (payload = null) => {
    try {
      const res = await api.adminAdvanceSF(payload);
      if (res && res.success) {
        await syncFromBackend();
        return { success: true, message: res.message };
      }
      if (res && res.message) {
        return { success: false, message: res.message };
      }
    } catch {
      // fallback to local update if offline
    }

    const normalized = Array.isArray(payload) ? { top4TeamIds: payload } : (payload || {});
    return applyLocalSemiFinalMatchups({ ...normalized, advance: true });
  };

  const advanceToFinal = async (finalistIds = null) => {
    try {
      const res = await api.adminAdvanceFinal(finalistIds);
      if (res && res.success) {
        await syncFromBackend();
        return;
      }
    } catch {
      // fallback to local update if offline
    }

    setState(prev => {
      let finalists = finalistIds;
      if (!finalists || finalists.length !== 2) {
        const sf1 = prev.matches.find(m => m.id === 'sf1');
        const sf2 = prev.matches.find(m => m.id === 'sf2');
        finalists = [sf1?.result?.winnerId || prev.qualifiedTeamIds['semi-final'][0], sf2?.result?.winnerId || prev.qualifiedTeamIds['semi-final'][1]];
      }

      const updatedMatches = prev.matches.map(m => {
        if (m.id === 'final') return { ...m, team1Id: finalists[0], team2Id: finalists[1], status: 'upcoming', bettingOpen: true };
        return m;
      });

      return {
        ...prev,
        currentStage: 'final',
        qualifiedTeamIds: { ...prev.qualifiedTeamIds, final: finalists },
        matches: updatedMatches
      };
    });
  };

  const crownChampion = async (championId) => {
    try {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      const res = await api.adminCrownChampion(championId);
      if (res && res.success) {
        await syncFromBackend();
        return;
      }
    } catch {
      // fallback to local update if offline
    }

    setState(prev => ({
      ...prev,
      currentStage: 'completed',
      qualifiedTeamIds: { ...prev.qualifiedTeamIds, championId }
    }));
  };

  const requestWithdrawal = async (amount, payoutPayload = {}) => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return { success: false, message: 'Please login with OTP first to withdraw.' };
    }
    try {
      const res = await api.requestWithdrawal(amount, payoutPayload);
      if (res && res.success) {
        setCurrentUser(prev => prev ? { ...prev, balance: res.newBalance } : prev);
        if (res.withdrawal) {
          setMyWithdrawals(prev => [res.withdrawal, ...prev]);
        }
        if (state.isAdmin) {
          fetchAdminWithdrawals();
        }
        return { success: true, message: res.message, withdrawal: res.withdrawal };
      }
      return { success: false, message: res?.message || 'Withdrawal request failed.' };
    } catch {
      return { success: false, message: 'Cannot reach backend server.' };
    }
  };

  const processAdminWithdrawal = async (withdrawalId, action, adminNote = '') => {
    try {
      const res = await api.adminProcessWithdrawal(withdrawalId, action, adminNote);
      if (res && res.success) {
        await Promise.all([fetchAdminWithdrawals(), syncFromBackend()]);
        return { success: true, message: res.message };
      }
      return { success: false, message: res?.message || 'Failed to process withdrawal.' };
    } catch {
      return { success: false, message: 'Cannot reach backend server.' };
    }
  };

  const resetAllData = async () => {
    try {
      await api.adminReset();
    } catch {
      // offline fallback
    }
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <TournamentContext.Provider
      value={{
        ...state,
        selectedUser: currentUser || { name: 'Guest', balance: 0 },
        currentUser,
        adminBets,
        adminBetsLoading,
        adminBetsError,
        fetchAdminBets,
        myDeposits,
        fetchMyDeposits,
        requestDeposit,
        adminDeposits,
        adminDepositSummary,
        adminDepositsLoading,
        adminDepositsError,
        fetchAdminDeposits,
        processAdminDeposit,
        myWithdrawals,
        fetchMyWithdrawals,
        requestWithdrawal,
        adminWithdrawals,
        adminWithdrawalSummary,
        adminWithdrawalsLoading,
        adminWithdrawalsError,
        fetchAdminWithdrawals,
        processAdminWithdrawal,
        requestOtp,
        loginWithOtp,
        logout,
        getTeamById,
        calculatePool,
        updateOddsConfig,
        toggleAdmin,
        setGlobalBettingOpen,
        setTeamBettingOpen,
        setMatchBettingOpen,
        placeBet,
        recordMatchResult,
        setSemiFinalMatches,
        advanceToSemiFinals,
        advanceToFinal,
        crownChampion,
        resetAllData,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
