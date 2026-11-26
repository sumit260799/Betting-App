import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import { X, Trophy, Coins, CheckCircle2, AlertCircle, ShieldAlert, Mail, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export const BettingModal = ({ target, onClose, onOpenLoginModal, onOpenAddMoneyModal }) => {
  const {
    currentUser,
    selectedUser,
    placeBet,
    calculatePool,
    getTeamById,
    globalBettingOpen,
    teamBettingOpen,
    currentStage,
    qualifiedTeamIds,
    bets
  } = useTournament();

  const isStageBet = target.type === 'stage';
  const stageName = isStageBet ? (target.stage || currentStage) : target.match.stage;

  const eligibleTeamIds = isStageBet
    ? (stageName === 'league'
      ? ['acceleron-mavericks', 'acceleron-knight-riders', 'acceleron-strikers', 'acceleron-super-xi', 'acceleron-predator']
      : (stageName === 'semi-final' ? qualifiedTeamIds['semi-final'] : qualifiedTeamIds.final))
    : [target.match.team1Id, target.match.team2Id].filter(Boolean);

  // Check if current user already bet on one of the teams in this match
  const userMatchBets = !isStageBet && currentUser
    ? bets.filter(b => (b.userId === currentUser.id || b.userName === currentUser.name) && b.targetId === target.match.id && b.status === 'active')
    : [];

  const alreadyBetTeamId = userMatchBets.length > 0 ? userMatchBets[0].teamId : null;
  const alreadyBetTeam = alreadyBetTeamId ? getTeamById(alreadyBetTeamId) : null;

  // Initial selected team: prefer already bet team (to add stake) or default
  const [selectedTeamId, setSelectedTeamId] = useState(
    alreadyBetTeamId || target.defaultTeamId || eligibleTeamIds[0] || ''
  );
  const [betAmount, setBetAmount] = useState('100');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const pool = calculatePool(
    target.type,
    isStageBet ? stageName : target.match.id,
    eligibleTeamIds
  );

  const selectedOdds = parseFloat(pool.teamOdds[selectedTeamId] || 2.0);
  const parsedAmount = Number(betAmount);
  const numAmount = betAmount !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const isBelowMin = betAmount !== '' && numAmount < 20;
  const isExceedingBalance = Boolean(currentUser) && numAmount > selectedUser.balance;
  const potentialPayout = Math.round(numAmount * selectedOdds);
  const potentialProfit = Math.max(0, potentialPayout - numAmount);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleBetAmountChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setBetAmount('');
      return;
    }
    const digitsOnly = raw.replace(/\D/g, '');
    setBetAmount(digitsOnly);
  };

  const handleBetAmountKeyDown = (e) => {
    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'ArrowDown' && numAmount <= 20) {
      e.preventDefault();
    }
  };

  // Opposing team check
  const isOpposingTeamBlocked = !isStageBet && alreadyBetTeamId && selectedTeamId !== alreadyBetTeamId;

  const handlePlaceBet = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'Please login with your email & OTP first.' });
      return;
    }
    if (!selectedTeamId) {
      setStatusMessage({ type: 'error', text: 'Please select a team to bet on.' });
      return;
    }
    if (numAmount < 20) {
      setStatusMessage({ type: 'error', text: 'Minimum bet amount is ₹20.' });
      return;
    }

    if (isOpposingTeamBlocked) {
      setStatusMessage({
        type: 'error',
        text: `Rule Violation: You have already backed ${alreadyBetTeam?.name} in this match. You cannot bet on both teams in the same match!`
      });
      return;
    }

    setSubmitting(true);
    const res = await placeBet({
      type: target.type,
      targetId: isStageBet ? stageName : target.match.id,
      teamId: selectedTeamId,
      amount: numAmount,
      stage: stageName,
    });
    setSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // ignore confetti errors
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const selectedTeam = getTeamById(selectedTeamId);
  const isBettingBlocked = !globalBettingOpen || (isStageBet && !teamBettingOpen);
  const isSubmitDisabled = submitting || !currentUser || isBettingBlocked || isOpposingTeamBlocked || numAmount < 20 || selectedUser.balance < numAmount;

  return (
    <Modal onClose={onClose} maxWidth="xl">
      {/* Sleek Sticky Header */}
      <div className="px-5 py-3.5 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {isStageBet ? `${stageName.toUpperCase()} WINNER BET` : `MATCH ${target.match.matchNumber} BETTING`}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5 leading-snug">
          {isStageBet
            ? `Bet on ${stageName === 'final' ? 'Tournament Champion' : stageName.toUpperCase() + ' Winner'}`
            : `${getTeamById(target.match.team1Id)?.name || 'TBD'} vs ${getTeamById(target.match.team2Id)?.name || 'TBD'}`
          }
        </h3>
        {/* <p className="text-[11px] text-slate-400">
          {oddsConfig?.mode === 'fixed'
            ? 'Admin-managed multipliers'
            : `Dynamic pot (${Number(oddsConfig?.minOdds ?? 1.15).toFixed(2)}x–${Number(oddsConfig?.maxOdds ?? 5).toFixed(2)}x)`}{' '}
          • {oddsConfig?.settlementMode === 'odds' ? 'Payout = Stake × Odds' : 'Pool split settlement'} • Anti-hedging enforced
        </p> */}
      </div>

      {/* Scrollable Body */}
      <form id="bet-form" onSubmit={handlePlaceBet} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5">
        {isBettingBlocked && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start space-x-2.5 text-xs text-rose-200">
            <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">
                {!globalBettingOpen ? 'All Betting Stopped by Admin' : 'Team Betting Stopped by Admin'}
              </p>
              <p className="text-rose-200/80 mt-0.5">
                {!globalBettingOpen
                  ? 'Both team and match betting are currently paused by the organizer.'
                  : 'Stage / team winner betting is paused. Match-by-match betting may still be open in Match Center.'}
              </p>
            </div>
          </div>
        )}

        {/* Login CTA if not authenticated */}
        {!currentUser && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-indigo-200">Authentication Required</p>
              <p className="text-indigo-300/80 mt-0.5">Sign in with your email OTP to place bets.</p>
            </div>
            {onOpenLoginModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLoginModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold flex items-center justify-center space-x-1.5 flex-shrink-0 transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>OTP Login</span>
              </button>
            )}
          </div>
        )}

        {/* User Wallet Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Bettor:</span>
            <span className="font-bold text-slate-200">{selectedUser.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Balance:</span>
              <span className="font-bold text-amber-300 font-mono">₹{selectedUser.balance}</span>
            </div>
            {currentUser && selectedUser.balance < 100 && onOpenAddMoneyModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddMoneyModal();
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold transition"
              >
                + Add Money (UPI)
              </button>
            )}
          </div>
        </div>

        {/* Opposing Team Anti-Hedging Alert */}
        {!isStageBet && alreadyBetTeam && (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start space-x-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Single-Team Rule Active for Match #{target.match.matchNumber}</p>
              <p className="text-amber-200/80 mt-0.5 leading-relaxed">
                You already backed <strong>{alreadyBetTeam.name}</strong>. As per tournament rules, players cannot bet on both teams in the same match. You can only increase your stake on {alreadyBetTeam.name}.
              </p>
            </div>
          </div>
        )}

        {/* Team Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Select Winning Team:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {eligibleTeamIds.map(teamId => {
              const team = getTeamById(teamId);
              if (!team) return null;
              const odds = pool.teamOdds[teamId] || '2.00';
              const isSelected = selectedTeamId === teamId;
              const isBlocked = !isStageBet && alreadyBetTeamId && teamId !== alreadyBetTeamId;

              return (
                <button
                  key={teamId}
                  type="button"
                  disabled={isBlocked}
                  onClick={() => setSelectedTeamId(teamId)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2.5 relative ${isBlocked
                    ? 'bg-rose-950/20 border-rose-900/40 opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-sm shadow-amber-500/10'
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.16]'
                    }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: team.primaryColor }} />
                      <span className="text-xs font-semibold text-slate-100 leading-tight">{team.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 pl-3.5 block mt-0.5">
                      {isBlocked ? 'Opposing Team (Blocked)' : `Pool: ₹${pool.teamBets[teamId] || 0}`}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-black text-amber-400 font-mono block">
                      {odds}x
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">Odds</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stake Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Bet Amount (₹):
            </label>
            <span className="text-xs text-slate-400">
              Min: ₹20 • Max: ₹{selectedUser.balance}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="20"
              step="1"
              max={selectedUser.balance || undefined}
              value={betAmount}
              onKeyDown={handleBetAmountKeyDown}
              onChange={handleBetAmountChange}
              className={`w-full bg-slate-950 border rounded-2xl pl-8 pr-4 py-2.5 sm:py-3 text-base font-bold text-amber-300 font-mono focus:outline-none transition ${isBelowMin || isExceedingBalance
                ? 'border-rose-500/70 focus:border-rose-400'
                : 'border-slate-800 focus:border-amber-500'
                }`}
              placeholder="Min ₹20"
            />
          </div>

          {isBelowMin && (
            <p className="text-[11px] text-rose-400 mt-1.5 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Minimum bet amount is ₹20.</span>
            </p>
          )}
          {!isBelowMin && isExceedingBalance && (
            <p className="text-[11px] text-rose-400 mt-1.5 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Amount exceeds your available balance (₹{selectedUser.balance}).</span>
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setBetAmount(String(amt))}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold font-mono border transition ${numAmount === amt
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  }`}
              >
                +₹{amt}
              </button>
            ))}
            {selectedUser.balance > 0 && (
              <button
                type="button"
                onClick={() => setBetAmount(String(selectedUser.balance))}
                className="px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition"
              >
                Max All-in
              </button>
            )}
          </div>
        </div>

        {/* Return Projection Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/20 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Selected Selection:</span>
            <span className="font-bold text-slate-200">{selectedTeam?.name || 'None'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Multiplier / Odds:</span>
            <span className="font-mono font-bold text-amber-400">{selectedOdds.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Estimated Net Profit:</span>
            <span className="font-mono font-bold text-emerald-400">+₹{potentialProfit}</span>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
              Estimated Total Return:
            </span>
            <span className="text-lg font-black text-amber-300 font-mono">
              ₹{potentialPayout}
            </span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${statusMessage.type === 'success'
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
            : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </form>

      {/* Sticky Footer */}
      <div className="px-4 sm:px-5 py-3 bg-[#0a0f18] border-t border-white/[0.07] flex-shrink-0">
        <button
          type="submit"
          form="bet-form"
          disabled={isSubmitDisabled}
          className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 shadow-lg ${isSubmitDisabled
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-500/20 active:scale-[0.98]'
            }`}
        >
          <Trophy className="w-4 h-4" />
          <span>
            {!currentUser
              ? 'Login Required to Bet'
              : !globalBettingOpen
                ? 'Betting Stopped by Admin'
                : isStageBet && !teamBettingOpen
                  ? 'Team Betting Stopped'
                  : isOpposingTeamBlocked
                    ? 'Opposing Team Bet Prohibited'
                    : submitting
                      ? 'Placing Bet...'
                      : numAmount < 20
                        ? 'Minimum Bet is ₹20'
                        : `Confirm Bet (₹${numAmount})`}
          </span>
        </button>
      </div>
    </Modal>
  );
};
