import { TOURNAMENT_RULES } from '../data/tournamentData';
import { Modal } from './Modal';
import { X, BookOpen, ShieldAlert, Clock, Coins } from 'lucide-react';

export const RulesSection = ({ onClose }) => {
  return (
    <Modal onClose={onClose} maxWidth="3xl">
      <div className="px-5 py-4 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Official Tournament Rulebook</span>
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-white mt-0.5">
          APL (2026) Match Schedule & Playing Rules
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Acceleron Premier League Guidelines • Strict adherence required by all teams
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5 mb-3">
            <Clock className="w-4 h-4" />
            <span>Tournament Timeline (Single Day Championship)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Match 1 (Strikers vs Super XI):</span>
              <span className="font-bold text-slate-200 font-mono">1:25 PM – 2:10 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Match 2 (Mavericks vs Predator):</span>
              <span className="font-bold text-slate-200 font-mono">2:15 PM – 3:00 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Match 3 (Knight Riders vs Strikers):</span>
              <span className="font-bold text-slate-200 font-mono">3:00 PM – 3:45 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Match 4 (Super XI vs Mavericks):</span>
              <span className="font-bold text-slate-200 font-mono">3:45 PM – 4:30 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Match 5 (Predator vs Knight Riders):</span>
              <span className="font-bold text-slate-200 font-mono">4:30 PM – 5:15 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex justify-between text-indigo-300">
              <span className="font-bold">Points Table & SF Lottery:</span>
              <span className="font-mono font-bold">5:15 PM – 5:30 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Semi-Final 1:</span>
              <span className="font-bold text-slate-200 font-mono">5:45 PM – 6:30 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Semi-Final 2:</span>
              <span className="font-bold text-slate-200 font-mono">6:35 PM – 7:20 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between text-amber-300 sm:col-span-2">
              <span className="font-extrabold">Grand Final (10 Overs):</span>
              <span className="font-mono font-bold">7:25 PM – 9:30 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between text-emerald-300 sm:col-span-2">
              <span className="font-extrabold">Prize Distribution Ceremony:</span>
              <span className="font-mono font-bold">9:30 PM – 10:00 PM</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {TOURNAMENT_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{rule.title}</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                  {rule.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-4">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-emerald-950/25 border border-emerald-500/25 rounded-2xl p-4 text-xs text-emerald-100 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-emerald-300">
            <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Wallet &amp; UPI Payment Rules</span>
          </div>
          <ul className="text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
            <li><strong>Real Credits Only (₹1 = 1 Point):</strong> There are no free credits. Only verified UPI deposits are credited to your wallet.</li>
            <li><strong>Adding Money:</strong> Scan the Organizer UPI QR or pay to the UPI ID, submit your UTR/Transaction ID, and Admin verifies &amp; credits your balance.</li>
            <li><strong>Betting:</strong> Minimum bet is ₹20 with 0% betting fee. Players cannot bet on both teams in the same match.</li>
            <li><strong>Withdrawals:</strong> Request cash-out anytime via UPI, Cash, or Bank Transfer.</li>
          </ul>
        </div>

        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-300">Code of Conduct & Punctuality</p>
            <p className="text-rose-200/80 mt-1 leading-relaxed">
              Abusive language, misconduct, and arguments with officials will not be tolerated. Umpire's decision is final.
              All teams must report at least 15 minutes prior to their scheduled match. Official team jerseys are mandatory.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
        >
          I Understand the Rules
        </button>
      </div>
    </Modal>
  );
};
