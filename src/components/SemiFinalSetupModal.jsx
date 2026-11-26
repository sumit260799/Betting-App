import { useMemo, useState } from 'react';
import { useTournament } from '../context/useTournament';
import { TEAMS } from '../data/tournamentData';
import { Modal } from './Modal';
import {
  X,
  Trophy,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const SemiFinalSetupModal = ({ onClose }) => {
  const {
    matches,
    bets,
    teamStats,
    currentStage,
    getTeamById,
    setSemiFinalMatches,
  } = useTournament();

  const sortedByPoints = useMemo(() => {
    return [...TEAMS].sort((a, b) => {
      const statsA = teamStats[a.id] || { points: 0, won: 0 };
      const statsB = teamStats[b.id] || { points: 0, won: 0 };
      if (statsB.points !== statsA.points) return statsB.points - statsA.points;
      return statsB.won - statsA.won;
    });
  }, [teamStats]);

  const rankByTeamId = useMemo(() => {
    const map = {};
    sortedByPoints.forEach((t, idx) => {
      map[t.id] = idx + 1;
    });
    return map;
  }, [sortedByPoints]);

  const sf1Match = matches.find(m => m.id === 'sf1');
  const sf2Match = matches.find(m => m.id === 'sf2');

  const sf1Completed = sf1Match?.status === 'completed';
  const sf2Completed = sf2Match?.status === 'completed';

  const sf1ActiveBets = useMemo(
    () => bets.filter(b => b.type === 'match' && b.targetId === 'sf1' && b.status === 'active').length,
    [bets]
  );
  const sf2ActiveBets = useMemo(
    () => bets.filter(b => b.type === 'match' && b.targetId === 'sf2' && b.status === 'active').length,
    [bets]
  );

  const sf1Locked = sf1Completed || (Boolean(sf1Match?.team1Id && sf1Match?.team2Id) && sf1ActiveBets > 0);
  const sf2Locked = sf2Completed || (Boolean(sf2Match?.team1Id && sf2Match?.team2Id) && sf2ActiveBets > 0);

  const defaultPairings = useMemo(() => {
    const top4 = sortedByPoints.slice(0, 4).map(t => t.id);
    return {
      sf1Team1: sf1Match?.team1Id || top4[0] || '',
      sf1Team2: sf1Match?.team2Id || top4[3] || '',
      sf2Team1: sf2Match?.team1Id || top4[1] || '',
      sf2Team2: sf2Match?.team2Id || top4[2] || '',
    };
  }, [sf1Match, sf2Match, sortedByPoints]);

  const [sf1Team1, setSf1Team1] = useState(defaultPairings.sf1Team1);
  const [sf1Team2, setSf1Team2] = useState(defaultPairings.sf1Team2);
  const [sf2Team1, setSf2Team1] = useState(defaultPairings.sf2Team1);
  const [sf2Team2, setSf2Team2] = useState(defaultPairings.sf2Team2);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const selectedSlots = useMemo(
    () => [sf1Team1, sf1Team2, sf2Team1, sf2Team2],
    [sf1Team1, sf1Team2, sf2Team1, sf2Team2]
  );
  const duplicateTeamIds = useMemo(() => {
    const counts = {};
    selectedSlots.forEach(id => {
      if (id) counts[id] = (counts[id] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(id => counts[id] > 1));
  }, [selectedSlots]);

  const hasMissing = selectedSlots.some(id => !id);
  const hasDuplicates = duplicateTeamIds.size > 0;
  const duplicateNames = Array.from(duplicateTeamIds)
    .map(id => getTeamById(id)?.shortName || id)
    .join(', ');

  const handleAutoFillStandings = () => {
    const top4 = sortedByPoints.slice(0, 4).map(t => t.id);
    if (!sf1Locked) {
      setSf1Team1(top4[0] || '');
      setSf1Team2(top4[3] || '');
    }
    if (!sf2Locked) {
      setSf2Team1(top4[1] || '');
      setSf2Team2(top4[2] || '');
    }
    setStatusMessage(null);
  };

  const handleSubmit = async (advance) => {
    if (hasMissing) {
      setStatusMessage({ type: 'error', text: 'Please select a team for all 4 Semi-Final slots.' });
      return;
    }
    if (hasDuplicates) {
      setStatusMessage({
        type: 'error',
        text: `Each team can only occupy one Semi-Final slot. Duplicate: ${duplicateNames}.`,
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    const res = await setSemiFinalMatches({
      sf1: { team1Id: sf1Team1, team2Id: sf1Team2 },
      sf2: { team1Id: sf2Team1, team2Id: sf2Team2 },
      advance,
    });
    setSaving(false);

    if (res?.success) {
      setStatusMessage({ type: 'success', text: res.message || 'Semi-Final matchups updated!' });
      setTimeout(() => onClose(), 650);
    } else {
      setStatusMessage({ type: 'error', text: res?.message || 'Failed to update Semi-Final matchups.' });
    }
  };

  const renderMatchSelector = ({
    label,
    time,
    team1Val,
    setTeam1Val,
    team2Val,
    setTeam2Val,
    locked,
    completed,
    activeBetsCount,
  }) => {
    const t1 = getTeamById(team1Val);
    const t2 = getTeamById(team2Val);

    return (
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-extrabold text-[11px] uppercase">
              {label}
            </span>
            {time && <span className="text-[11px] text-slate-400">{time}</span>}
          </div>

          <div className="flex items-center space-x-2">
            {locked && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                <Lock className="w-3 h-3" />
                <span>{completed ? 'Completed' : `${activeBetsCount} Active Bet(s)`}</span>
              </span>
            )}
            {!locked && (
              <button
                type="button"
                onClick={() => {
                  const prev1 = team1Val;
                  setTeam1Val(team2Val);
                  setTeam2Val(prev1);
                }}
                title="Swap Home / Away teams"
                className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] font-semibold flex items-center space-x-1 transition"
              >
                <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                <span>Swap</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Team A
            </label>
            <select
              value={team1Val}
              disabled={locked}
              onChange={(e) => {
                setTeam1Val(e.target.value);
                setStatusMessage(null);
              }}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50 ${
                duplicateTeamIds.has(team1Val)
                  ? 'border-rose-500/70 focus:border-rose-400'
                  : 'border-white/[0.1] focus:border-amber-500'
              }`}
            >
              <option value="">Select Team...</option>
              {sortedByPoints.map((team) => {
                const pts = teamStats[team.id]?.points || 0;
                return (
                  <option key={team.id} value={team.id}>
                    #{rankByTeamId[team.id]} {team.name} ({team.shortName}) • {pts} pts
                  </option>
                );
              })}
            </select>
          </div>

          <div className="sm:col-span-1 flex items-center justify-center pt-4 sm:pt-4">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black text-amber-300">
              VS
            </span>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Team B
            </label>
            <select
              value={team2Val}
              disabled={locked}
              onChange={(e) => {
                setTeam2Val(e.target.value);
                setStatusMessage(null);
              }}
              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50 ${
                duplicateTeamIds.has(team2Val)
                  ? 'border-rose-500/70 focus:border-rose-400'
                  : 'border-white/[0.1] focus:border-amber-500'
              }`}
            >
              <option value="">Select Team...</option>
              {sortedByPoints.map((team) => {
                const pts = teamStats[team.id]?.points || 0;
                return (
                  <option key={team.id} value={team.id}>
                    #{rankByTeamId[team.id]} {team.name} ({team.shortName}) • {pts} pts
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {t1 && t2 && (
          <div className="text-[11px] text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
            <span className="font-semibold text-slate-200">
              {t1.name} <span className="text-slate-500">vs</span> {t2.name}
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {t1.shortName} vs {t2.shortName}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal onClose={onClose} maxWidth="2xl">
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

        <div className="flex items-center space-x-1.5 text-purple-400 text-[11px] font-semibold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          <span>Semi-Final Matchup Builder</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
          Select &amp; Set Semi-Final 1 &amp; Semi-Final 2 Matches
        </h3>
        <p className="text-[11px] text-slate-400">
          Choose any teams for Semi-Final 1 and Semi-Final 2, or auto-fill from the Points Table standings.
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/25">
          <div className="text-[11px] text-indigo-200/90">
            <span className="font-bold text-indigo-300">Flexible Pairing:</span> Any 4 distinct teams can be assigned in any combination across SF 1 and SF 2.
          </div>
          <button
            type="button"
            onClick={handleAutoFillStandings}
            disabled={sf1Locked && sf2Locked}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold text-[11px] flex items-center space-x-1 disabled:opacity-40 transition"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Auto-Fill (#1v#4, #2v#3)</span>
          </button>
        </div>

        {renderMatchSelector({
          label: 'Semi-Final 1',
          time: sf1Match?.time,
          team1Val: sf1Team1,
          setTeam1Val: setSf1Team1,
          team2Val: sf1Team2,
          setTeam2Val: setSf1Team2,
          locked: sf1Locked,
          completed: sf1Completed,
          activeBetsCount: sf1ActiveBets,
        })}

        {renderMatchSelector({
          label: 'Semi-Final 2',
          time: sf2Match?.time,
          team1Val: sf2Team1,
          setTeam1Val: setSf2Team1,
          team2Val: sf2Team2,
          setTeam2Val: setSf2Team2,
          locked: sf2Locked,
          completed: sf2Completed,
          activeBetsCount: sf2ActiveBets,
        })}

        {hasDuplicates && !statusMessage && (
          <div className="p-3 rounded-xl text-xs flex items-center space-x-2 border bg-rose-950/40 text-rose-300 border-rose-500/40">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Each team can only be placed in one slot. Duplicate selection: {duplicateNames}.</span>
          </div>
        )}

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="px-5 py-3 bg-[#0a0f18] border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition"
        >
          Cancel
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving || hasMissing || hasDuplicates || (sf1Locked && sf2Locked && currentStage !== 'league')}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-100 text-xs font-bold border border-white/[0.12] flex items-center space-x-1.5 disabled:opacity-40 transition"
          >
            <Save className="w-3.5 h-3.5 text-amber-300" />
            <span>{currentStage === 'league' ? 'Save Matchups Only' : 'Update Semi-Final Matches'}</span>
          </button>

          {currentStage === 'league' && (
            <button
              type="button"
              disabled={saving || hasMissing || hasDuplicates}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-purple-500/20 disabled:opacity-40 transition"
            >
              <span>{saving ? 'Saving...' : 'Set & Advance to Semi-Finals'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
