import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import { X, ShieldCheck, Shirt, Star } from 'lucide-react';

export const TeamDetailModal = ({ team, onClose, onBetOnTeam }) => {
  const { currentStage, qualifiedTeamIds, calculatePool, teamStats, globalBettingOpen, teamBettingOpen } = useTournament();

  if (!team) return null;

  const isEliminated =
    (currentStage === 'semi-final' && !qualifiedTeamIds['semi-final'].includes(team.id)) ||
    (currentStage === 'final' && !qualifiedTeamIds.final.includes(team.id));
  const isTeamBettingClosed = isEliminated || !globalBettingOpen || !teamBettingOpen;

  const stats = teamStats[team.id] || { played: 0, won: 0, lost: 0, tied: 0, points: 0 };
  const femalePlayers = team.players.filter(p => p.isFemale);

  const eligibleTeams = currentStage === 'league' 
    ? ['acceleron-mavericks', 'acceleron-knight-riders', 'acceleron-strikers', 'acceleron-super-xi', 'acceleron-predator']
    : (currentStage === 'semi-final' ? qualifiedTeamIds['semi-final'] : qualifiedTeamIds.final);

  const pool = calculatePool('stage', currentStage, eligibleTeams);
  const odds = pool.teamOdds[team.id] || '2.00';
  const teamBetAmount = pool.teamBets[team.id] || 0;

  return (
    <Modal onClose={onClose} maxWidth="3xl">
      <div className={`px-5 py-4 pr-14 bg-gradient-to-r ${team.badgeBg} relative overflow-hidden flex-shrink-0`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition border border-white/15"
        >
          <X className="w-4 h-4" />
        </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white font-extrabold text-xs tracking-wider border border-white/20">
                  {team.shortName}
                </span>
                <span className="text-xs text-white/80 font-medium">
                  Official Squad • APL 2026
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {team.name}
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                Captain: <strong className="text-white font-semibold">{team.captain}</strong> • {team.tagline}
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center space-x-4">
              <div>
                <p className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Tournament Odds</p>
                <p className="text-2xl font-black text-amber-300 font-mono">{odds}x</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onBetOnTeam(team);
                }}
                disabled={isTeamBettingClosed}
                className={`py-2 px-4 rounded-xl font-black text-xs transition shadow-lg whitespace-nowrap ${
                  isTeamBettingClosed
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isEliminated
                  ? 'Eliminated'
                  : !globalBettingOpen
                    ? 'Betting Stopped'
                    : !teamBettingOpen
                      ? 'Team Bet Stopped'
                      : 'Bet on Team'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 text-center text-xs flex-shrink-0">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Players</span>
            <span className="text-base font-bold text-slate-100">{team.players.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-emerald-400 block text-[11px] font-semibold">Female Rule</span>
            <span className="text-base font-bold text-emerald-300">{femalePlayers.length} Players (Compliant)</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Matches Won</span>
            <span className="text-base font-bold text-slate-100">{stats.won} / {stats.played}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-amber-400 block text-[11px] font-semibold">Stage Bets Pool</span>
            <span className="text-base font-bold text-amber-300 font-mono">₹{teamBetAmount}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Shirt className="w-4 h-4 text-indigo-400" />
                <span>Playing Squad & Jersey Specifications</span>
              </h4>
              <span className="text-xs text-slate-400">
                APL Verified Roster
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4"># No</th>
                    <th className="py-3 px-4">Player Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Jersey Size</th>
                    <th className="py-3 px-4 text-right">Special Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {team.players.map((player, idx) => (
                    <tr 
                      key={player.id || idx} 
                      className={`hover:bg-slate-800/40 transition ${
                        player.isCaptain ? 'bg-amber-500/5' : player.isFemale ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        #{player.jerseyNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100 flex items-center space-x-2">
                        <span>{player.name}</span>
                        {player.isCaptain && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            Captain (C)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {player.role || 'Player'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700/60">
                          {player.jerseySize}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {player.isFemale ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                            <Star className="w-3 h-3 text-rose-400 fill-rose-400" />
                            <span>Mandatory Female</span>
                          </span>
                        ) : player.isCaptain ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                            <span>Team Leader</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Regular</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-200 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-300">Mandatory Female Participation Notice</p>
              <p className="text-indigo-200/80 mt-1 leading-relaxed">
                As per official APL 2026 rules, this team features {femalePlayers.length} female players ({femalePlayers.map(p => p.name).join(', ')}). 
                At least 1 over of female bowling and 1 over of female batting are mandatory in every match.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBetOnTeam(team);
            }}
            disabled={isTeamBettingClosed}
            className={`py-2 px-5 sm:px-6 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg ${
              !isTeamBettingClosed
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-rose-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>
              {isEliminated
                ? 'Team Eliminated'
                : !globalBettingOpen
                  ? 'All Betting Stopped'
                  : !teamBettingOpen
                    ? 'Team Betting Stopped'
                    : `Place Bet on ${team.name}`}
            </span>
          </button>
        </div>
      </Modal>
  );
};
