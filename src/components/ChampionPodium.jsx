import { useEffect } from 'react';
import { useTournament } from '../context/useTournament';
import { Trophy, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ChampionPodium = ({ onSelectTeam }) => {
  const { qualifiedTeamIds, getTeamById, bets, currentStage, resetAllData } = useTournament();

  const championId = qualifiedTeamIds.championId;
  const championTeam = getTeamById(championId);

  useEffect(() => {
    if (currentStage === 'completed' && championTeam) {
      try {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          confetti({
            particleCount: 40,
            spread: 90,
            origin: { y: 0.6 }
          });
        }, 350);

        return () => clearInterval(interval);
      } catch {
        // ignore
      }
    }
  }, [currentStage, championTeam]);

  if (currentStage !== 'completed' || !championTeam) return null;

  const championBets = bets.filter(b => b.teamId === championId && b.status === 'won');
  const totalPaidOut = championBets.reduce((sum, b) => sum + Number(b.payout), 0);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-2xl p-6 sm:p-10 text-center animate-in zoom-in-95 duration-500 mb-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 p-0.5 shadow-2xl shadow-amber-500/40 animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
            APL 2026 TOURNAMENT CHAMPIONS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 tracking-tight">
            {championTeam.name}
          </h2>
          <p className="text-sm text-slate-300 font-medium">
            Led to Glory by Captain <strong className="text-amber-300">{championTeam.captain}</strong> • {championTeam.tagline}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30">
            <span className="text-[11px] text-slate-400 block">Total Squad</span>
            <span className="text-lg font-bold text-white">{championTeam.players.length} Players</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30">
            <span className="text-[11px] text-amber-400 block font-semibold">Total Pot Distributed</span>
            <span className="text-lg font-black text-amber-300 font-mono">₹{totalPaidOut}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-emerald-400 block font-semibold">Winning Bettors</span>
            <span className="text-lg font-bold text-emerald-300">{championBets.length} Winners</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onSelectTeam(championTeam)}
            className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-400/20"
          >
            View Champion Squad
          </button>
          <button
            onClick={() => {
              if (window.confirm('Reset tournament to start a new season?')) {
                resetAllData();
              }
            }}
            className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center space-x-1.5"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Tournament</span>
          </button>
        </div>
      </div>
    </div>
  );
};
