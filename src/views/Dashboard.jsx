import { useState, useEffect } from "react";
import { computeBankroll } from "../lib/math";
import { fetchStandingsAll } from "../lib/mlb";
import { MLB_TEAMS } from "../constants/teams";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" },
};

/* ── Featured hero ─────────────────────────────────────────────── */
function FeaturedGame({ g, onAnalyze }) {
  if (!g) return (
    <div style={{ ...S.card, height:"360px", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:"13px" }}>
      Sin partidos hoy
    </div>
  );

  const hObj  = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id);
  const aObj  = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id);
  const hA    = hObj?.abbr || "?";
  const aA    = aObj?.abbr || "?";
  const hCity = g.teams?.home?.team?.locationName || "";
  const aCity = g.teams?.away?.team?.locationName || "";
  const hN    = g.teams?.home?.team?.teamName || "";
  const aN    = g.teams?.away?.team?.teamName || "";
  const hPit  = g.teams?.home?.probablePitcher?.fullName || "Por confirmar";
  const aPit  = g.teams?.away?.probablePitcher?.fullName || "Por confirmar";
  const hR    = g.teams?.home?.score;
  const aR    = g.teams?.away?.score;
  const hRec  = g.teams?.home?.leagueRecord;
  const aRec  = g.teams?.away?.leagueRecord;
  const hasScore = hR !== undefined && aR !== undefined;
  const live  = g.status?.detailedState === "In Progress";
  const fin   = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
  const hWin  = fin && hasScore && parseInt(hR) > parseInt(aR);
  const aWin  = fin && hasScore && parseInt(aR) > parseInt(hR);
  const gt    = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
  const inningOrd   = g.linescore?.currentInningOrdinal || "";
  const inningState = g.linescore?.inningState || "";
  const statusLabel = live
    ? `${inningState==="Bottom"?"Bot ":inningState==="Top"?"Top ":""}${inningOrd}`
    : fin ? "Final" : gt;

  return (
    <div style={{
      borderRadius:"var(--r)", overflow:"hidden",
      background:"linear-gradient(160deg, #0a1e30 0%, #184f6f 55%, #0d3535 100%)",
      position:"relative", height:"360px",
      display:"flex", flexDirection:"column", justifyContent:"space-between",
      cursor:"pointer",
    }} onClick={onAnalyze}>
      {/* Decorative blobs */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"rgba(24,132,133,0.25)", filter:"blur(70px)", top:"-100px", right:"-50px" }} />
        <div style={{ position:"absolute", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(132,203,138,0.12)", filter:"blur(60px)", bottom:"-80px", left:"10%" }} />
      </div>

      {/* Status */}
      <div style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {live && <span className="live-dot" />}
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", letterSpacing:"1px",
            color: live?"#f87171": fin?"rgba(255,255,255,0.4)":"#2dd4bf" }}>
            {live ? `EN VIVO · ${statusLabel}` : fin ? "FINAL" : `HOY · ${statusLabel}`}
          </span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.25)" }}>
          {g.venue?.name || ""}
        </span>
      </div>

      {/* Matchup */}
      <div style={{ padding:"0 28px", position:"relative", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:"16px" }}>

          {/* Away */}
          <div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"rgba(255,255,255,0.35)", letterSpacing:"2px", marginBottom:"6px" }}>VISITANTE</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(32px,5vw,48px)", fontWeight:"900", color: aWin?"#fff":"rgba(255,255,255,0.88)", letterSpacing:"-1px", lineHeight:1 }}>{aA}</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color:"rgba(255,255,255,0.45)", marginTop:"4px" }}>{aCity} {aN}</div>
            {aRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.25)", marginTop:"4px" }}>{aRec.wins}–{aRec.losses}</div>}
            <div style={{ marginTop:"14px" }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"rgba(255,255,255,0.25)", letterSpacing:"1.5px" }}>PITCHER</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.6)", marginTop:"2px" }}>{aPit}</div>
            </div>
          </div>

          {/* Center score */}
          <div style={{ textAlign:"center" }}>
            {hasScore ? (
              <div style={{ display:"flex", alignItems:"center", gap:"14px", justifyContent:"center" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"clamp(40px,7vw,60px)", fontWeight:"700", color: aWin?"#fff":"rgba(255,255,255,0.45)", lineHeight:1 }}>{aR}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"18px", color:"rgba(255,255,255,0.15)" }}>–</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"clamp(40px,7vw,60px)", fontWeight:"700", color: hWin?"#fff":"rgba(255,255,255,0.45)", lineHeight:1 }}>{hR}</span>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"rgba(255,255,255,0.2)", letterSpacing:"3px", marginBottom:"8px" }}>VS</div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"26px", fontWeight:"800", color:"rgba(255,255,255,0.9)" }}>{gt}</div>
              </div>
            )}
          </div>

          {/* Home */}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"rgba(255,255,255,0.35)", letterSpacing:"2px", marginBottom:"6px" }}>LOCAL</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(32px,5vw,48px)", fontWeight:"900", color: hWin?"#fff":"rgba(255,255,255,0.88)", letterSpacing:"-1px", lineHeight:1 }}>{hA}</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color:"rgba(255,255,255,0.45)", marginTop:"4px" }}>{hCity} {hN}</div>
            {hRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.25)", marginTop:"4px" }}>{hRec.wins}–{hRec.losses}</div>}
            <div style={{ marginTop:"14px" }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"rgba(255,255,255,0.25)", letterSpacing:"1.5px", textAlign:"right" }}>PITCHER</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.6)", marginTop:"2px", textAlign:"right" }}>{hPit}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding:"16px 24px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.25)", letterSpacing:"0.5px" }}>
          PARTIDO DESTACADO
        </span>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700", color:"#2dd4bf" }}>
          Analizar →
        </span>
      </div>
    </div>
  );
}

/* ── Mini game card ─────────────────────────────────────────────── */
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
  const inningOrd   = g.linescore?.currentInningOrdinal || "";
  const inningState = g.linescore?.inningState || "";
  const statusLabel = live
    ? `${inningState==="Bottom"?"▼":inningState==="Top"?"▲":""}${inningOrd}`
    : fin ? "Final" : gt;

  return (
    <div className="card-hover" onClick={onAnalyze} style={{
      ...S.card, padding:"11px 14px", cursor:"pointer", minWidth:"130px", flexShrink:0,
      borderTop:`2px solid ${live?"var(--red)":fin?"var(--border)":"var(--teal)"}`,
    }}>
      <div style={{ marginBottom:"7px" }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"600",
          color: live?"var(--red)":fin?"var(--muted)":"var(--teal)" }}>
          {live && "● "}{statusLabel}
        </span>
      </div>
      {[{abbr:aA, r:aR, win:aWin},{abbr:hA, r:hR, win:hWin}].map((t,i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:i===0?"4px":0 }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:t.win?"700":"500", color:t.win?"var(--navy)":"var(--text)" }}>{t.abbr}</span>
          {hasScore && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:t.win?"700":"400", color:t.win?"var(--navy)":"var(--muted)" }}>{t.r}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── News sidebar ───────────────────────────────────────────────── */
function NewsSidebar({ news, newsError, onNav }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"18px", fontWeight:"800", color:"var(--navy)", letterSpacing:"-0.3px" }}>
          Latest News
        </h2>
        <button onClick={() => onNav("equipos")} style={{ background:"none", border:"none", fontSize:"11px", fontWeight:"700", color:"var(--teal)", cursor:"pointer" }}>Ver más →</button>
      </div>

      {newsError ? (
        <p style={{ fontSize:"12px", color:"var(--muted)" }}>Noticias disponibles en Vercel.</p>
      ) : news.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height:"52px" }} />)}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" }}>
          {news.slice(0,8).map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noreferrer" style={{
              display:"flex", gap:"12px", alignItems:"flex-start",
              padding:"12px 0", borderBottom:"1px solid var(--border)",
              textDecoration:"none",
            }}
            onMouseEnter={e => e.currentTarget.querySelector(".news-title").style.color="var(--teal)"}
            onMouseLeave={e => e.currentTarget.querySelector(".news-title").style.color="var(--text)"}
            >
              {/* Number badge */}
              <div style={{
                minWidth:"26px", height:"26px", borderRadius:"6px",
                background:"rgba(24,79,111,0.08)", border:"1px solid var(--border)",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, marginTop:"1px",
              }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", fontWeight:"700", color:"var(--teal)" }}>{i+1}</span>
              </div>
              <div style={{ flex:1 }}>
                <div className="news-title" style={{
                  fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600",
                  color:"var(--text)", lineHeight:"1.4", marginBottom:"3px",
                  transition:"color .15s",
                }}>{item.title}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.3px" }}>
                  {item.source} · {item.date}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function Dashboard({ todayGames, loadingGames, predictions, bankroll, bets, onPickGame, onNav }) {
  const [standings, setStandings] = useState(null);
  const [news,      setNews]      = useState([]);
  const [newsError, setNewsError] = useState(false);

  useEffect(() => {
    fetchStandingsAll().then(setStandings).catch(() => {});
    fetch("/api/news").then(r=>r.json()).then(setNews).catch(()=>setNewsError(true));
  }, []);

  const stats   = computeBankroll(bankroll?.starting||0, bets);
  const pending = bets.filter(b => !b.result || b.result === "pending");
  const live    = todayGames.filter(g => g.status?.detailedState === "In Progress");

  const sorted = [
    ...todayGames.filter(g => g.status?.detailedState === "In Progress"),
    ...todayGames.filter(g => ["Scheduled","Pre-Game","Warmup"].includes(g.status?.detailedState))
      .sort((a,b)=>new Date(b.gameDate)-new Date(a.gameDate)),
    ...todayGames.filter(g=>["Final","Game Over","Completed Early"].includes(g.status?.detailedState)),
  ];
  const featured = sorted[0];
  const rest     = sorted.slice(1);

  return (
    <div className="fade-up">

      {/* ── Top bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px", flexWrap:"wrap", gap:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
          <span style={{ ...S.label }}>
            {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}
          </span>
          {live.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(200,16,46,0.08)", border:"1px solid rgba(200,16,46,0.2)", borderRadius:"20px", padding:"3px 10px" }}>
              <span className="live-dot" style={{ width:"5px",height:"5px" }} />
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--red)" }}>{live.length} EN VIVO</span>
            </div>
          )}
          {pending.length > 0 && (
            <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"20px", padding:"3px 10px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--yellow)" }}>{pending.length} pendiente{pending.length>1?"s":""}</span>
            </div>
          )}
        </div>
        {bankroll?.starting && (
          <div style={{ ...S.card, padding:"8px 16px", display:"flex", gap:"16px" }}>
            {[
              { l:"Capital", v:`$${stats.bank.toFixed(2)}`,      c:stats.totalProfit>=0?"var(--teal)":"var(--red)" },
              { l:"P&L",     v:`${stats.totalProfit>=0?"+":""}$${stats.totalProfit.toFixed(2)}`, c:stats.totalProfit>=0?"var(--green)":"var(--red)" },
              { l:"Record",  v:`${stats.wins}–${stats.losses}`,  c:"var(--navy)" },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ ...S.label, marginBottom:"2px" }}>{s.l}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"700", color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MLB-style layout: Hero left + News right ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"20px", alignItems:"start" }}>

        {/* LEFT */}
        <div>
          {/* Featured */}
          {loadingGames
            ? <div className="skeleton" style={{ height:"360px", borderRadius:"var(--r)", marginBottom:"14px" }} />
            : <div style={{ marginBottom:"14px" }}>
                <FeaturedGame g={featured} onAnalyze={()=>{ if(featured){onPickGame(featured);onNav("analizar");}}} />
              </div>
          }

          {/* Other games scroll */}
          {rest.length > 0 && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <span style={S.label}>{rest.length} partidos más</span>
                <button onClick={()=>onNav("analizar")} style={{ background:"none", border:"none", fontSize:"11px", fontWeight:"700", color:"var(--teal)", cursor:"pointer" }}>Analizar →</button>
              </div>
              <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"4px" }}>
                {rest.map((g,i) => (
                  <MiniGame key={i} g={g} onAnalyze={()=>{onPickGame(g);onNav("analizar");}} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — News */}
        <div style={{ ...S.card, padding:"20px 22px" }}>
          <NewsSidebar news={news} newsError={newsError} onNav={onNav} />

          {/* Division leaders (compact) */}
          {standings && (
            <div style={{ marginTop:"20px", paddingTop:"18px", borderTop:"1px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"800", color:"var(--navy)" }}>Standings</h2>
                <button onClick={()=>onNav("equipos")} style={{ background:"none", border:"none", fontSize:"11px", fontWeight:"700", color:"var(--teal)", cursor:"pointer" }}>Ver todo →</button>
              </div>
              {["AL","NL"].map(lg => (
                <div key={lg} style={{ marginBottom:"12px" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700", color:"var(--navy)", letterSpacing:"2px", marginBottom:"6px", paddingBottom:"4px", borderBottom:"2px solid var(--teal)", display:"inline-block" }}>{lg}</div>
                  {standings.filter(d=>d.league===lg).sort((a,b)=>a.divisionName.localeCompare(b.divisionName)).map(d => {
                    const t = d.teams?.[0]; if(!t) return null;
                    const abbr = MLB_TEAMS.find(tm=>tm.id===t.team?.id)?.abbr || "?";
                    const city = t.team?.locationName || "";
                    return (
                      <div key={d.divisionName} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 8px", borderRadius:"6px", marginBottom:"3px", background:"rgba(24,132,133,0.04)" }}>
                        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color:"var(--teal)", minWidth:"26px" }}>{abbr}</span>
                          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"var(--muted)" }}>{city}</span>
                        </div>
                        <div style={{ display:"flex", gap:"8px" }}>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", fontWeight:"600", color:"var(--text)" }}>{t.wins}–{t.losses}</span>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)" }}>{parseFloat(t.winningPercentage||0).toFixed(3)}</span>
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
