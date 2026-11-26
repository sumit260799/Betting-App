import { useTournament } from '../context/useTournament';
import { TEAMS } from '../data/tournamentData';
import { Trophy, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';

export const PointsTable = ({ onSelectTeam, onOpenRules }) => {
  const { teamStats, currentStage, qualifiedTeamIds } = useTournament();

  const sortedTeams = [...TEAMS].sort((a, b) => {
    const statsA = teamStats[a.id] || { points: 0, won: 0 };
    const statsB = teamStats[b.id] || { points: 0, won: 0 };

    if (statsB.points !== statsA.points) {
      return statsB.points - statsA.points;
    }
    return statsB.won - statsA.won;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>APL 2026 Official Standings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Win: 2 pts • Tie/No Result: 1 pt • Top 4 Teams Qualify for Semi-Finals
          </p>
        </div>

        <button
          onClick={onOpenRules}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Tiebreaker Rules</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px] sm:text-xs tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 sm:px-6">Pos</th>
                <th className="py-4 px-4 sm:px-6">Team</th>
                <th className="py-4 px-3 text-center">P</th>
                <th className="py-4 px-3 text-center">W</th>
                <th className="py-4 px-3 text-center">L</th>
                <th className="py-4 px-3 text-center">T</th>
                <th className="py-4 px-4 text-center font-black text-amber-400">Pts</th>
                <th className="py-4 px-4 sm:px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedTeams.map((team, index) => {
                const stats = teamStats[team.id] || { played: 0, won: 0, lost: 0, tied: 0, points: 0 };
                const isTop4 = index < 4;
                const isQualifiedSF = currentStage !== 'league' && qualifiedTeamIds['semi-final'].includes(team.id);

                return (
                  <tr 
                    key={team.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isTop4 ? 'bg-indigo-950/10' : ''
                    }`}
                  >
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-400 font-mono">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black ${
                        index === 0 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                          : index < 4 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6">
                      <button
                        onClick={() => onSelectTeam(team)}
                        className="flex items-center space-x-3 text-left group"
                      >
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${team.badgeBg} flex items-center justify-center text-white font-black text-xs shadow-md`}>
                          {team.shortName}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 group-hover:text-amber-400 transition text-xs sm:text-sm">
                            {team.name}
                          </p>
                          <p className="text-[11px] text-slate-400">Capt. {team.captain}</p>
                        </div>
                      </button>
                    </td>

                    <td className="py-4 px-3 text-center text-slate-300 font-mono font-medium">{stats.played}</td>
                    <td className="py-4 px-3 text-center text-emerald-400 font-mono font-bold">{stats.won}</td>
                    <td className="py-4 px-3 text-center text-rose-400 font-mono">{stats.lost}</td>
                    <td className="py-4 px-3 text-center text-slate-400 font-mono">{stats.tied}</td>
                    <td className="py-4 px-4 text-center font-mono font-black text-amber-300 text-base">
                      {stats.points}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      {currentStage === 'completed' && qualifiedTeamIds.championId === team.id ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>CHAMPION</span>
                        </span>
                      ) : isQualifiedSF || (currentStage === 'league' && isTop4) ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Top 4 (SF Zone)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-medium">
                          Elimination Zone
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Top 4 Teams qualify for Semi-Finals (decided by lottery/points tiebreaker)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>All 5 teams verified compliant with 2+ female players rule</span>
          </div>
        </div>
      </div>
    </div>
  );
};
