import { STADIUMS, PARK_NOTES } from "../constants/teams";

const api = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const todayStr = () => new Date().toISOString().split("T")[0];

export async function fetchTodayGames() {
  const d = await api(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${todayStr()}&hydrate=probablePitcher,linescore,team,venue`
  );
  return d.dates?.[0]?.games || [];
}

export async function fetchStandings() {
  const d = await api(
    `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2025&standingsTypes=regularSeason`
  );
  const map = {};
  for (const div of d.records || []) {
    for (const t of div.teamRecords || []) {
      const l10   = t.records?.splitRecords?.find(r => r.type === "lastTen");
      const home  = t.records?.splitRecords?.find(r => r.type === "home");
      const away  = t.records?.splitRecords?.find(r => r.type === "away");
      map[t.team.id] = {
        wins: t.wins, losses: t.losses, pct: t.winningPercentage,
        streak: t.streak?.streakCode,
        rs: t.runsScored || 0, ra: t.runsAllowed || 0,
        divRank: t.divisionRank, divName: div.division?.name,
        lgRank: t.leagueRank, gb: t.gamesBack,
        l10w: l10?.wins ?? "?", l10l: l10?.losses ?? "?",
        homeW: home?.wins, homeL: home?.losses,
        awayW: away?.wins, awayL: away?.losses,
      };
    }
  }
  return map;
}

export async function fetchStandingsAll() {
  const year = new Date().getFullYear();
  for (const season of [year, year - 1]) {
    try {
      const r = await api(
        `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason&hydrate=team,division,league`
      );
      if (!r.records?.length) continue;
      const divs = [];
      for (const rec of r.records) {
        const divName = rec.division?.nameShort || rec.division?.name || "";
        const league  = rec.league?.id === 103 ? "AL" : "NL";
        divs.push({ divisionName: divName, league, teams: rec.teamRecords || [], season });
      }
      if (divs.length > 0) return divs;
    } catch {}
  }
  return [];
}

export async function fetchRecentForm(teamId) {
  const d = await api(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&startDate=${daysAgo(21)}&endDate=${todayStr()}&hydrate=linescore&gameType=R`
  );
  const games = [];
  for (const day of d.dates || []) {
    for (const g of day.games || []) {
      if (g.status?.abstractGameState !== "Final") continue;
      const isHome = g.teams?.home?.team?.id === teamId;
      const mine = isHome ? g.teams?.home?.score : g.teams?.away?.score;
      const opp  = isHome ? g.teams?.away?.score : g.teams?.home?.score;
      const oppN = (isHome ? g.teams?.away?.team?.name : g.teams?.home?.team?.name)?.split(" ").slice(-1)[0];
      games.push({ won: mine > opp, mine, opp, oppN, isHome, date: g.gameDate?.split("T")[0] });
    }
  }
  return games.slice(-12);
}

export async function fetchPitcherStats(id) {
  if (!id) return null;
  const d = await api(
    `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&group=pitching&season=2025&gameType=R`
  );
  const s = d.stats?.[0]?.splits?.[0]?.stat;
  if (!s) return null;
  return { era:s.era, whip:s.whip, ip:s.inningsPitched, k:s.strikeOuts, bb:s.baseOnBalls, hr:s.homeRuns, w:s.wins, l:s.losses, gs:s.gamesStarted, k9:s.strikeoutsPer9Inn, bb9:s.walksPer9Inn, avg:s.avg };
}

export async function fetchLast3Starts(pitcherId) {
  if (!pitcherId) return [];
  const d = await api(
    `https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=gameLog&group=pitching&season=2025&gameType=R`
  );
  const splits = d.stats?.[0]?.splits || [];
  const starts = splits.filter(g => parseInt(g.stat?.gamesStarted || 0) > 0);
  return starts.slice(-3).map(g => ({
    date: g.date, opp: g.opponent?.name?.split(" ").slice(-1)[0] || "?",
    ip: g.stat?.inningsPitched, h: g.stat?.hits, er: g.stat?.earnedRuns,
    bb: g.stat?.baseOnBalls, k: g.stat?.strikeOuts,
    result: g.stat?.wins > 0 ? "V" : g.stat?.losses > 0 ? "D" : "ND",
  }));
}

export async function fetchBullpenLoad(teamId) {
  const sched = await api(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&startDate=${daysAgo(3)}&endDate=${todayStr()}&gameType=R`
  );
  const gamePks = [];
  for (const day of sched.dates || [])
    for (const g of day.games || [])
      if (g.status?.abstractGameState === "Final")
        gamePks.push({ pk: g.gamePk, date: g.gameDate?.split("T")[0] });

  const relievers = {};
  for (const { pk, date } of gamePks.slice(-3)) {
    try {
      const box = await api(`https://statsapi.mlb.com/api/v1/game/${pk}/boxscore`);
      const isHome = box.teams?.home?.team?.id === teamId;
      const side   = isHome ? box.teams?.home : box.teams?.away;
      side?.pitchers?.slice(1).forEach(pid => {
        const p  = side?.players?.[`ID${pid}`];
        const ip = p?.stats?.pitching?.inningsPitched;
        const name = p?.person?.fullName;
        if (name && ip && ip !== "0.0") {
          if (!relievers[name]) relievers[name] = [];
          relievers[name].push({ date, ip });
        }
      });
    } catch {}
  }
  return relievers;
}

export async function fetchUmpire(gamePk) {
  if (!gamePk) return null;
  try {
    const d = await api(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=liveData,boxscore,officials`);
    const officials = d.liveData?.boxscore?.officials || [];
    return officials.find(o => o.officialType === "Home Plate")?.official?.fullName || null;
  } catch { return null; }
}

export async function fetchH2H(homeId, awayId) {
  const d = await api(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${homeId}&opponentId=${awayId}&season=2025&hydrate=linescore&gameType=R`
  );
  const games = [];
  for (const day of d.dates || [])
    for (const g of day.games || []) {
      if (g.status?.abstractGameState !== "Final") continue;
      games.push({
        date: g.gameDate?.split("T")[0],
        home: g.teams?.home?.team?.name?.split(" ").slice(-1)[0],
        away: g.teams?.away?.team?.name?.split(" ").slice(-1)[0],
        hs: g.teams?.home?.score, as: g.teams?.away?.score,
      });
    }
  return games;
}

export async function fetchWeather(homeId) {
  const s = STADIUMS[homeId];
  if (!s) return null;
  const d = await api(
    `https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`
  );
  const c = d.current;
  const dirs  = ["N","NE","E","SE","S","SO","O","NO"];
  const wdir  = dirs[Math.round(c.wind_direction_10m / 45) % 8];
  const wdesc = c.weather_code === 0 ? "Despejado" : c.weather_code <= 3 ? "Parcialmente nublado" : c.weather_code <= 49 ? "Niebla" : c.weather_code <= 69 ? "Lluvia" : "Tormenta";
  return {
    stadium: s.name, temp: Math.round(c.temperature_2m),
    wind: Math.round(c.wind_speed_10m), wdir, rain: c.precipitation_probability,
    desc: wdesc, roof: s.roof || false, altitude: s.altitude,
    note: PARK_NOTES[homeId] || null,
  };
}

export async function fetchOdds(homeTeam, awayTeam, key) {
  if (!key) return null;
  const d = await api(
    `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${key}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
  );
  const n = s => s.toLowerCase().replace(/[^a-z]/g, "");
  const hk = n(homeTeam.split(" ").slice(-1)[0]);
  const ak = n(awayTeam.split(" ").slice(-1)[0]);
  const match = d.find?.(g => n(g.home_team).includes(hk) || n(g.away_team).includes(hk));
  if (!match) return { found: false };
  const bk  = match.bookmakers?.[0];
  const h2h = bk?.markets?.find(m => m.key === "h2h")?.outcomes    || [];
  const spr = bk?.markets?.find(m => m.key === "spreads")?.outcomes || [];
  const tot = bk?.markets?.find(m => m.key === "totals")?.outcomes  || [];
  const hml = h2h.find(o => n(o.name).includes(hk))?.price;
  const aml = h2h.find(o => n(o.name).includes(ak))?.price;
  const implH = hml ? (hml < 0 ? Math.abs(hml)/(Math.abs(hml)+100)*100 : 100/(hml+100)*100) : null;
  return {
    found: true, bookmaker: bk?.title,
    hml, aml,
    hsp: spr.find(o => n(o.name).includes(hk)),
    asp: spr.find(o => n(o.name).includes(ak)),
    over:  tot.find(o => o.name === "Over"),
    under: tot.find(o => o.name === "Under"),
    implH: implH?.toFixed(1),
  };
}

export async function fetchResultados() {
  const results = [];
  for (let i = 0; i <= 4; i++) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const ds = dt.toISOString().split("T")[0];
    try {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1,17&date=${ds}&gameType=R,F,D,L,W&hydrate=team,linescore,seriesStatus`);
      const j = await r.json();
      const games = j.dates?.[0]?.games || [];
      const finals = games.filter(g => ["Final","Game Over","Completed Early"].includes(g.status?.detailedState));
      results.push(...finals);
    } catch {}
    if (results.length >= 15) break;
  }
  return results.slice(0, 20);
}

export async function fetchScheduleWeek() {
  const games = [];
  for (let i = 0; i <= 6; i++) {
    const dt = new Date(); dt.setDate(dt.getDate() + i);
    const ds = dt.toISOString().split("T")[0];
    try {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${ds}&gameType=R,F,D,L,W&hydrate=team,linescore,venue`);
      const j = await r.json();
      games.push(...(j.dates?.[0]?.games || []));
    } catch {}
  }
  return games;
}
