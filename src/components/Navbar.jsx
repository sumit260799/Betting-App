import { useState, useEffect, useRef } from 'react';
import { useTournament } from '../context/useTournament';
import { 
  Coins, 
  Lock, 
  Unlock, 
  Plus,
  HelpCircle,
  User,
  LogOut,
  Mail,
  ChevronDown,
  ArrowUpRight
} from 'lucide-react';

const NAV_TABS = [
  { id: 'teams', label: 'Teams (5)' },
  { id: 'matches', label: 'Matches' },
  { id: 'points', label: 'Standings' },
  { id: 'my-bets', label: 'My Bets' },
];

const STAGE_LABELS = {
  league: 'League',
  'semi-final': 'Semi-Finals',
  final: 'Grand Final',
  completed: 'Completed',
};

export const Navbar = ({ activeTab, setActiveTab, onOpenRules, onOpenAdminModal, onOpenLoginModal, onOpenAddMoneyModal, onOpenWithdrawModal }) => {
  const { 
    currentUser,
    isAdmin, 
    toggleAdmin, 
    globalBettingOpen,
    teamBettingOpen,
    currentStage,
    logout
  } = useTournament();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!showUserDropdown) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showUserDropdown]);

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Single-Row Sleek Header */}
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Brand + Live Stage */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-white/95 p-0.5 flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                <img
                  src="/company.png"
                  alt="APL 2026"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-100 group-hover:text-amber-300 transition whitespace-nowrap">
                  APL 2026
                </span>
                <span className="hidden xl:inline text-[11px] font-medium text-slate-500 whitespace-nowrap">
                  {STAGE_LABELS[currentStage] || 'League'}
                </span>
              </div>
            </button>

            <span
              title={
                !globalBettingOpen
                  ? 'All Betting Stopped'
                  : !teamBettingOpen
                    ? 'Team Betting Stopped • Match Betting Open'
                    : 'Betting Open'
              }
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                !globalBettingOpen
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : !teamBettingOpen
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !globalBettingOpen
                    ? 'bg-rose-400'
                    : !teamBettingOpen
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span>
                {!globalBettingOpen ? 'Locked' : !teamBettingOpen ? 'Matches Only' : 'Live'}
              </span>
            </span>
          </div>

          {/* Center Segmented Nav (Desktop) */}
          <nav aria-label="Primary" className="hidden lg:flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenRules}
              title="Match Rules"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-white/[0.04] transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Rules</span>
            </button>

            {currentUser ? (
              <>
                {/* Wallet Pill */}
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg pl-2.5 pr-1 py-1 gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    ₹{currentUser.balance}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenAddMoneyModal}
                    title="Add Money via UPI QR"
                    className="px-1.5 py-0.5 rounded-md flex items-center gap-0.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

                {/* Withdraw CTA */}
                <button
                  type="button"
                  onClick={onOpenWithdrawModal}
                  title="Withdraw Wallet Points"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Withdraw</span>
                </button>

                {/* User Menu Pill */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown(prev => !prev)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition text-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 text-[11px] font-bold flex-shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[90px] sm:max-w-[140px] truncate font-medium text-slate-200">
                      {currentUser.name}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] glass-dropdown rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 border border-white/[0.1]">
                      <div className="px-3 py-2 border-b border-white/[0.07] text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Active Session</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase">{currentUser.role || 'player'}</span>
                        </div>
                        <p className="font-semibold text-slate-100 text-sm truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>

                      <div className="pt-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenAddMoneyModal();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Money (UPI)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenWithdrawModal();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 transition"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Withdraw Balance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenLoginModal();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
                        >
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Switch Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-rose-300 hover:bg-rose-500/10 transition"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  title="Logout"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-semibold shadow-sm shadow-amber-500/20 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>OTP Login</span>
              </button>
            )}

            {/* Subtle Admin Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  toggleAdmin(false);
                } else {
                  onOpenAdminModal();
                }
              }}
              title={isAdmin ? 'Disable Admin Mode' : 'Admin Access'}
              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                isAdmin 
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-transparent text-slate-400 border-white/[0.08] hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {isAdmin ? <Unlock className="w-3.5 h-3.5 text-rose-400" /> : <Lock className="w-3.5 h-3.5" />}
              {isAdmin && <span className="hidden sm:inline">Admin</span>}
            </button>
          </div>
        </div>

        {/* Slim Secondary Nav Strip on Mobile/Tablet (< lg) */}
        <div className="flex lg:hidden items-center justify-between gap-2 border-t border-white/[0.05] py-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/[0.1] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-400 hover:bg-white/[0.05] flex-shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
};
