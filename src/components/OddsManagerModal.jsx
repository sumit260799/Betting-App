import { useState, useMemo } from 'react';
import { useTournament } from '../context/useTournament';
import { TEAMS } from '../data/tournamentData';
import { Modal } from './Modal';
import { normalizeOddsConfig } from '../utils/oddsCalculator';
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
  Trophy,
  Calendar,
} from 'lucide-react';

export const OddsManagerModal = ({ onClose }) => {
  const {
    oddsConfig,
    updateOddsConfig,
    matches,
    getTeamById,
    calculatePool,
    currentStage,
  } = useTournament();

  const [activeTab, setActiveTab] = useState('engine'); // 'engine' | 'teams' | 'matches'
  const [draft, setDraft] = useState(() => ({
    mode: oddsConfig?.mode || 'dynamic',
    settlementMode: oddsConfig?.settlementMode || 'pool',
    minOdds: String(oddsConfig?.minOdds ?? 1.15),
    maxOdds: String(oddsConfig?.maxOdds ?? 5.0),
    zeroBetOdds: String(oddsConfig?.zeroBetOdds ?? 2.5),
    withdrawFeePct: String(oddsConfig?.withdrawFeePct ?? 10),
    stageOdds: { ...(oddsConfig?.stageOdds || {}) },
    matchOdds: Object.fromEntries(
      Object.entries(oddsConfig?.matchOdds || {}).map(([mId, map]) => [mId, { ...map }])
    ),
  }));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const stagePool = calculatePool(
    'stage',
    currentStage,
    TEAMS.map((t) => t.id)
  );

  const activeMatches = matches.filter((m) => m.team1Id && m.team2Id);

  const stageOverrideCount = useMemo(
    () => Object.values(draft.stageOdds).filter((v) => v !== '' && v !== null && v !== undefined).length,
    [draft.stageOdds]
  );

  const matchOverrideCount = useMemo(
    () =>
      Object.values(draft.matchOdds).reduce(
        (sum, teamMap) =>
          sum + Object.values(teamMap || {}).filter((v) => v !== '' && v !== null && v !== undefined).length,
        0
      ),
    [draft.matchOdds]
  );

  const handleStageOverrideChange = (teamId, val) => {
    setDraft((prev) => ({
      ...prev,
      stageOdds: {
        ...prev.stageOdds,
        [teamId]: val,
      },
    }));
  };

  const handleMatchOverrideChange = (matchId, teamId, val) => {
    setDraft((prev) => ({
      ...prev,
      matchOdds: {
        ...prev.matchOdds,
        [matchId]: {
          ...(prev.matchOdds[matchId] || {}),
          [teamId]: val,
        },
      },
    }));
  };

  const handleResetToDefaults = () => {
    setDraft({
      mode: 'dynamic',
      settlementMode: 'pool',
      minOdds: '1.15',
      maxOdds: '5.0',
      zeroBetOdds: '2.5',
      withdrawFeePct: '10',
      stageOdds: {},
      matchOdds: {},
    });
    setStatusMessage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const min = Number(draft.minOdds);
    const max = Number(draft.maxOdds);
    const zero = Number(draft.zeroBetOdds);
    const fee = Number(draft.withdrawFeePct);

    if (!Number.isFinite(min) || min < 1.01) {
      setActiveTab('engine');
      setStatusMessage({ type: 'error', text: 'Min multiplier must be at least 1.01x.' });
      return;
    }
    if (!Number.isFinite(max) || max < min) {
      setActiveTab('engine');
      setStatusMessage({ type: 'error', text: 'Max multiplier must be greater than or equal to Min.' });
      return;
    }
    if (!Number.isFinite(zero) || zero < min || zero > max) {
      setActiveTab('engine');
      setStatusMessage({ type: 'error', text: 'Default multiplier must be between Min and Max.' });
      return;
    }
    if (!Number.isFinite(fee) || fee < 0 || fee > 50) {
      setActiveTab('engine');
      setStatusMessage({ type: 'error', text: 'Withdraw platform fee must be between 0% and 50%.' });
      return;
    }

    const normalized = normalizeOddsConfig(draft);
    setSaving(true);
    setStatusMessage(null);
    const res = await updateOddsConfig(normalized);
    setSaving(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Return settings updated!' });
      setTimeout(() => onClose(), 650);
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to save return settings.' });
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="2xl">
      {/* Sleek Sticky Header */}
      <div className="px-5 py-3.5 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Admin Return &amp; Odds Engine</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
          Manage Multipliers &amp; Payout Calculation
        </h3>
        <p className="text-[11px] text-slate-400">
          Configure dynamic return bounds, payout settlement, and custom overrides.
        </p>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 mt-3 bg-slate-950/80 p-1 rounded-xl border border-white/[0.07] overflow-x-auto scrollbar-none">
          {[
            { id: 'engine', label: 'Rules & Bounds', icon: Sparkles },
            {
              id: 'teams',
              label: `Stage Teams (${TEAMS.length})`,
              badge: stageOverrideCount > 0 ? stageOverrideCount : null,
              icon: Trophy,
            },
            {
              id: 'matches',
              label: `Matches (${activeMatches.length})`,
              badge: matchOverrideCount > 0 ? matchOverrideCount : null,
              icon: Calendar,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-amber-400' : ''}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Body */}
      <form id="odds-manager-form" onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs">
        {activeTab === 'engine' && (
          <>
            {/* Mode & Settlement Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Odds Calculation Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/[0.06]">
                  {[
                    { id: 'dynamic', label: 'Dynamic (Pool)' },
                    { id: 'fixed', label: 'Admin Fixed' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          mode: opt.id,
                          settlementMode: opt.id === 'fixed' ? 'odds' : prev.settlementMode,
                        }))
                      }
                      className={`py-1.5 px-2 rounded-lg font-semibold transition ${draft.mode === opt.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {draft.mode === 'dynamic'
                    ? 'Automatically adjusts multipliers from pool ratio within your Min/Max bounds (unless overridden per team/match).'
                    : 'Uses your custom multipliers in the Stage Teams / Matches tabs (or Default multiplier when Auto).'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Winner Payout Settlement
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/[0.06]">
                  {[
                    { id: 'pool', label: 'Split Total Pool' },
                    { id: 'odds', label: 'Stake × Odds' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, settlementMode: opt.id }))}
                      className={`py-1.5 px-2 rounded-lg font-semibold transition ${draft.settlementMode === opt.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {draft.settlementMode === 'pool'
                    ? 'Winners split the total pot proportionally based on their stake.'
                    : 'Winners receive exact Stake × Locked Multiplier shown when placing the bet.'}
                </p>
              </div>
            </div>

            {/* Dynamic Bounds */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Multiplier Bounds &amp; Default</span>
                </span>
                <span className="text-[11px] text-slate-400">Caps extreme 7.5x+ spikes</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Min Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.01"
                    value={draft.minOdds}
                    onChange={(e) => setDraft((prev) => ({ ...prev, minOdds: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max Multiplier Cap (x)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={draft.maxOdds}
                    onChange={(e) => setDraft((prev) => ({ ...prev, maxOdds: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">No-Bet / Default (x)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.01"
                    value={draft.zeroBetOdds}
                    onChange={(e) => setDraft((prev) => ({ ...prev, zeroBetOdds: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Platform Withdraw Fee % (0% on betting, applied only on withdraw) */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Withdraw Platform Fee (%) — Admin Profit
                </span>
                <span className="text-[11px] text-emerald-200/70">
                  0% on betting • Applied only when withdrawing
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Platform Fee % (0% – 50%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={draft.withdrawFeePct}
                      onChange={(e) => setDraft((prev) => ({ ...prev, withdrawFeePct: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 pr-8 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">%</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/[0.06] text-[11px] space-y-0.5">
                  <p className="text-slate-400">Example on ₹1,000 withdraw:</p>
                  <p className="font-mono text-slate-200">
                    Admin keeps <span className="text-emerald-400 font-bold">₹{Math.round(1000 * (Number(draft.withdrawFeePct) || 0) / 100)}</span> • Player gets{' '}
                    <span className="text-amber-300 font-bold">₹{Math.round(1000 - (1000 * (Number(draft.withdrawFeePct) || 0) / 100))}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Set a custom stage-winner return multiplier (e.g. 2.20) per team, or leave blank for Auto.
              </p>
              {stageOverrideCount > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, stageOdds: {} }))}
                  className="text-[11px] text-amber-400 hover:underline flex-shrink-0"
                >
                  Clear all ({stageOverrideCount})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEAMS.map((team) => {
                const currentPool = stagePool.teamBets[team.id] || 0;
                const liveOdds = stagePool.teamOdds[team.id] || '2.50';
                const customVal = draft.stageOdds[team.id] ?? '';

                return (
                  <div
                    key={team.id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: team.primaryColor }} />
                        <span className="font-semibold text-slate-100 truncate">{team.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 pl-3.5 mt-0.5">
                        Pool: ₹{currentPool} • Live: <span className="text-amber-300 font-mono">{liveOdds}x</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <input
                        type="number"
                        step="0.05"
                        min="1.01"
                        placeholder="Auto"
                        value={customVal}
                        onChange={(e) => handleStageOverrideChange(team.id, e.target.value)}
                        className="w-20 bg-slate-950 border border-white/[0.1] rounded-lg px-2 py-1.5 text-right font-mono font-bold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-slate-500 font-mono">x</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Override Team 1 / Team 2 return multipliers for individual matches, or leave blank for Auto.
              </p>
              {matchOverrideCount > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, matchOdds: {} }))}
                  className="text-[11px] text-amber-400 hover:underline flex-shrink-0"
                >
                  Clear all ({matchOverrideCount})
                </button>
              )}
            </div>

            {activeMatches.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-slate-400">
                No active matches with assigned teams yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeMatches.map((match) => {
                  const t1 = getTeamById(match.team1Id);
                  const t2 = getTeamById(match.team2Id);
                  const mPool = calculatePool('match', match.id, [match.team1Id, match.team2Id]);
                  const val1 = draft.matchOdds[match.id]?.[match.team1Id] ?? '';
                  const val2 = draft.matchOdds[match.id]?.[match.team2Id] ?? '';

                  return (
                    <div
                      key={match.id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-400">
                          Match #{match.matchNumber}: {t1?.shortName} vs {t2?.shortName}
                        </span>
                        <span className="text-slate-400 font-mono">Pool: ₹{mPool.totalPool}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { team: t1, teamId: match.team1Id, val: val1 },
                          { team: t2, teamId: match.team2Id, val: val2 },
                        ].map(({ team, teamId, val }) => (
                          <div key={teamId} className="flex items-center justify-between gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-200 truncate">{team?.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Live: <span className="text-amber-300 font-mono">{mPool.teamOdds[teamId]}x</span>
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <input
                                type="number"
                                step="0.05"
                                min="1.01"
                                placeholder="Auto"
                                value={val}
                                onChange={(e) => handleMatchOverrideChange(match.id, teamId, e.target.value)}
                                className="w-20 bg-slate-900 border border-white/[0.1] rounded-lg px-2 py-1 text-right font-mono font-bold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                              />
                              <span className="text-slate-500 font-mono">x</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${statusMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </form>

      {/* Sticky Footer */}
      <div className="px-5 py-3 bg-[#0a0f18] border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.08] flex items-center space-x-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Auto Defaults</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="odds-manager-form"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save & Apply'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
