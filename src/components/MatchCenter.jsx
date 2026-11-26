import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import { 
  Clock, 
  Calendar, 
  Lock, 
  Unlock, 
  Trophy, 
  Coins, 
  CheckCircle2, 
} from 'lucide-react';
import { RecordScoreModal } from './RecordScoreModal';

export const MatchCenter = ({ onOpenBetModal }) => {
  const { 
    matches, 
    getTeamById, 
    calculatePool, 
    isAdmin, 
    setMatchBettingOpen,
    globalBettingOpen
  } = useTournament();

  const [activeStageFilter, setActiveStageFilter] = useState('all');
  const [selectedMatchForScore, setSelectedMatchForScore] = useState(null);

  const filteredMatches = matches.filter(m => {
    if (activeStageFilter === 'all') return true;
    return m.stage === activeStageFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>APL 2026 Match Center & Fixtures</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            6 Overs League & Semi-Finals • 10 Overs Grand Final • Live Dynamic Betting Pool
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Fixtures' },
            { id: 'league', label: 'League (5)' },
            { id: 'semi-final', label: 'Semi-Finals' },
            { id: 'final', label: 'Final (10 Ov)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveStageFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeStageFilter === f.id
                  ? 'bg-slate-800 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredMatches.map(match => {
          const team1 = getTeamById(match.team1Id);
          const team2 = getTeamById(match.team2Id);
          const isCompleted = match.status === 'completed';
          const isLocked = !match.bettingOpen || !globalBettingOpen;
          const isPendingQualification = !match.team1Id || !match.team2Id;

          const pool = (team1 && team2) 
            ? calculatePool('match', match.id, [match.team1Id, match.team2Id]) 
            : { totalPool: 0, teamBets: {}, teamPercentages: {}, teamOdds: {} };

          const odds1 = pool.teamOdds[match.team1Id] || '1.90';
          const odds2 = pool.teamOdds[match.team2Id] || '1.90';
          const pct1 = pool.teamPercentages[match.team1Id] || '50';
          const pct2 = pool.teamPercentages[match.team2Id] || '50';

          return (
            <div
              key={match.id}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isCompleted
                  ? 'bg-slate-900/50 border-slate-800/80'
                  : match.status === 'live'
                    ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/50 shadow-xl shadow-rose-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 uppercase tracking-wider text-[11px]">
                    {match.title || `Match ${match.matchNumber}`}
                  </span>
                  <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{match.time}</span>
                  </div>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-semibold">{match.overs} Overs Match</span>
                </div>

                <div className="flex items-center space-x-2">
                  {isCompleted ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  ) : match.status === 'live' ? (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold text-[11px] flex items-center space-x-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>LIVE NOW</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-[11px]">
                      Scheduled
                    </span>
                  )}

                  {!isCompleted && !isPendingQualification && (
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center space-x-1 ${
                      isLocked 
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    }`}>
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
                      <span>{isLocked ? 'Betting Locked' : 'Betting Open'}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  <div className="lg:col-span-7">
                    {isPendingQualification ? (
                      <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs">
                        <p className="font-semibold text-slate-300">Teams to be determined after earlier stage completion</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {match.stage === 'semi-final' ? 'Top 4 teams from League stage qualify' : 'Winners of SF 1 and SF 2 advance to Final'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                          match.result?.winnerId === match.team1Id
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${team1?.badgeBg} flex items-center justify-center text-white font-extrabold text-xs shadow-md`}>
                              {team1?.shortName}
                            </div>
                            <div>
                              <p className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-2">
                                <span>{team1?.name}</span>
                                {match.result?.winnerId === match.team1Id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                    WINNER
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">Capt. {team1?.captain}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            {isCompleted ? (
                              <span className="text-base sm:text-lg font-black text-slate-100 font-mono">
                                {match.result?.team1Score || 'N/A'}
                              </span>
                            ) : (
                              <div className="text-right">
                                <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono block">
                                  {odds1}x
                                </span>
                                <span className="text-[10px] text-slate-500">Odds</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-center -my-2 relative z-10">
                          <span className="px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            VS
                          </span>
                        </div>

                        <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                          match.result?.winnerId === match.team2Id
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${team2?.badgeBg} flex items-center justify-center text-white font-extrabold text-xs shadow-md`}>
                              {team2?.shortName}
                            </div>
                            <div>
                              <p className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-2">
                                <span>{team2?.name}</span>
                                {match.result?.winnerId === match.team2Id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                    WINNER
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">Capt. {team2?.captain}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            {isCompleted ? (
                              <span className="text-base sm:text-lg font-black text-slate-100 font-mono">
                                {match.result?.team2Score || 'N/A'}
                              </span>
                            ) : (
                              <div className="text-right">
                                <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono block">
                                  {odds2}x
                                </span>
                                <span className="text-[10px] text-slate-500">Odds</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isCompleted && match.result?.notes && (
                          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 font-medium flex items-center space-x-2">
                            <Trophy className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{match.result.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    {!isPendingQualification && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>Match Betting Pool:</span>
                          </span>
                          <span className="font-bold text-amber-300 font-mono text-sm">
                            ₹{pool.totalPool}
                          </span>
                        </div>

                        <div>
                          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                            <div 
                              className="bg-indigo-500 h-full transition-all duration-500"
                              style={{ width: `${pct1}%` }}
                              title={`${team1?.shortName}: ${pct1}%`}
                            />
                            <div 
                              className="bg-amber-500 h-full transition-all duration-500"
                              style={{ width: `${pct2}%` }}
                              title={`${team2?.shortName}: ${pct2}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                            <span>{team1?.shortName}: {pct1}% (₹{pool.teamBets[match.team1Id] || 0})</span>
                            <span>{team2?.shortName}: {pct2}% (₹{pool.teamBets[match.team2Id] || 0})</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isCompleted && !isPendingQualification && (
                      <button
                        onClick={() => onOpenBetModal({ type: 'match', match })}
                        disabled={isLocked}
                        className={`w-full py-3 px-4 rounded-xl font-black text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                          isLocked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-rose-500/20 active:scale-98'
                        }`}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>{isLocked ? 'Betting Locked For This Match' : 'Place Match Bet'}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="text-center py-2 text-xs text-slate-400 font-medium">
                        Match completed • All winning bets settled & paid
                      </div>
                    )}

                    {isAdmin && !isPendingQualification && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold uppercase tracking-wider">
                          <span>Admin Control</span>
                          <span>(Match #{match.matchNumber})</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setMatchBettingOpen(match.id, !match.bettingOpen)}
                            disabled={isCompleted}
                            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 border ${
                              match.bettingOpen
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            }`}
                          >
                            {match.bettingOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{match.bettingOpen ? 'Lock Bet' : 'Unlock Bet'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedMatchForScore(match)}
                            className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center space-x-1 shadow-sm"
                          >
                            <span>{isCompleted ? 'Edit Result' : 'Enter Result'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMatchForScore && (
        <RecordScoreModal
          match={selectedMatchForScore}
          onClose={() => setSelectedMatchForScore(null)}
        />
      )}
    </div>
  );
};
