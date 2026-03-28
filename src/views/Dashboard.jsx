import { useState, useEffect } from "react";
import { computeBankroll } from "../lib/math";
import { fetchStandingsAll } from "../lib/mlb";
import { MLB_TEAMS } from "../constants/teams";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" },
};

/* ── Featured game hero ──────────────────────────────────────────── */
function FeaturedGame({ g, onAnalyze }) {
  if (!g) return null;
  const hObj = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id);
  const aObj = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id);
  const hA   = hObj?.abbr || "?";
  const aA   = aObj?.abbr || "?";
  const hCity = g.teams?.home?.team?.locationName || hObj?.city || "";
  const aCity = g.teams?.away?.team?.locationName || aObj?.city || "";
  const hN   = g.teams?.home?.team?.teamName || "";
  const aN   = g.teams?.away?.team?.teamName || "";
  const hPit = g.teams?.home?.probablePitcher?.fullName || "Por confirmar";
  const aPit = g.teams?.away?.probablePitcher?.fullName || "Por confirmar";
  const hR   = g.teams?.home?.score;
  const aR   = g.teams?.away?.score;
  const hRec = g.teams?.home?.leagueRecord;
  const aRec = g.teams?.away?.leagueRecord;
  const live = g.status?.detailedState === "In Progress";
  const fin  = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
  const hasScore = hR !== undefined && aR !== undefined;
  const hWin = fin && hasScore && parseInt(hR) > parseInt(aR);
  const aWin = fin && hasScore && parseInt(aR) > parseInt(hR);
  const gt   = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
  const inningState = g.linescore?.inningState || "";
  const inningOrd   = g.linescore?.currentInningOrdinal || "";
  const statusLabel = live ? `${inningState==="Bottom"?"Bot ":inningState==="Top"?"Top ":""}${inningOrd}` : fin ? "Final" : gt;

  return (
    <div style={{
      ...S.card,
      marginBottom:"20px",
      overflow:"hidden",
      background:"linear-gradient(135deg, #0d2d45 0%, #184f6f 60%, #0e3a3a 100%)",
      border:"none",
      position:"relative",
    }}>
      {/* Decorative blur circles */}
      <div style={{ position:"absolute", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(24,132,133,0.2)", filter:"blur(60px)", top:"-80px", right:"10%", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"200px", height:"200px", borderRadius:"50%", background:"rgba(132,203,138,0.15)", filter:"blur(50px)", bottom:"-50px", left:"5%", pointerEvents:"none" }} />

      {/* Top bar */}
      <div style={{ padding:"12px 28px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {live && <span className="live-dot" />}
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", fontWeight:"700", letterSpacing:"1px",
            color: live ? "#f87171" : fin ? "rgba(255,255,255,0.4)" : "#2dd4bf" }}>
            {live ? `EN VIVO · ${statusLabel}` : statusLabel}
          </span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.3)", letterSpacing:"0.5px" }}>
          {g.venue?.name || ""}
        </span>
      </div>

      {/* Main matchup */}
      <div style={{ padding:"28px 28px 20px", display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:"20px", position:"relative" }}>

        {/* Away */}
        <div style={{ textAlign:"left" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", letterSpacing:"2px", color:"rgba(255,255,255,0.4)", marginBottom:"4px" }}>{aCity.toUpperCase()}</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,5vw,44px)", fontWeight:"900", color: aWin?"#fff":"rgba(255,255,255,0.85)", letterSpacing:"-1px", lineHeight:1 }}>{aA}</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"14px", color:"rgba(255,255,255,0.5)", marginTop:"4px", fontWeight:"500" }}>{aN}</div>
          {hRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.3)", marginTop:"6px" }}>{aRec?.wins}-{aRec?.losses}</div>}
          <div style={{ marginTop:"12px", padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"rgba(255,255,255,0.3)", letterSpacing:"1px", marginBottom:"3px" }}>ABRIDOR</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:"500" }}>{aPit}</div>
          </div>
        </div>

        {/* Score / VS */}
        <div style={{ textAlign:"center", minWidth:"100px" }}>
          {hasScore ? (
            <div style={{ display:"flex", alignItems:"center", gap:"12px", justifyContent:"center" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"clamp(36px,6vw,52px)", fontWeight:"700", color: aWin?"#fff":"rgba(255,255,255,0.5)", lineHeight:1 }}>{aR}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"20px", color:"rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"clamp(36px,6vw,52px)", fontWeight:"700", color: hWin?"#fff":"rgba(255,255,255,0.5)", lineHeight:1 }}>{hR}</span>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", color:"rgba(255,255,255,0.2)", letterSpacing:"2px", marginBottom:"6px" }}>VS</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"22px", fontWeight:"800", color:"rgba(255,255,255,0.9)", letterSpacing:"-0.5px" }}>{gt}</div>
            </div>
          )}
        </div>

        {/* Home */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", letterSpacing:"2px", color:"rgba(255,255,255,0.4)", marginBottom:"4px" }}>{hCity.toUpperCase()}</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(28px,5vw,44px)", fontWeight:"900", color: hWin?"#fff":"rgba(255,255,255,0.85)", letterSpacing:"-1px", lineHeight:1 }}>{hA}</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"14px", color:"rgba(255,255,255,0.5)", marginTop:"4px", fontWeight:"500" }}>{hN}</div>
          {hRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.3)", marginTop:"6px" }}>{hRec?.wins}-{hRec?.losses}</div>}
          <div style={{ marginTop:"12px", padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"rgba(255,255,255,0.3)", letterSpacing:"1px", marginBottom:"3px" }}>ABRIDOR</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:"500" }}>{hPit}</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:"0 28px 20px", display:"flex", justifyContent:"center", position:"relative" }}>
        <button onClick={onAnalyze} style={{
          padding:"11px 32px", background:"rgba(255,255,255,0.1)",
          backdropFilter:"blur(8px)", color:"#fff",
          border:"1px solid rgba(255,255,255,0.2)", borderRadius:"var(--r-sm)",
          fontSize:"12px", fontWeight:"700", cursor:"pointer", letterSpacing:"0.5px",
          transition:"background .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.18)"}
        onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
        >Analizar este partido →</button>
      </div>
    </div>
  );
}

/* ── Mini score card ─────────────────────────────────────────────── */
function MiniGame({ g, onAnalyze }) {
  const hA = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id)?.abbr || "?";
  const aA = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id)?.abbr || "?";
  const hR = g.teams?.home?.score;
  const aR = g.teams?.away?.score;
  const hasScore = hR !== undefined && aR !== undefined;
  const live = g.status?.detailedState === "In Progress";
  const fin  = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
  const hWin = fin && hasScore && parseInt(hR) > parseInt(aR);
  const aWin = fin && hasScore && parseInt(aR) > parseInt(hR);
  const gt   = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
  const inningOrd = g.linescore?.currentInningOrdinal || "";
  const inningState = g.linescore?.inningState || "";
  const statusLabel = live ? `${inningState==="Bottom"?"▼":inningState==="Top"?"▲":""}${inningOrd}` : fin ? "Final" : gt;

  return (
    <div className="card-hover" onClick={onAnalyze} style={{
      ...S.card,
      padding:"12px 14px", cursor:"pointer", minWidth:"140px",
      borderTop:`2px solid ${live?"var(--red)":fin?"var(--border)":"var(--teal)"}`,
      background: live ? "rgba(200,16,46,0.03)" : "var(--bg-card)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"8px" }}>
        {live && <span className="live-dot" style={{ width:"5px", height:"5px" }} />}
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"600",
          color: live?"var(--red)":fin?"var(--muted)":"var(--teal)" }}>{statusLabel}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight: aWin?"700":"500", color: aWin?"var(--navy)":"var(--text)" }}>{aA}</span>
        {hasScore && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight: aWin?"700":"400", color: aWin?"var(--navy)":"var(--muted)" }}>{aR}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight: hWin?"700":"500", color: hWin?"var(--navy)":"var(--text)" }}>{hA}</span>
        {hasScore && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight: hWin?"700":"400", color: hWin?"var(--navy)":"var(--muted)" }}>{hR}</span>}
      </div>
    </div>
  );
}

/* ── News item ───────────────────────────────────────────────────── */
function NewsRow({ item, index }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" style={{
      display:"flex", gap:"14px", alignItems:"flex-start",
      padding:"13px 0", borderBottom:"1px solid var(--border)",
      textDecoration:"none",
    }}
    onMouseEnter={e => e.currentTarget.style.opacity="0.7"}
    onMouseLeave={e => e.currentTarget.style.opacity="1"}
    >
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color:"var(--teal)", minWidth:"18px" }}>
        {String(index+1).padStart(2,"0")}
      </span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)", lineHeight:"1.45", marginBottom:"3px" }}>{item.title}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.3px" }}>{item.source} · {item.date}</div>
      </div>
    </a>
  );
}

/* ── Main export ─────────────────────────────────────────────────── */
export default function Dashboard({ todayGames, loadingGames, predictions, bankroll, bets, onPickGame, onNav }) {
  const [standings, setStandings] = useState(null);
  const [news,      setNews]      = useState([]);
  const [newsError, setNewsError] = useState(false);

  useEffect(() => {
    fetchStandingsAll().then(setStandings).catch(() => {});
    fetch("/api/news")
      .then(r => r.json()).then(setNews)
      .catch(() => setNewsError(true));
  }, []);

  const stats   = computeBankroll(bankroll?.starting||0, bets);
  const pending = bets.filter(b => !b.result || b.result === "pending");
  const live    = todayGames.filter(g => g.status?.detailedState === "In Progress");

  // Pick featured game: live first → latest scheduled → first game
  const sorted = [
    ...todayGames.filter(g => g.status?.detailedState === "In Progress"),
    ...todayGames.filter(g => ["Scheduled","Pre-Game","Warmup"].includes(g.status?.detailedState))
      .sort((a,b) => new Date(b.gameDate)-new Date(a.gameDate)),
    ...todayGames.filter(g => ["Final","Game Over","Completed Early"].includes(g.status?.detailedState)),
  ];
  const featured = sorted[0];
  const rest     = sorted.slice(1);

  // Division leaders (top 1 per division)
  const leaders = (standings||[]).map(d => ({ div: d.divisionName, league: d.league, team: d.teams?.[0] })).filter(d => d.team);

  return (
    <div className="fade-up">

      {/* ── Date + badges ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <span style={{ ...S.label, display:"block", marginBottom:"4px" }}>
            {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(18px,2.5vw,24px)", fontWeight:"800", color:"var(--navy)", letterSpacing:"-0.3px" }}>
              {loadingGames ? "Cargando..." : `${todayGames.length} partidos hoy`}
            </h1>
            {live.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(200,16,46,0.08)", border:"1px solid rgba(200,16,46,0.2)", borderRadius:"20px", padding:"3px 10px" }}>
                <span className="live-dot" style={{ width:"5px", height:"5px" }} />
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--red)" }}>{live.length} EN VIVO</span>
              </div>
            )}
            {pending.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:"20px", padding:"3px 10px" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--yellow)" }}>{pending.length} pendiente{pending.length>1?"s":""}</span>
              </div>
            )}
          </div>
        </div>
        {bankroll?.starting && (
          <div style={{ ...S.card, padding:"10px 18px", display:"flex", gap:"20px" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ ...S.label, marginBottom:"2px" }}>Capital</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"700", color:stats.totalProfit>=0?"var(--teal)":"var(--red)" }}>${stats.bank.toFixed(2)}</div>
            </div>
            <div style={{ width:"1px", background:"var(--border)" }} />
            <div style={{ textAlign:"center" }}>
              <div style={{ ...S.label, marginBottom:"2px" }}>P&L</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"700", color:stats.totalProfit>=0?"var(--green)":"var(--red)" }}>{stats.totalProfit>=0?"+":""}${stats.totalProfit.toFixed(2)}</div>
            </div>
            <div style={{ width:"1px", background:"var(--border)" }} />
            <div style={{ textAlign:"center" }}>
              <div style={{ ...S.label, marginBottom:"2px" }}>Record</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"700", color:"var(--navy)" }}>{stats.wins}–{stats.losses}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Featured game ── */}
      {loadingGames ? (
        <div className="skeleton" style={{ height:"260px", marginBottom:"20px", borderRadius:"var(--r)" }} />
      ) : (
        <FeaturedGame g={featured} onAnalyze={() => { if(featured){ onPickGame(featured); onNav("analizar"); }}} />
      )}

      {/* ── Rest of games (horizontal scroll) ── */}
      {rest.length > 0 && (
        <div style={{ marginBottom:"24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <span style={S.label}>Otros partidos</span>
            <button onClick={() => onNav("analizar")} style={{ background:"none", border:"none", fontSize:"11px", fontWeight:"700", color:"var(--teal)", cursor:"pointer" }}>Ver todos →</button>
          </div>
          <div style={{ display:"flex", gap:"10px", overflowX:"auto", paddingBottom:"6px" }}>
            {rest.map((g,i) => (
              <MiniGame key={i} g={g} onAnalyze={() => { onPickGame(g); onNav("analizar"); }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom grid: News + Standings ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", alignItems:"start" }}>

        {/* News */}
        <div style={{ ...S.card, padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2px" }}>
            <span style={S.label}>Noticias MLB</span>
            <button onClick={() => onNav("equipos")} style={{ background:"none", border:"none", fontSize:"11px", fontWeight:"700", color:"var(--teal)", cursor:"pointer" }}>Ver más →</button>
          </div>
          {newsError ? (
            <p style={{ fontSize:"12px", color:"var(--muted)", padding:"16px 0" }}>Disponible en producción (Vercel).</p>
          ) : news.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", paddingTop:"12px" }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:"48px" }} />)}
            </div>
          ) : (
            news.slice(0,6).map((item,i) => <NewsRow key={i} item={item} index={i} />)
          )}
        </div>

        {/* Standings leaders */}
        <div style={{ ...S.card, padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <span style={S.label}>Líderes de división</span>
            <button onClick={() => onNav("equipos")} style={{ background:"none", border:"none", fontSize:"11px", fontWeight:"700", color:"var(--teal)", cursor:"pointer" }}>Standings →</button>
          </div>
          {!standings ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:"36px" }} />)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {["AL","NL"].map(lg => (
                <div key={lg}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--navy)", letterSpacing:"2px", padding:"6px 0 4px", borderBottom:"2px solid var(--teal)", marginBottom:"6px", display:"inline-block" }}>{lg}</div>
                  {leaders.filter(l => l.league === lg).map(l => {
                    const abbr = MLB_TEAMS.find(t => t.id === l.team?.team?.id)?.abbr || "?";
                    const city = l.team?.team?.locationName || "";
                    return (
                      <div key={l.div} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:"var(--r-sm)", marginBottom:"4px", background:"rgba(24,132,133,0.04)", border:"1px solid var(--border)", borderLeft:"3px solid var(--teal)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color:"var(--teal)", minWidth:"28px" }}>{abbr}</span>
                          <div>
                            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", fontWeight:"600", color:"var(--text)" }}>{city}</div>
                            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)", letterSpacing:"1px" }}>{l.div}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--text)", fontWeight:"600" }}>{l.team.wins}–{l.team.losses}</span>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)", fontWeight:"700" }}>{parseFloat(l.team.winningPercentage||0).toFixed(3)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
