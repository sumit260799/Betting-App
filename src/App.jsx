import { useState, useEffect } from 'react';
import { TournamentProvider } from './context/TournamentContext';
import { useTournament } from './context/useTournament';
import { TEAMS } from './data/tournamentData';
import { Navbar } from './components/Navbar';
import { TeamCard } from './components/TeamCard';
import { TeamDetailModal } from './components/TeamDetailModal';
import { MatchCenter } from './components/MatchCenter';
import { PointsTable } from './components/PointsTable';
import { MyBets } from './components/MyBets';
import { BettingModal } from './components/BettingModal';
import { RulesSection } from './components/RulesSection';
import { AdminModal } from './components/AdminModal';
import { AdminPanel } from './components/AdminPanel';
import { ChampionPodium } from './components/ChampionPodium';
import { LoginModal } from './components/LoginModal';
import { AddMoneyModal } from './components/AddMoneyModal';
import { WithdrawModal } from './components/WithdrawModal';
import {
  Trophy,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';

function TournamentApp() {
  const {
    currentStage,
    qualifiedTeamIds,
    globalBettingOpen,
    teamBettingOpen,
    calculatePool,
  } = useTournament();

  const canBetOnTeams = globalBettingOpen && teamBettingOpen;

  const [activeTab, setActiveTab] = useState('teams');
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState(null);
  const [betModalTarget, setBetModalTarget] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [welcomeToastUser, setWelcomeToastUser] = useState(null);

  useEffect(() => {
    if (!welcomeToastUser) return;
    const id = setTimeout(() => setWelcomeToastUser(null), 3000);
    return () => clearTimeout(id);
  }, [welcomeToastUser]);

  const eligibleStageTeamIds = currentStage === 'league'
    ? TEAMS.map(t => t.id)
    : (currentStage === 'semi-final' ? qualifiedTeamIds['semi-final'] : qualifiedTeamIds.final);

  const stagePool = calculatePool('stage', currentStage, eligibleStageTeamIds);

  const handleQuickBetOnTeam = (team) => {
    setBetModalTarget({
      type: 'stage',
      stage: currentStage,
      defaultTeamId: team.id
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900">

      {/* Persistent Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenAddMoneyModal={() => setShowAddMoneyModal(true)}
        onOpenWithdrawModal={() => setShowWithdrawModal(true)}
      />

      {/* Admin Panel Banner (when admin mode is ON) */}
      <AdminPanel />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Champion Podium (if completed) */}
        {currentStage === 'completed' && (
          <ChampionPodium onSelectTeam={(t) => setSelectedTeamForDetail(t)} />
        )}

        {/* Dynamic Tournament Stage Header Card */}
        {currentStage !== 'completed' && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -top-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>APL 2026 Season</span>
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                    !globalBettingOpen
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : !teamBettingOpen
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}>
                    {canBetOnTeams ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>
                      {!globalBettingOpen
                        ? 'Betting Stopped by Admin'
                        : !teamBettingOpen
                          ? 'Team Betting Stopped • Matches Open'
                          : 'Betting Active'}
                    </span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {currentStage === 'league' && 'League Stage: 5 Contenders, 1 Champion'}
                  {currentStage === 'semi-final' && 'Semi-Finals: Top 4 Teams Battle for Glory'}
                  {currentStage === 'final' && 'Grand Final: 10 Overs Championship Clash'}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentStage === 'league' && 'Select any of the 5 teams or bet match-by-match. When matches begin, bets lock automatically. Pari-mutuel odds adjust with every stake!'}
                  {currentStage === 'semi-final' && '4 Teams qualified for the semi-finals! Place fresh bets on the 4 teams before the semi-final matches begin.'}
                  {currentStage === 'final' && 'The 2 finalist teams go head-to-head in a 10 overs grand finale! Pick your champion team now.'}
                </p>
              </div>

              {/* Quick Stage Pot & Betting Action */}
              <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 flex-shrink-0">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {currentStage.toUpperCase()} Total Pot
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-0.5">
                    ₹{stagePool.totalPool}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {stagePool.betsCount} active bets in this stage
                  </span>
                </div>

                <button
                  onClick={() => setBetModalTarget({ type: 'stage', stage: currentStage })}
                  disabled={!canBetOnTeams}
                  className={`py-3 px-5 rounded-xl font-black text-xs transition flex items-center justify-center space-x-2 shadow-lg ${canBetOnTeams
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow-amber-500/20 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>
                    {!globalBettingOpen
                      ? 'All Betting Stopped'
                      : !teamBettingOpen
                        ? 'Team Betting Stopped'
                        : currentStage === 'final'
                          ? 'Bet on Grand Final (2 Teams)'
                          : currentStage === 'semi-final'
                            ? 'Bet on Semi-Final (4 Teams)'
                            : 'Bet on Stage Winner'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Teams & Squads */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>All 5 Participating Teams</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on any team card to inspect real player rosters, jersey sizes, and roles
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Female Participation Rule: ≥ 2 Female Players / Team</span>
              </div>
            </div>

            {/* 5 Team Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAMS.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onSelectTeam={(t) => setSelectedTeamForDetail(t)}
                  onQuickBet={(t) => handleQuickBetOnTeam(t)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Match Center & Bets */}
        {activeTab === 'matches' && (
          <MatchCenter
            onOpenBetModal={(target) => setBetModalTarget(target)}
          />
        )}

        {/* Tab 3: Points Table */}
        {activeTab === 'points' && (
          <PointsTable
            onSelectTeam={(t) => setSelectedTeamForDetail(t)}
            onOpenRules={() => setShowRulesModal(true)}
          />
        )}

        {/* Tab 4: My Bets Portfolio */}
        {activeTab === 'my-bets' && (
          <MyBets
            onGoToMatches={() => setActiveTab('matches')}
            onOpenAddMoneyModal={() => setShowAddMoneyModal(true)}
            onOpenWithdrawModal={() => setShowWithdrawModal(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0f172a]/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-amber-400">APL 2026</span>
            <span>• Acceleron Premier League Betting Platform</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-amber-400 hover:underline font-medium"
            >
              Tournament Rules
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedTeamForDetail && (
        <TeamDetailModal
          team={selectedTeamForDetail}
          onClose={() => setSelectedTeamForDetail(null)}
          onBetOnTeam={(team) => handleQuickBetOnTeam(team)}
        />
      )}

      {betModalTarget && (
        <BettingModal
          target={betModalTarget}
          onClose={() => setBetModalTarget(null)}
          onOpenLoginModal={() => setShowLoginModal(true)}
          onOpenAddMoneyModal={() => setShowAddMoneyModal(true)}
        />
      )}

      {showRulesModal && (
        <RulesSection
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {showAdminModal && (
        <AdminModal
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(user) => setWelcomeToastUser(user)}
        />
      )}

      {welcomeToastUser && (
        <div className="fixed top-16 right-4 z-[90] max-w-xs bg-[#0f1623]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl px-4 py-3 shadow-2xl shadow-emerald-950/40 flex items-center space-x-3 animate-toast-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0 text-xs">
            <p className="font-bold text-white truncate">Signed in as {welcomeToastUser.name}</p>
            <p className="text-[11px] text-emerald-300 font-mono">Wallet: ₹{welcomeToastUser.balance ?? 0}</p>
          </div>
        </div>
      )}

      {showAddMoneyModal && (
        <AddMoneyModal
          onClose={() => setShowAddMoneyModal(false)}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <TournamentApp />
    </TournamentProvider>
  );
}
