import { useTournament } from '../context/useTournament';
import { Users, Trophy, ChevronRight, Venus, Flame, Lock } from 'lucide-react';

export const TeamCard = ({ team, onSelectTeam, onQuickBet }) => {
  const { currentStage, qualifiedTeamIds, calculatePool, globalBettingOpen, teamBettingOpen } = useTournament();
  const isTeamBettingClosed = !globalBettingOpen || !teamBettingOpen;

  const isEliminated = 
    (currentStage === 'semi-final' && !qualifiedTeamIds['semi-final'].includes(team.id)) ||
    (currentStage === 'final' && !qualifiedTeamIds.final.includes(team.id));

  const isChampion = qualifiedTeamIds.championId === team.id;

  const femalePlayers = team.players.filter(p => p.isFemale);
  const femaleCount = femalePlayers.length;

  const eligibleTeams = currentStage === 'league' 
    ? ['acceleron-mavericks', 'acceleron-knight-riders', 'acceleron-strikers', 'acceleron-super-xi', 'acceleron-predator']
    : (currentStage === 'semi-final' ? qualifiedTeamIds['semi-final'] : qualifiedTeamIds.final);

  const pool = calculatePool('stage', currentStage, eligibleTeams);
  const teamBetAmount = pool.teamBets[team.id] || 0;
  const odds = pool.teamOdds[team.id] || '2.00';
  const percentage = pool.teamPercentages[team.id] || '0.0';

  return (
    <div 
      className={`relative group rounded-3xl overflow-hidden border transition-all duration-300 ${
        isChampion 
          ? 'bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-amber-500/60 shadow-2xl shadow-amber-500/20 scale-[1.02]' 
          : isEliminated
            ? 'bg-slate-900/40 border-slate-800/60 opacity-60 grayscale-[40%]'
            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/10'
      }`}
    >
      <div className={`h-28 w-full bg-gradient-to-r ${team.badgeBg} p-4 flex justify-between items-start relative overflow-hidden`}>
        <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-4 bottom-2 text-white/15 font-black text-4xl select-none uppercase tracking-widest font-mono">
          {team.shortName}
        </div>

        <div className="z-10 flex items-center space-x-2">
          <div className="px-2.5 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white font-extrabold text-sm tracking-wider">
            {team.shortName}
          </div>
          {isChampion && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-lg">
              <Trophy className="w-3.5 h-3.5" />
              <span>CHAMPION</span>
            </span>
          )}
          {isEliminated && (
            <span className="px-2 py-0.5 rounded-lg bg-rose-950/80 text-rose-300 font-semibold text-[11px] border border-rose-800/40">
              Eliminated
            </span>
          )}
        </div>

        <div className="z-10 flex items-center space-x-1 px-2 py-1 rounded-xl bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
          <Venus className="w-3.5 h-3.5 text-emerald-400" />
          <span>{femaleCount} Female</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-100 tracking-tight flex items-center justify-between">
            <span>{team.name}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5">
            <span className="text-slate-500">Captain:</span>
            <span className="font-semibold text-slate-200">{team.captain}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{team.tagline}</span>
          </p>
        </div>

        <div className="bg-slate-950/50 rounded-2xl p-3 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center space-x-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Squad ({team.players.length} Players)</span>
            </div>
            <button 
              onClick={() => onSelectTeam(team)}
              className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center space-x-0.5 transition"
            >
              <span>Full Roster</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {team.players.slice(0, 5).map((p) => (
              <span 
                key={p.id}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                  p.isCaptain
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : p.isFemale
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700/40'
                }`}
              >
                #{p.jerseyNumber} {p.name}
              </span>
            ))}
            {team.players.length > 5 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/40 text-slate-400 border border-slate-800">
                +{team.players.length - 5} more
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300 capitalize">{currentStage} Odds:</span>
            </div>
            <span className="text-base font-extrabold text-amber-400 font-mono">
              {odds}x
            </span>
          </div>

          <div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
              <div 
                className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, percentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Pool: <strong className="text-slate-200">₹{teamBetAmount}</strong> ({percentage}%)</span>
              <span className="text-slate-500">Pari-Mutuel</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onSelectTeam(team)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-bold border border-slate-700/80 transition flex items-center justify-center space-x-1"
          >
            <span>Team Details</span>
          </button>

          <button
            onClick={() => onQuickBet(team)}
            disabled={isEliminated || isTeamBettingClosed}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-lg ${
              isEliminated || isTeamBettingClosed
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/20 active:scale-[0.98]'
            }`}
          >
            {isTeamBettingClosed && !isEliminated ? <Lock className="w-3.5 h-3.5" /> : <Trophy className="w-3.5 h-3.5" />}
            <span>
              {isEliminated
                ? 'Eliminated'
                : !globalBettingOpen
                  ? 'Betting Stopped'
                  : !teamBettingOpen
                    ? 'Team Bet Stopped'
                    : 'Bet on Team'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
