import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import {
  Trophy,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowUpRight,
  Plus,
} from 'lucide-react';

export const MyBets = ({ onGoToMatches, onOpenAddMoneyModal, onOpenWithdrawModal }) => {
  const { bets, currentUser, selectedUser, getTeamById, matches } = useTournament();

  const [filter, setFilter] = useState('all');

  const userBets = bets.filter(b => b.userName === selectedUser.name || b.userId === selectedUser.id);

  const filtered = userBets.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const totalWagered = userBets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalPayout = userBets.reduce((sum, b) => sum + Number(b.payout || 0), 0);
  const activeWagered = userBets.filter(b => b.status === 'active').reduce((sum, b) => sum + Number(b.amount), 0);
  const netProfit = totalPayout - (totalWagered - activeWagered);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center space-x-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>{selectedUser.name}'s Betting Portfolio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Live tracking of all your tournament & match predictions
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            {['all', 'active', 'won', 'lost'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${filter === f
                    ? 'bg-slate-800 text-amber-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {f} ({userBets.filter(b => f === 'all' ? true : b.status === f).length})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400 font-medium">Available Balance</span>
              <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
                ₹{selectedUser.balance}
              </p>
            </div>
            {currentUser && (
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {onOpenAddMoneyModal && (
                  <button
                    type="button"
                    onClick={onOpenAddMoneyModal}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
                {onOpenWithdrawModal && (
                  <button
                    type="button"
                    onClick={onOpenWithdrawModal}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Withdraw</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total Wagered</span>
            <p className="text-xl sm:text-2xl font-black text-slate-200 font-mono mt-1">
              ₹{totalWagered}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total Winnings Paid</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              ₹{totalPayout}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Net Return / PnL</span>
            <p className={`text-xl sm:text-2xl font-black font-mono mt-1 flex items-center space-x-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              <span>{netProfit >= 0 ? `+₹${netProfit}` : `-₹${Math.abs(netProfit)}`}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Bets Found in this category</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't placed any {filter !== 'all' ? filter : ''} bets yet. Back your favorite team in the match center!
            </p>
            <button
              onClick={onGoToMatches}
              className="mt-2 py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              Browse Matches & Place Bet
            </button>
          </div>
        ) : (
          filtered.map(bet => {
            const team = getTeamById(bet.teamId);
            const isMatch = bet.type === 'match';
            const matchObj = isMatch ? matches.find(m => m.id === bet.targetId) : null;

            return (
              <div
                key={bet.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${team?.badgeBg || 'from-slate-700 to-slate-900'} flex items-center justify-center text-white font-black text-xs shadow-md flex-shrink-0 mt-0.5`}>
                    {team?.shortName || 'APL'}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {isMatch ? `Match #${matchObj?.matchNumber || 'Match'}` : `${bet.stage.toUpperCase()} WINNER`}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        {new Date(bet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-100 mt-0.5">
                      Backed: <span className="text-white">{team?.name}</span>
                    </h4>

                    {isMatch && matchObj && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Fixture: {getTeamById(matchObj.team1Id)?.shortName} vs {getTeamById(matchObj.team2Id)?.shortName} ({matchObj.time})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block">Stake</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">₹{bet.amount}</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block">Odds</span>
                    <span className="text-sm font-extrabold text-amber-400 font-mono">{bet.odds}x</span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block">
                      {bet.status === 'won' ? 'Won Payout' : bet.status === 'lost' ? 'Payout' : 'Potential Return'}
                    </span>
                    <span className={`text-sm sm:text-base font-black font-mono ${bet.status === 'won'
                        ? 'text-emerald-400'
                        : bet.status === 'lost'
                          ? 'text-slate-500 line-through'
                          : 'text-amber-300'
                      }`}>
                      ₹{bet.status === 'won' ? bet.payout : Math.round(bet.amount * bet.odds)}
                    </span>
                  </div>

                  <div>
                    {bet.status === 'active' && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                        <span>Active</span>
                      </span>
                    )}
                    {bet.status === 'won' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>WON (+₹{bet.payout - bet.amount})</span>
                      </span>
                    )}
                    {bet.status === 'lost' && (
                      <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>Lost</span>
                      </span>
                    )}
                    {bet.status === 'refunded' && (
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1">
                        <RotateCcw className="w-3 h-3" />
                        <span>Refunded</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
