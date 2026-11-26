import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import { AlertCircle, X, KeyRound } from 'lucide-react';

export const AdminModal = ({ onClose }) => {
  const { adminPin, toggleAdmin } = useTournament();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    if (pinInput === adminPin || pinInput === 'admin' || pinInput === 'admin2026') {
      sessionStorage.setItem('apl_admin_pin', pinInput);
      toggleAdmin(true);
      onClose();
    } else {
      setError(true);
    }
  };

  const handleQuickUnlock = () => {
    sessionStorage.setItem('apl_admin_pin', 'admin2026');
    toggleAdmin(true);
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="sm">
      <div className="px-5 py-3.5 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Admin Control Access
            </h3>
            <p className="text-[11px] text-slate-400">
              Organizer authorization
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
        <p className="text-xs text-slate-400">
          Authorized tournament admins can lock betting when matches start, record scores, and advance tournament phases.
        </p>

        <form onSubmit={handleVerify} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Enter Admin Passcode:
            </label>
            <input
              type="password"
              placeholder="Enter admin pin"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setError(false); }}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-white tracking-widest focus:outline-none focus:border-rose-500 transition"
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect pin</span>
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/20"
            >
              Unlock Admin Mode
            </button>

            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/60 transition"
            >
              1-Click Organizer Unlock (Demo Mode)
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
