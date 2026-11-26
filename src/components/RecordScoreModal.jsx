import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import { X, Trophy } from 'lucide-react';

export const RecordScoreModal = ({ match, onClose }) => {
  const { recordMatchResult, getTeamById } = useTournament();

  const team1 = getTeamById(match.team1Id);
  const team2 = getTeamById(match.team2Id);

  const [winnerId, setWinnerId] = useState(match.team1Id);
  const [isTie, setIsTie] = useState(false);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    recordMatchResult({
      matchId: match.id,
      winnerId: isTie ? null : winnerId,
      isTie,
      team1Score: team1Score || '0/0',
      team2Score: team2Score || '0/0',
      notes: notes || (isTie ? 'Match Tied (Bets Refunded)' : `${getTeamById(winnerId)?.name} won`)
    });
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="md">
      {/* Sticky Header */}
      <div className="px-5 py-3.5 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] font-semibold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          <span>Admin Match Result</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
          Match {match.matchNumber}: {team1?.name} vs {team2?.name}
        </h3>
        <p className="text-[11px] text-slate-400">
          Settles active bets and updates the Points Table
        </p>
      </div>

      {/* Scrollable Body */}
      <form id="record-score-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Select Match Outcome:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setIsTie(false); setWinnerId(match.team1Id); }}
              className={`p-3 rounded-2xl border text-center transition font-bold text-xs ${
                !isTie && winnerId === match.team1Id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {team1?.name} Won
            </button>

            <button
              type="button"
              onClick={() => { setIsTie(false); setWinnerId(match.team2Id); }}
              className={`p-3 rounded-2xl border text-center transition font-bold text-xs ${
                !isTie && winnerId === match.team2Id
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {team2?.name} Won
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsTie(!isTie)}
            className={`w-full mt-2 py-2 px-3 rounded-xl border text-center text-xs font-semibold transition ${
              isTie
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            Match Tied / No Result (All bets refunded 100%)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {team1?.shortName} Score (e.g. 56/2)
            </label>
            <input
              type="text"
              placeholder="54/3 (6.0 ov)"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {team2?.shortName} Score (e.g. 48/5)
            </label>
            <input
              type="text"
              placeholder="48/5 (6.0 ov)"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Match Note / Summary
          </label>
          <input
            type="text"
            placeholder="e.g. Won by 6 runs in final over"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="p-4 sm:px-6 sm:py-4 bg-slate-950/90 border-t border-slate-800 flex-shrink-0">
        <button
          type="submit"
          form="record-score-form"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
        >
          Confirm Result & Distribute Winnings
        </button>
      </div>
    </Modal>
  );
};
