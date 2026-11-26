export const DEFAULT_ODDS_CONFIG = {
  mode: 'dynamic', // 'dynamic' | 'fixed'
  settlementMode: 'pool', // 'pool' | 'odds'
  minOdds: 1.15,
  maxOdds: 5.0,
  zeroBetOdds: 2.5,
  withdrawFeePct: 10,
  stageOdds: {},
  matchOdds: {},
};

function toPositiveNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function normalizeOddsConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const mode = src.mode === 'fixed' ? 'fixed' : 'dynamic';
  const settlementMode = src.settlementMode === 'odds' ? 'odds' : 'pool';

  const minRaw = toPositiveNumber(src.minOdds);
  const minOdds = minRaw !== null ? Math.max(1.01, minRaw) : DEFAULT_ODDS_CONFIG.minOdds;

  const maxRaw = toPositiveNumber(src.maxOdds);
  const maxOdds = maxRaw !== null ? Math.max(minOdds, maxRaw) : Math.max(minOdds, DEFAULT_ODDS_CONFIG.maxOdds);

  const zeroRaw = toPositiveNumber(src.zeroBetOdds);
  const zeroBetOdds = zeroRaw !== null
    ? Math.min(maxOdds, Math.max(minOdds, zeroRaw))
    : Math.min(maxOdds, Math.max(minOdds, DEFAULT_ODDS_CONFIG.zeroBetOdds));

  const feeParsed = src.withdrawFeePct !== null && src.withdrawFeePct !== undefined && src.withdrawFeePct !== ''
    ? Number(src.withdrawFeePct)
    : DEFAULT_ODDS_CONFIG.withdrawFeePct;
  const withdrawFeePct = Number.isFinite(feeParsed)
    ? Math.min(50, Math.max(0, Number(feeParsed.toFixed(2))))
    : DEFAULT_ODDS_CONFIG.withdrawFeePct;

  const stageOdds = {};
  if (src.stageOdds && typeof src.stageOdds === 'object') {
    for (const [teamId, val] of Object.entries(src.stageOdds)) {
      const n = toPositiveNumber(val);
      if (n !== null && n >= 1.01) {
        stageOdds[teamId] = Number(n.toFixed(2));
      }
    }
  }

  const matchOdds = {};
  if (src.matchOdds && typeof src.matchOdds === 'object') {
    for (const [matchId, teamMap] of Object.entries(src.matchOdds)) {
      if (!teamMap || typeof teamMap !== 'object') continue;
      const cleanedTeams = {};
      for (const [teamId, val] of Object.entries(teamMap)) {
        const n = toPositiveNumber(val);
        if (n !== null && n >= 1.01) {
          cleanedTeams[teamId] = Number(n.toFixed(2));
        }
      }
      if (Object.keys(cleanedTeams).length > 0) {
        matchOdds[matchId] = cleanedTeams;
      }
    }
  }

  return {
    mode,
    settlementMode,
    minOdds: Number(minOdds.toFixed(2)),
    maxOdds: Number(maxOdds.toFixed(2)),
    zeroBetOdds: Number(zeroBetOdds.toFixed(2)),
    withdrawFeePct,
    stageOdds,
    matchOdds,
  };
}

export function calculatePoolWithConfig({ type, targetId, eligibleTeamIds, bets, oddsConfig }) {
  const cfg = normalizeOddsConfig(oddsConfig);
  const totalPool = bets.reduce((sum, b) => sum + Number(b.amount), 0);

  const teamBets = {};
  const teamPercentages = {};
  const teamOdds = {};

  eligibleTeamIds.forEach((id) => {
    const teamTotal = bets
      .filter((b) => b.teamId === id || b.team_id === id)
      .reduce((sum, b) => sum + Number(b.amount), 0);

    teamBets[id] = teamTotal;
    teamPercentages[id] = totalPool > 0
      ? ((teamTotal / totalPool) * 100).toFixed(1)
      : (eligibleTeamIds.length > 0 ? (100 / eligibleTeamIds.length).toFixed(1) : '0.0');

    const override = type === 'stage'
      ? cfg.stageOdds[id]
      : cfg.matchOdds[targetId]?.[id];

    if (override !== undefined && override !== null && override > 0) {
      teamOdds[id] = Number(override).toFixed(2);
    } else if (cfg.mode === 'fixed') {
      teamOdds[id] = Number(cfg.zeroBetOdds).toFixed(2);
    } else if (teamTotal === 0) {
      teamOdds[id] = Math.min(cfg.maxOdds, Math.max(cfg.minOdds, cfg.zeroBetOdds)).toFixed(2);
    } else {
      const rawOdds = totalPool / teamTotal;
      teamOdds[id] = Math.min(cfg.maxOdds, Math.max(cfg.minOdds, rawOdds)).toFixed(2);
    }
  });

  return { totalPool, teamBets, teamPercentages, teamOdds, betsCount: bets.length };
}
