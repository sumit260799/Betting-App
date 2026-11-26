import { useState, useMemo } from 'react';
import { useTournament } from '../context/useTournament';
import { TEAMS } from '../data/tournamentData';
import { Modal } from './Modal';
import { OddsManagerModal } from './OddsManagerModal';
import { SemiFinalSetupModal } from './SemiFinalSetupModal';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Trophy,
  ArrowRight,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Search,
  Mail,
  Users,
  Coins,
  Download,
  Copy,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  ArrowUpRight,
  QrCode
} from 'lucide-react';

const STATUS_BADGES = {
  active: {
    label: 'Active',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Clock,
  },
  won: {
    label: 'Won',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  lost: {
    label: 'Lost',
    classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    classes: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    icon: RotateCcw,
  },
};

function formatBetContext(bet) {
  if (bet.type === 'match') {
    const fixture = bet.team1ShortName && bet.team2ShortName
      ? `${bet.team1ShortName} vs ${bet.team2ShortName}`
      : (bet.matchTitle || bet.targetId);
    return {
      primary: bet.matchNumber ? `Match #${bet.matchNumber} • ${fixture}` : fixture,
      secondary: bet.matchTime || `${(bet.stage || '').toUpperCase()} Match`,
    };
  }
  return {
    primary: `${(bet.stage || bet.targetId || '').toUpperCase()} Winner`,
    secondary: 'Tournament Stage Bet',
  };
}

function escapeCsvCell(value) {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export const AdminPanel = () => {
  const {
    isAdmin,
    toggleAdmin,
    globalBettingOpen,
    setGlobalBettingOpen,
    teamBettingOpen,
    setTeamBettingOpen,
    setMatchBettingOpen,
    currentStage,
    qualifiedTeamIds,
    advanceToSemiFinals,
    advanceToFinal,
    crownChampion,
    resetAllData,
    matches,
    teamStats,
    getTeamById,
    oddsConfig,
    adminBets,
    adminBetsLoading,
    adminBetsError,
    fetchAdminBets,
    adminDeposits,
    adminDepositSummary,
    adminDepositsLoading,
    adminDepositsError,
    fetchAdminDeposits,
    processAdminDeposit,
    adminWithdrawals,
    adminWithdrawalSummary,
    adminWithdrawalsLoading,
    adminWithdrawalsError,
    fetchAdminWithdrawals,
    processAdminWithdrawal,
  } = useTournament();

  const [expanded, setExpanded] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState('');
  const [showOddsManager, setShowOddsManager] = useState(false);
  const [showSfSetupModal, setShowSfSetupModal] = useState(false);
  const [ledgerTab, setLedgerTab] = useState('bets'); // 'bets' | 'deposits' | 'withdrawals'
  const [depositStatusFilter, setDepositStatusFilter] = useState('all');
  const [processingDepId, setProcessingDepId] = useState(null);
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState('all');
  const [processingWdId, setProcessingWdId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'match' | 'stage'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'won' | 'lost' | 'refunded'
  const [targetFilter, setTargetFilter] = useState('all');
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedBet, setSelectedBet] = useState(null);

  const sortedByPoints = useMemo(() => {
    return [...TEAMS].sort((a, b) => {
      const ptsA = teamStats[a.id]?.points || 0;
      const ptsB = teamStats[b.id]?.points || 0;
      return ptsB - ptsA;
    });
  }, [teamStats]);

  const targetOptions = useMemo(() => {
    const seen = new Map();
    adminBets.forEach(b => {
      const key = `${b.type}:${b.targetId}`;
      if (!seen.has(key)) {
        const ctx = formatBetContext(b);
        seen.set(key, { key, label: ctx.primary });
      }
    });
    return Array.from(seen.values());
  }, [adminBets]);

  const filteredBets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return adminBets.filter(bet => {
      if (typeFilter !== 'all' && bet.type !== typeFilter) return false;
      if (statusFilter !== 'all' && bet.status !== statusFilter) return false;
      if (targetFilter !== 'all' && `${bet.type}:${bet.targetId}` !== targetFilter) return false;

      if (!q) return true;
      const ctx = formatBetContext(bet);
      const haystack = [
        bet.id,
        bet.playerName,
        bet.playerEmail,
        bet.teamName,
        bet.teamShortName,
        bet.stage,
        ctx.primary,
        bet.team1Name,
        bet.team2Name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [adminBets, searchQuery, typeFilter, statusFilter, targetFilter]);

  const summary = useMemo(() => {
    const totalStake = filteredBets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const activeStake = filteredBets
      .filter(b => b.status === 'active')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalPayout = filteredBets.reduce((sum, b) => sum + Number(b.payout || 0), 0);
    const uniqueEmails = new Set(
      filteredBets.map(b => b.playerEmail || b.userId).filter(Boolean)
    );
    return {
      count: filteredBets.length,
      totalStake,
      activeStake,
      totalPayout,
      uniqueBettors: uniqueEmails.size,
    };
  }, [filteredBets]);

  const filteredDeposits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return adminDeposits.filter(d => {
      if (depositStatusFilter !== 'all' && d.status !== depositStatusFilter) return false;
      if (!q) return true;
      const haystack = [d.id, d.playerName, d.playerEmail, d.utr, d.playerNote, d.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [adminDeposits, depositStatusFilter, searchQuery]);

  const filteredWithdrawals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return adminWithdrawals.filter(w => {
      if (withdrawStatusFilter !== 'all' && w.status !== withdrawStatusFilter) return false;
      if (!q) return true;
      const haystack = [w.id, w.playerName, w.playerEmail, w.payoutMethod, w.payoutDetails, w.payoutNote, w.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [adminWithdrawals, withdrawStatusFilter, searchQuery]);

  if (!isAdmin) return null;

  const sf1Match = matches.find(m => m.id === 'sf1');
  const sf2Match = matches.find(m => m.id === 'sf2');
  const hasCustomSfMatchups = Boolean(
    sf1Match?.team1Id && sf1Match?.team2Id && sf2Match?.team1Id && sf2Match?.team2Id
  );

  const handleLaunchSF = () => {
    if (hasCustomSfMatchups) {
      advanceToSemiFinals({
        sf1: { team1Id: sf1Match.team1Id, team2Id: sf1Match.team2Id },
        sf2: { team1Id: sf2Match.team1Id, team2Id: sf2Match.team2Id },
      });
      return;
    }
    const teamsToQualify = sortedByPoints.slice(0, 4).map(t => t.id);
    advanceToSemiFinals(teamsToQualify);
  };

  const handleLaunchFinal = () => {
    const sf1 = matches.find(m => m.id === 'sf1');
    const sf2 = matches.find(m => m.id === 'sf2');
    const w1 = sf1?.result?.winnerId || qualifiedTeamIds['semi-final'][0];
    const w2 = sf2?.result?.winnerId || qualifiedTeamIds['semi-final'][1];
    advanceToFinal([w1, w2]);
  };

  const handleCrownChampion = () => {
    if (selectedChampion) {
      crownChampion(selectedChampion);
    }
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleProcessDeposit = async (depositId, action) => {
    setProcessingDepId(depositId);
    await processAdminDeposit(depositId, action);
    setProcessingDepId(null);
  };

  const handleProcessWithdrawal = async (withdrawalId, action) => {
    setProcessingWdId(withdrawalId);
    await processAdminWithdrawal(withdrawalId, action);
    setProcessingWdId(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'Bet ID',
      'Player Name',
      'Player Email',
      'Wallet Balance',
      'Bet Type',
      'Stage',
      'Match / Target',
      'Team Backed',
      'Stake (INR)',
      'Odds',
      'Est. Return (INR)',
      'Status',
      'Settled Payout (INR)',
      'Placed At',
    ];

    const rows = filteredBets.map(bet => {
      const ctx = formatBetContext(bet);
      const estReturn = Math.round(bet.amount * bet.odds);
      return [
        bet.id,
        bet.playerName,
        bet.playerEmail || '',
        bet.playerBalance ?? '',
        bet.type,
        bet.stage,
        ctx.primary,
        bet.teamName || bet.teamId,
        bet.amount,
        bet.odds,
        estReturn,
        bet.status,
        bet.payout,
        bet.createdAt ? new Date(bet.createdAt).toISOString() : '',
      ].map(escapeCsvCell).join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apl-2026-bets-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-b from-rose-950/60 via-[#0e1422] to-[#0b0f19] border-b border-rose-500/30 shadow-2xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

        {/* Banner Header with Quick Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-rose-200 tracking-tight">
                  Organizer Admin Console
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inspect all player bets & emails, manage betting gates, and advance tournament stages.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOddsManager(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Manage Returns &amp; Odds</span>
            </button>

            <button
              type="button"
              onClick={() => setTeamBettingOpen(!teamBettingOpen)}
              title={
                !globalBettingOpen
                  ? 'Global betting is currently stopped; team betting toggle will take effect when global betting is resumed.'
                  : 'Stop or resume betting on Teams (Stage Winner) without affecting Match betting.'
              }
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border shadow-lg ${teamBettingOpen
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-amber-500/10'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                }`}
            >
              {teamBettingOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{teamBettingOpen ? 'Stop Team Betting' : 'Resume Team Betting'}</span>
            </button>

            <button
              type="button"
              onClick={() => setGlobalBettingOpen(!globalBettingOpen)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg ${globalBettingOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
            >
              {globalBettingOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{globalBettingOpen ? 'Stop All Betting' : 'Resume All Betting'}</span>
            </button>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Collapse Console' : 'Expand Console'}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] transition"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => toggleAdmin(false)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] transition"
            >
              Exit Admin
            </button>
          </div>
        </div>

        {/* Collapsible Console Body */}
        {expanded && (
          <div className="space-y-4 pt-3 border-t border-white/[0.07]">
            {/* Top 3 Control Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Card 1: Stage Progress & Transition */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.07] space-y-3">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Tournament Phase Progression</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Current Phase:</span>
                    <span className="font-bold text-amber-300 uppercase font-mono">{currentStage}</span>
                  </div>

                  {currentStage === 'league' && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-2">
                      <p className="text-[11px] text-slate-400">
                        {hasCustomSfMatchups
                          ? `SF1: ${getTeamById(sf1Match.team1Id)?.shortName} vs ${getTeamById(sf1Match.team2Id)?.shortName} • SF2: ${getTeamById(sf2Match.team1Id)?.shortName} vs ${getTeamById(sf2Match.team2Id)?.shortName}`
                          : 'Set custom Semi-Final matchups or advance top 4 league teams automatically.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSfSetupModal(true)}
                        className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] text-indigo-200 font-bold text-xs border border-indigo-500/30 transition flex items-center justify-center space-x-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{hasCustomSfMatchups ? 'Edit Semi-Final Matches' : 'Select / Set Semi-Final Matches'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLaunchSF}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1"
                      >
                        <span>
                          {hasCustomSfMatchups ? 'Advance to Semi-Finals (Set Matchups)' : 'Advance to Semi-Finals (Top 4)'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {currentStage === 'semi-final' && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-2">
                      <p className="text-[11px] text-slate-400">
                        {hasCustomSfMatchups
                          ? `SF1: ${getTeamById(sf1Match.team1Id)?.shortName} vs ${getTeamById(sf1Match.team2Id)?.shortName} • SF2: ${getTeamById(sf2Match.team1Id)?.shortName} vs ${getTeamById(sf2Match.team2Id)?.shortName}`
                          : 'Advance Semi-Final winners to the 10-over Grand Final.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSfSetupModal(true)}
                        className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] text-indigo-200 font-bold text-xs border border-indigo-500/30 transition flex items-center justify-center space-x-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Set / Edit Semi-Final Matches</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLaunchFinal}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1"
                      >
                        <span>Advance to Grand Final (2 Finalists)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {currentStage === 'final' && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-2">
                      <label className="text-[11px] text-slate-400 block font-semibold">
                        Select Tournament Champion:
                      </label>
                      <select
                        value={selectedChampion}
                        onChange={(e) => setSelectedChampion(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="">Select Champion Team...</option>
                        {qualifiedTeamIds.final.map(tid => (
                          <option key={tid} value={tid}>{getTeamById(tid)?.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleCrownChampion}
                        disabled={!selectedChampion}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1 disabled:opacity-50"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Crown Champion & Settle Bets</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Interactive Match-Level Betting Gates */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.07] space-y-2">
                <h4 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Match-Level Betting Gates</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Click any upcoming match gate to lock or re-open betting:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {matches.map(m => {
                    const isSettled = m.status === 'completed';
                    const isPending = m.status === 'pending-qualification';
                    return (
                      <div key={m.id} className="px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-[11px] gap-2">
                        <span className="font-mono text-slate-300 truncate">
                          M{m.matchNumber}: {m.team1Id && m.team2Id ? `${getTeamById(m.team1Id)?.shortName} vs ${getTeamById(m.team2Id)?.shortName}` : (m.title || 'TBD')}
                        </span>
                        {isSettled ? (
                          <span className="text-[10px] font-semibold text-slate-400">Settled</span>
                        ) : isPending ? (
                          <span className="text-[10px] font-semibold text-slate-500">Pending</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMatchBettingOpen(m.id, !m.bettingOpen)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${m.bettingOpen
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                              }`}
                          >
                            {m.bettingOpen ? 'Open • Lock' : 'Locked • Open'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Returns Engine, Export & Reset */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.07] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5 text-[11px]">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Returns Engine &amp; Tools</span>
                  </h4>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Odds Mode:</span>
                      <span className="font-semibold text-amber-300 uppercase">
                        {oddsConfig?.mode === 'fixed' ? 'Admin Fixed' : 'Dynamic Pool'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Range / Default:</span>
                      <span className="font-mono text-slate-200">
                        {Number(oddsConfig?.minOdds ?? 1.15).toFixed(2)}x–{Number(oddsConfig?.maxOdds ?? 5).toFixed(2)}x ({Number(oddsConfig?.zeroBetOdds ?? 2.5).toFixed(2)}x)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payout Rule:</span>
                      <span className="font-semibold text-emerald-300">
                        {oddsConfig?.settlementMode === 'odds' ? 'Stake × Odds' : 'Pool Split'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Withdraw Fee:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {Number(oddsConfig?.withdrawFeePct ?? 10)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowOddsManager(true)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/30 transition flex items-center justify-center space-x-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Configure Team / Match Multipliers</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={filteredBets.length === 0}
                    className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-semibold text-xs border border-white/[0.08] transition flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export Bets Ledger (CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset all bets, matches, and points back to initial state?')) {
                        resetAllData();
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-semibold text-xs border border-slate-800 hover:border-rose-800/60 transition flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Reset All Tournament Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ADMIN LEDGER SWITCHER (Bets vs Withdrawals & Profit) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center bg-slate-950/90 border border-white/[0.08] rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setLedgerTab('bets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${ledgerTab === 'bets'
                      ? 'bg-white/[0.1] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>All Player Bets ({filteredBets.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTab('deposits')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${ledgerTab === 'deposits'
                      ? 'bg-white/[0.1] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deposits / Add Money</span>
                  {adminDepositSummary.pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {adminDepositSummary.pendingCount} pending
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTab('withdrawals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${ledgerTab === 'withdrawals'
                      ? 'bg-white/[0.1] text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Withdrawals &amp; Admin Profit</span>
                  {adminWithdrawalSummary.pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {adminWithdrawalSummary.pendingCount} pending
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Realized Admin Profit:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₹{adminWithdrawalSummary.realizedProfit}
                </span>
              </div>
            </div>

            {ledgerTab === 'bets' && (
              <div className="rounded-2xl bg-slate-950/80 border border-white/[0.08] overflow-hidden">
                {/* Ledger Header & Summary Metrics */}
                <div className="p-4 border-b border-white/[0.07] space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>All Player Bets & Bettor Ledger</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-slate-300">
                          {filteredBets.length} {filteredBets.length === 1 ? 'bet' : 'bets'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Complete audit trail of every player&apos;s name, email, match/stage pick, stake, odds, and payout.
                      </p>
                    </div>

                    {/* Live KPI Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-400">Bettors:</span>
                        <span className="font-bold text-slate-100 font-mono">{summary.uniqueBettors}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center space-x-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-400">Total Stake:</span>
                        <span className="font-bold text-amber-300 font-mono">₹{summary.totalStake}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400">Active Pool:</span>
                        <span className="font-bold text-emerald-300 font-mono">₹{summary.activeStake}</span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchAdminBets}
                        disabled={adminBetsLoading}
                        title="Refresh bets ledger"
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 flex items-center space-x-1 transition"
                      >
                        <RefreshCcw className={`w-3.5 h-3.5 ${adminBetsLoading ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Search & Filters Toolbar */}
                  <div className="flex flex-col lg:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by player name, email, team, match, or bet ID..."
                        className="w-full bg-slate-900/90 border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Segmented Pills */}
                      <div className="flex items-center bg-slate-900/90 border border-white/[0.08] rounded-xl p-0.5 text-[11px]">
                        {[
                          { id: 'all', label: 'All Types' },
                          { id: 'match', label: 'Match' },
                          { id: 'stage', label: 'Stage' },
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setTypeFilter(item.id)}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition ${typeFilter === item.id
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-900/90 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-amber-500/60"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="refunded">Refunded</option>
                      </select>

                      {/* Match / Target Filter */}
                      <select
                        value={targetFilter}
                        onChange={(e) => setTargetFilter(e.target.value)}
                        className="bg-slate-900/90 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-amber-500/60 max-w-[200px]"
                      >
                        <option value="all">All Matches & Stages</option>
                        {targetOptions.map(opt => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Error State */}
                {adminBetsError && (
                  <div className="p-4 bg-rose-950/30 border-b border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-3">
                    <span>{adminBetsError}</span>
                    <button
                      type="button"
                      onClick={fetchAdminBets}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Empty / Loading States */}
                {adminBetsLoading && adminBets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading player bets ledger...
                  </div>
                ) : filteredBets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">No matching bets found</p>
                    <p>Try clearing your search or filter selections.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/[0.07]">
                          <tr>
                            <th className="py-3 px-4">Player &amp; Email</th>
                            <th className="py-3 px-4">Match / Stage</th>
                            <th className="py-3 px-4">Team Backed</th>
                            <th className="py-3 px-4 text-right">Stake</th>
                            <th className="py-3 px-4 text-right">Odds / Est. Return</th>
                            <th className="py-3 px-4">Status &amp; Payout</th>
                            <th className="py-3 px-4 text-right">Placed</th>
                            <th className="py-3 px-3 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {filteredBets.map(bet => {
                            const ctx = formatBetContext(bet);
                            const badge = STATUS_BADGES[bet.status] || STATUS_BADGES.active;
                            const BadgeIcon = badge.icon;
                            const estReturn = Math.round(bet.amount * bet.odds);

                            return (
                              <tr
                                key={bet.id}
                                onClick={() => setSelectedBet(bet)}
                                className="hover:bg-white/[0.03] transition cursor-pointer"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-[11px] flex-shrink-0">
                                      {(bet.playerName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-100 truncate">
                                        {bet.playerName || 'Unknown Player'}
                                      </p>
                                      <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                                        <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                        <span className="truncate max-w-[200px]">
                                          {bet.playerEmail || 'Email unavailable'}
                                        </span>
                                        {bet.playerEmail && (
                                          <button
                                            type="button"
                                            title="Copy email"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopy(bet.playerEmail, `row-${bet.id}`);
                                            }}
                                            className="p-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-amber-300 transition"
                                          >
                                            {copiedKey === `row-${bet.id}` ? (
                                              <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <p className="font-semibold text-slate-200">{ctx.primary}</p>
                                  <p className="text-[11px] text-slate-500">{ctx.secondary}</p>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: bet.teamColor || '#f59e0b' }}
                                    />
                                    <span className="font-medium text-slate-200">
                                      {bet.teamName || bet.teamId}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                                  ₹{bet.amount}
                                </td>

                                <td className="py-3 px-4 text-right font-mono">
                                  <span className="text-slate-200 font-semibold">{bet.odds}x</span>
                                  <span className="block text-[10px] text-slate-500">Est: ₹{estReturn}</span>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.classes}`}>
                                      <BadgeIcon className="w-3 h-3" />
                                      <span>{badge.label}</span>
                                    </span>
                                    {bet.payout > 0 && (
                                      <span className="font-mono text-[11px] font-bold text-emerald-400">
                                        ₹{bet.payout}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right text-[11px] text-slate-400 whitespace-nowrap">
                                  {bet.createdAt ? new Date(bet.createdAt).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }) : '—'}
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBet(bet);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white transition"
                                    title="View full bet details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-white/[0.06] max-h-96 overflow-y-auto">
                      {filteredBets.map(bet => {
                        const ctx = formatBetContext(bet);
                        const badge = STATUS_BADGES[bet.status] || STATUS_BADGES.active;
                        const BadgeIcon = badge.icon;
                        return (
                          <div
                            key={bet.id}
                            onClick={() => setSelectedBet(bet)}
                            className="p-3.5 space-y-2 hover:bg-white/[0.03] transition cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-100 text-xs truncate">{bet.playerName}</p>
                                <p className="text-[11px] text-slate-400 truncate flex items-center space-x-1">
                                  <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="truncate">{bet.playerEmail || 'Email unavailable'}</span>
                                </p>
                              </div>
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-bold flex-shrink-0 ${badge.classes}`}>
                                <BadgeIcon className="w-3 h-3" />
                                <span>{badge.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <div className="min-w-0">
                                <p className="text-slate-300 font-medium truncate">{ctx.primary}</p>
                                <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: bet.teamColor || '#f59e0b' }}
                                  />
                                  <span className="truncate">{bet.teamName || bet.teamId}</span>
                                </p>
                              </div>
                              <div className="text-right font-mono flex-shrink-0">
                                <span className="font-bold text-amber-300">₹{bet.amount}</span>
                                <span className="block text-[10px] text-slate-400">{bet.odds}x</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {ledgerTab === 'deposits' && (
              <div className="rounded-2xl bg-slate-950/80 border border-white/[0.08] overflow-hidden">
                <div className="p-4 border-b border-white/[0.07] space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                        <QrCode className="w-4 h-4 text-amber-400" />
                        <span>Player UPI Deposit Requests (UTR Verification)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Verify UTR in your UPI app, then click Approve &amp; Credit to add real points to the player&apos;s wallet.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center space-x-1.5">
                        <span className="text-emerald-300/80">Approved Total:</span>
                        <span className="font-bold text-emerald-300 font-mono">₹{adminDepositSummary.totalApproved}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center space-x-1.5">
                        <span className="text-amber-300/80">Pending Verification:</span>
                        <span className="font-bold text-amber-300 font-mono">₹{adminDepositSummary.pendingAmount}</span>
                      </div>
                      <button
                        type="button"
                        onClick={fetchAdminDeposits}
                        disabled={adminDepositsLoading}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 flex items-center space-x-1 transition"
                      >
                        <RefreshCcw className={`w-3.5 h-3.5 ${adminDepositsLoading ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search player name, email, or UTR number..."
                        className="w-full bg-slate-900/90 border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition"
                      />
                    </div>
                    <select
                      value={depositStatusFilter}
                      onChange={(e) => setDepositStatusFilter(e.target.value)}
                      className="bg-slate-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
                    >
                      <option value="all">All Requests ({adminDeposits.length})</option>
                      <option value="pending">Pending ({adminDepositSummary.pendingCount})</option>
                      <option value="approved">Approved ({adminDepositSummary.approvedCount})</option>
                      <option value="rejected">Rejected ({adminDepositSummary.rejectedCount})</option>
                    </select>
                  </div>
                </div>

                {adminDepositsError && (
                  <div className="p-4 bg-rose-950/30 border-b border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                    <span>{adminDepositsError}</span>
                    <button
                      type="button"
                      onClick={fetchAdminDeposits}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-200 font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {filteredDeposits.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No deposit requests found.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/[0.07]">
                        <tr>
                          <th className="py-3 px-4">Player &amp; Email</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">UTR / Transaction ID</th>
                          <th className="py-3 px-4">Note</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredDeposits.map((d) => {
                          const isPending = d.status === 'pending';
                          const isApproved = d.status === 'approved';
                          const isBusy = processingDepId === d.id;
                          return (
                            <tr key={d.id} className="hover:bg-white/[0.03] transition">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-100">{d.playerName}</p>
                                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  <span>{d.playerEmail}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(d.playerEmail, `dep-email-${d.id}`)}
                                    className="p-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-amber-300"
                                    title="Copy email"
                                  >
                                    {copiedKey === `dep-email-${d.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                                ₹{d.amount}
                              </td>
                              <td className="py-3 px-4">
                                <div className="inline-flex items-center space-x-1.5 font-mono text-slate-200 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.08]">
                                  <span>{d.utr}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(d.utr, `dep-utr-${d.id}`)}
                                    className="text-slate-400 hover:text-amber-300"
                                    title="Copy UTR"
                                  >
                                    {copiedKey === `dep-utr-${d.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                                {d.playerNote || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${isApproved
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : isPending
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  }`}>
                                  <span>{d.status}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {isPending ? (
                                  <div className="inline-flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleProcessDeposit(d.id, 'approve')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold disabled:opacity-50 transition"
                                    >
                                      Approve &amp; Credit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleProcessDeposit(d.id, 'reject')}
                                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold disabled:opacity-50 transition"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    {d.processedAt ? new Date(d.processedAt).toLocaleDateString() : 'Processed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {ledgerTab === 'withdrawals' && (
              <div className="rounded-2xl bg-slate-950/80 border border-white/[0.08] overflow-hidden">
                <div className="p-4 border-b border-white/[0.07] space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <span>Player Withdrawals &amp; Platform Fee Profit</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        0% fee during betting • {Number(oddsConfig?.withdrawFeePct ?? 10)}% platform fee deducted on cash-out.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center space-x-1.5">
                        <span className="text-emerald-300/80">Realized Profit:</span>
                        <span className="font-bold text-emerald-300 font-mono">₹{adminWithdrawalSummary.realizedProfit}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center space-x-1.5">
                        <span className="text-amber-300/80">Pending Fee:</span>
                        <span className="font-bold text-amber-300 font-mono">₹{adminWithdrawalSummary.pendingProfit}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center space-x-1.5">
                        <span className="text-slate-400">Net to Pay:</span>
                        <span className="font-bold text-slate-100 font-mono">₹{adminWithdrawalSummary.pendingNetToPay}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOddsManager(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold transition"
                      >
                        Fee: {Number(oddsConfig?.withdrawFeePct ?? 10)}% • Edit
                      </button>
                      <button
                        type="button"
                        onClick={fetchAdminWithdrawals}
                        disabled={adminWithdrawalsLoading}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 flex items-center space-x-1 transition"
                      >
                        <RefreshCcw className={`w-3.5 h-3.5 ${adminWithdrawalsLoading ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search player name, email, or payout note..."
                        className="w-full bg-slate-900/90 border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition"
                      />
                    </div>
                    <select
                      value={withdrawStatusFilter}
                      onChange={(e) => setWithdrawStatusFilter(e.target.value)}
                      className="bg-slate-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
                    >
                      <option value="all">All Requests ({adminWithdrawals.length})</option>
                      <option value="pending">Pending ({adminWithdrawalSummary.pendingCount})</option>
                      <option value="paid">Paid ({adminWithdrawalSummary.paidCount})</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {adminWithdrawalsError && (
                  <div className="p-4 bg-rose-950/30 border-b border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                    <span>{adminWithdrawalsError}</span>
                    <button
                      type="button"
                      onClick={fetchAdminWithdrawals}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-200 font-semibold"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {filteredWithdrawals.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No withdrawal requests found.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/[0.07]">
                        <tr>
                          <th className="py-3 px-4">Player &amp; Email</th>
                          <th className="py-3 px-4 text-right">Requested</th>
                          <th className="py-3 px-4 text-right">Admin Fee</th>
                          <th className="py-3 px-4 text-right">Net to Pay</th>
                          <th className="py-3 px-4">Payout Method &amp; Details</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredWithdrawals.map((w) => {
                          const isPending = w.status === 'pending';
                          const isPaid = w.status === 'paid';
                          const isBusy = processingWdId === w.id;
                          return (
                            <tr key={w.id} className="hover:bg-white/[0.03] transition">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-100">{w.playerName}</p>
                                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  <span>{w.playerEmail}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(w.playerEmail, `wd-${w.id}`)}
                                    className="p-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-amber-300"
                                    title="Copy email"
                                  >
                                    {copiedKey === `wd-${w.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-200">₹{w.grossAmount}</td>
                              <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                                ₹{w.feeAmount} <span className="text-[10px] text-slate-500">({w.feePct}%)</span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">₹{w.netAmount}</td>
                              <td className="py-3 px-4 text-slate-300 max-w-[220px]">
                                <div className="flex items-center space-x-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-200 text-[10px] font-bold">
                                    {w.payoutMethod || 'UPI'}
                                  </span>
                                  {w.payoutDetails && (
                                    <span className="font-mono text-[11px] text-indigo-300 truncate">
                                      {w.payoutDetails}
                                    </span>
                                  )}
                                  {w.payoutDetails && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(w.payoutDetails, `wd-det-${w.id}`)}
                                      className="p-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-amber-300 flex-shrink-0"
                                      title="Copy payout details"
                                    >
                                      {copiedKey === `wd-det-${w.id}` ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                {w.payoutNote && (
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{w.payoutNote}</p>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${isPaid
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : isPending
                                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  }`}>
                                  <span>{w.status}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {isPending ? (
                                  <div className="inline-flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleProcessWithdrawal(w.id, 'approve')}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold disabled:opacity-50 transition"
                                    >
                                      Mark Paid
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleProcessWithdrawal(w.id, 'reject')}
                                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-semibold disabled:opacity-50 transition"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    {w.processedAt ? new Date(w.processedAt).toLocaleDateString() : 'Processed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Bet Detail Modal */}
      {selectedBet && (
        <Modal onClose={() => setSelectedBet(null)} maxWidth="md">
          <div className="px-5 py-3.5 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedBet(null)}
              aria-label="Close modal"
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Admin Bet Audit
            </p>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              {selectedBet.playerName} • ₹{selectedBet.amount}
            </h3>
            <p className="text-[11px] font-mono text-slate-500 truncate">{selectedBet.id}</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4 text-xs">
            {/* Player Info Card */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Player Identity</p>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Name</span>
                <span className="font-semibold text-slate-100">{selectedBet.playerName}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Email</span>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="font-medium text-indigo-300 truncate">{selectedBet.playerEmail || 'Unavailable'}</span>
                  {selectedBet.playerEmail && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedBet.playerEmail, 'modal-email')}
                      className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                      title="Copy email"
                    >
                      {copiedKey === 'modal-email' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              {selectedBet.playerBalance !== null && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400">Current Wallet Balance</span>
                  <span className="font-mono font-bold text-amber-300">₹{selectedBet.playerBalance}</span>
                </div>
              )}
            </div>

            {/* Match & Wager Details */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wager &amp; Match Details</p>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Bet Type</span>
                <span className="font-semibold text-slate-200 uppercase">{selectedBet.type}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Stage</span>
                <span className="font-semibold text-slate-200 uppercase">{selectedBet.stage}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Target / Fixture</span>
                <span className="font-semibold text-slate-100 text-right">{formatBetContext(selectedBet).primary}</span>
              </div>
              {selectedBet.type === 'match' && selectedBet.team1Name && selectedBet.team2Name && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400">Teams</span>
                  <span className="text-slate-300 text-right">{selectedBet.team1Name} vs {selectedBet.team2Name}</span>
                </div>
              )}
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Team Backed</span>
                <span className="font-semibold text-slate-100 flex items-center space-x-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedBet.teamColor || '#f59e0b' }}
                  />
                  <span>{selectedBet.teamName || selectedBet.teamId}</span>
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400">Stake Amount</span>
                <span className="font-mono font-bold text-amber-300">₹{selectedBet.amount}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Odds</span>
                <span className="font-mono font-semibold text-slate-200">{selectedBet.odds}x</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Estimated Return</span>
                <span className="font-mono font-semibold text-slate-200">
                  ₹{Math.round(selectedBet.amount * selectedBet.odds)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Status</span>
                <span className="font-bold uppercase text-slate-100">{selectedBet.status}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Settled Payout</span>
                <span className="font-mono font-bold text-emerald-400">₹{selectedBet.payout}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Placed At</span>
                <span className="text-slate-300">
                  {selectedBet.createdAt ? new Date(selectedBet.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-[#0a0f18] border-t border-white/[0.07] flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedBet(null)}
              className="px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {showOddsManager && (
        <OddsManagerModal onClose={() => setShowOddsManager(false)} />
      )}

      {showSfSetupModal && (
        <SemiFinalSetupModal onClose={() => setShowSfSetupModal(false)} />
      )}
    </div>
  );
};
