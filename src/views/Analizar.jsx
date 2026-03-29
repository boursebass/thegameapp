import { useState, useEffect } from "react";
import { MLB_TEAMS } from "../constants/teams";
import { getStadiumPhoto } from "../constants/stadiumPhotos";
import {
  fetchStandings, fetchRecentForm, fetchPitcherStats,
  fetchLast3Starts, fetchH2H, fetchWeather, fetchOdds,
  fetchUmpire, fetchBullpenLoad,
} from "../lib/mlb";
import { callClaudeStream, buildPrompt, parsePicks, getResumen, getParlayLine, getInvalidadores, getPassLine } from "../lib/claude";
import { storage } from "../lib/storage";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"5px" },
};

/* ── Pick card ── */
function PickCard({ p, onAddToBankroll }) {
  const col = p.confianza >= 70 ? "var(--green)" : p.confianza >= 55 ? "#f59e0b" : "var(--red)";
  const hasEV = p.ev > 0 || p.probReal > p.probImpl;
  return (
    <div className="card-hover" style={{ ...S.card, borderLeft:`3px solid ${col}`, padding:"16px 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
        <span style={{ ...S.label, marginBottom:0 }}>{p.mercado}</span>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          {p.ev !== 0 && (
            <span style={{
              fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"600",
              color: hasEV?"var(--teal)":"var(--red)",
              background: hasEV?"rgba(24,132,133,0.1)":"rgba(200,16,46,0.08)",
              border:`1px solid ${hasEV?"rgba(24,132,133,0.2)":"rgba(200,16,46,0.2)"}`,
              borderRadius:"4px", padding:"2px 7px",
            }}>EV {p.ev>0?"+":""}{p.ev.toFixed(1)}%</span>
          )}
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"600", color:col }}>{p.confianza}%</span>
        </div>
      </div>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"16px", fontWeight:"700", color:"var(--text)", marginBottom:"6px" }}>{p.pick}</div>
      {(p.probReal > 0 || p.probImpl > 0) && (
        <div style={{ display:"flex", gap:"12px", marginBottom:"8px", flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--teal)" }}>Real {p.probReal}%</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>Impl. {p.probImpl}%</span>
          {p.kelly > 0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"#f59e0b" }}>Kelly {p.kelly}%</span>}
        </div>
      )}
      <p style={{ fontSize:"12px", color:"var(--muted)", lineHeight:"1.6", marginBottom:"10px" }}>{p.razon}</p>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:"12px" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>Momio <span style={{color:"var(--navy)",fontWeight:"600"}}>{p.momio}</span></span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>{p.unidades}u</span>
        </div>
        {onAddToBankroll && (
          <button onClick={() => onAddToBankroll(p)} style={{
            fontFamily:"'Inter',sans-serif", fontSize:"11px", fontWeight:"600",
            background:"var(--teal)", color:"#fff", border:"none",
            borderRadius:"var(--r-sm)", padding:"5px 12px", cursor:"pointer",
          }}>+ Bankroll</button>
        )}
      </div>
      <div style={{ marginTop:"10px", background:"rgba(0,0,0,0.05)", borderRadius:"2px", height:"3px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${p.confianza}%`, background:col, borderRadius:"2px", transition:"width .6s" }} />
      </div>
    </div>
  );
}

/* ── Form dots ── */
function FormDots({ form }) {
  if (!form?.length) return <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)" }}>—</span>;
  return (
    <div style={{ display:"flex", gap:"3px", flexWrap:"wrap" }}>
      {form.slice(-10).map((g, i) => (
        <div key={i} title={`${g.mine}-${g.opp} vs ${g.oppN}`} style={{
          width:"10px", height:"10px", borderRadius:"50%",
          background: g.won ? "var(--green)" : "var(--red)",
          flexShrink:0,
        }} />
      ))}
    </div>
  );
}

/* ── Pitcher stat row ── */
function PitcherBox({ name, stats, last3, side }) {
  if (!name) return (
    <div style={{ flex:1, textAlign:side==="right"?"right":"left" }}>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color:"var(--muted)" }}>Por confirmar</div>
    </div>
  );
  return (
    <div style={{ flex:1, minWidth:0, textAlign:side==="right"?"right":"left" }}>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"14px", fontWeight:"700", color:"var(--navy)", marginBottom:"6px" }}>{name}</div>
      {stats ? (
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:side==="right"?"flex-end":"flex-start" }}>
          {[
            { l:"ERA", v:stats.era },
            { l:"WHIP", v:stats.whip },
            { l:"K/9", v:stats.k9 },
            { l:"IP", v:stats.ip },
          ].map(s => (
            <div key={s.l} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"15px", fontWeight:"700", color:"var(--teal)" }}>{s.v ?? "—"}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)", letterSpacing:"1px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)" }}>Sin stats 2025</div>
      )}
      {last3?.length > 0 && (
        <div style={{ marginTop:"8px" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)", letterSpacing:"1.5px", marginBottom:"4px" }}>ÚLTIMAS 3 SALIDAS</div>
          <div style={{ display:"flex", gap:"4px", flexDirection:"column", alignItems:side==="right"?"flex-end":"flex-start" }}>
            {last3.map((s, i) => (
              <div key={i} style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                <span style={{
                  fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"700",
                  color: s.result==="V"?"var(--green)":s.result==="D"?"var(--red)":"var(--muted)",
                  minWidth:"16px",
                }}>{s.result}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>
                  vs {s.opp} · {s.ip}ip · {s.er}cr · {s.k}K
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function Analizar({ selectedGame, setSelectedGame, todayGames, loadingGames, onSavePrediction, onAddBet }) {
  const [homeTeam,   setHomeTeam]   = useState("");
  const [awayTeam,   setAwayTeam]   = useState("");
  const [extra,      setExtra]      = useState("");
  const [showExtra,  setShowExtra]  = useState(false);
  const [prediction, setPrediction] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [phase,      setPhase]      = useState("");
  const [error,      setError]      = useState("");

  // Pre-analysis stats (loaded on game select)
  const [preStats,   setPreStats]   = useState(null);
  const [preLoading, setPreLoading] = useState(false);
  const [heroBg,     setHeroBg]     = useState(null);
  const [gameIdx,    setGameIdx]    = useState(0);

  const oddsKey = storage.getOddsKey();
  const homeObj = MLB_TEAMS.find(t => t.name === homeTeam);
  const awayObj = MLB_TEAMS.find(t => t.name === awayTeam);
  const canAnalyze = homeTeam && awayTeam && !loading;
  const cacheKey   = homeTeam && awayTeam ? `${homeTeam}_${awayTeam}_${new Date().toDateString()}` : null;

  // Navegar entre partidos con flechas
  function navigateGame(dir) {
    if (!todayGames.length) return;
    const newIdx = (gameIdx + dir + todayGames.length) % todayGames.length;
    setGameIdx(newIdx);
    setSelectedGame(todayGames[newIdx]);
    setError("");
  }

  // Sync from selectedGame
  useEffect(() => {
    if (!selectedGame) return;
    const idx = todayGames.findIndex(g => g.gamePk === selectedGame.gamePk);
    if (idx !== -1) setGameIdx(idx);
    const hId = selectedGame.teams?.home?.team?.id;
    const aId = selectedGame.teams?.away?.team?.id;
    const hN  = MLB_TEAMS.find(t => t.id === hId)?.name || "";
    const aN  = MLB_TEAMS.find(t => t.id === aId)?.name || "";
    setHomeTeam(hN); setAwayTeam(aN); setError("");
    setPrediction(storage.getCachedPred(`${hN}_${aN}_${new Date().toDateString()}`) || "");
  }, [selectedGame]);

  // Load cached prediction when teams change
  useEffect(() => {
    if (!homeTeam || !awayTeam) return;
    setPrediction(storage.getCachedPred(`${homeTeam}_${awayTeam}_${new Date().toDateString()}`) || "");
  }, [homeTeam, awayTeam]);

  // Stadium photo — biblioteca local
  useEffect(() => {
    if (!selectedGame) { setHeroBg(null); return; }
    const homeId = selectedGame?.teams?.home?.team?.id;
    const awayId = selectedGame?.teams?.away?.team?.id;
    setHeroBg(getStadiumPhoto(homeId, awayId));
  }, [selectedGame?.gamePk]);

  // Auto-load pre-analysis stats when game selected
  useEffect(() => {
    if (!homeObj || !awayObj) { setPreStats(null); return; }
    setPreLoading(true);
    const hPit = selectedGame?.teams?.home?.probablePitcher || null;
    const aPit = selectedGame?.teams?.away?.probablePitcher || null;
    Promise.allSettled([
      fetchRecentForm(homeObj.id),
      fetchRecentForm(awayObj.id),
      hPit ? fetchPitcherStats(hPit.id) : Promise.resolve(null),
      aPit ? fetchPitcherStats(aPit.id) : Promise.resolve(null),
      hPit ? fetchLast3Starts(hPit.id) : Promise.resolve([]),
      aPit ? fetchLast3Starts(aPit.id) : Promise.resolve([]),
      fetchH2H(homeObj.id, awayObj.id),
      fetchWeather(homeObj.id),
    ]).then(([r0,r1,r2,r3,r4,r5,r6,r7]) => {
      const v = r => r.status === "fulfilled" ? r.value : null;
      setPreStats({
        homeForm: v(r0)||[], awayForm: v(r1)||[],
        hPS: v(r2), aPS: v(r3),
        hLast3: v(r4)||[], aLast3: v(r5)||[],
        h2h: v(r6)||[], weather: v(r7),
        hPit, aPit,
      });
    }).finally(() => setPreLoading(false));
  }, [homeObj?.id, awayObj?.id, selectedGame?.gamePk]);

  async function analyze() {
    if (!canAnalyze) return;
    setLoading(true); setPrediction(""); setError(""); setPhase("Consultando datos MLB...");
    const hPitcher = selectedGame?.teams?.home?.probablePitcher || null;
    const aPitcher = selectedGame?.teams?.away?.probablePitcher || null;
    const [r0,r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11] = await Promise.allSettled([
      fetchStandings(),
      homeObj ? fetchRecentForm(homeObj.id) : Promise.resolve([]),
      awayObj ? fetchRecentForm(awayObj.id) : Promise.resolve([]),
      hPitcher ? fetchPitcherStats(hPitcher.id) : Promise.resolve(null),
      aPitcher ? fetchPitcherStats(aPitcher.id) : Promise.resolve(null),
      hPitcher ? fetchLast3Starts(hPitcher.id) : Promise.resolve([]),
      aPitcher ? fetchLast3Starts(aPitcher.id) : Promise.resolve([]),
      homeObj && awayObj ? fetchH2H(homeObj.id, awayObj.id) : Promise.resolve([]),
      homeObj ? fetchWeather(homeObj.id) : Promise.resolve(null),
      oddsKey ? fetchOdds(homeTeam, awayTeam, oddsKey) : Promise.resolve(null),
      selectedGame?.gamePk ? fetchUmpire(selectedGame.gamePk) : Promise.resolve(null),
      homeObj ? fetchBullpenLoad(homeObj.id).then(h => awayObj ? fetchBullpenLoad(awayObj.id).then(a => ({ h, a })) : Promise.resolve({ h, a:{} })) : Promise.resolve({ h:{}, a:{} }),
    ]);
    const v  = r => r.status === "fulfilled" ? r.value : null;
    const bd = v(r11) || { h:{}, a:{} };
    setPhase("Generando análisis con IA...");
    const prompt = buildPrompt({
      homeTeam, awayTeam, context: extra,
      hSt: (v(r0)||{})[homeObj?.id], aSt: (v(r0)||{})[awayObj?.id],
      homeForm: v(r1)||[], awayForm: v(r2)||[],
      hPitcher, aPitcher, hPS: v(r3), aPS: v(r4),
      hLast3: v(r5)||[], aLast3: v(r6)||[],
      h2h: v(r7)||[], weather: v(r8), odds: v(r9),
      umpire: v(r10), bullpenHome: bd.h, bullpenAway: bd.a,
      personalInstructions: storage.getInstructions(),
      betHistory: storage.getBets(),
    });
    try {
      const full = await callClaudeStream(prompt, t => setPrediction(t), 2000);
      if (cacheKey) storage.setCachedPred(cacheKey, full);
      setPhase("done");
      onSavePrediction({ homeTeam, awayTeam, picks: parsePicks(full), text: full, date: new Date().toISOString(), id: Date.now() });
    } catch(e) { setError("Error: " + e.message); setPhase("error"); }
    finally { setLoading(false); }
  }

  const picks  = prediction ? parsePicks(prediction) : [];
  const resumen= prediction ? getResumen(prediction) : "";
  const parlay = prediction ? getParlayLine(prediction) : "";
  const inv    = prediction ? getInvalidadores(prediction) : "";
  const pass   = prediction ? getPassLine(prediction) : "";

  const hId = selectedGame?.teams?.home?.team?.id;
  const aId = selectedGame?.teams?.away?.team?.id;
  const hRec = selectedGame?.teams?.home?.leagueRecord;
  const aRec = selectedGame?.teams?.away?.leagueRecord;
  const live = selectedGame?.status?.detailedState === "In Progress";
  const fin  = ["Final","Game Over","Completed Early"].includes(selectedGame?.status?.detailedState);
  const gt   = selectedGame?.gameDate ? new Date(selectedGame.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : null;

  return (
    <div className="fade-up">

      {/* Header */}
      <div style={{ marginBottom:"20px" }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" }}>MLB · 2025</span>
        <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(22px,3vw,26px)", fontWeight:"800", color:"var(--navy)", margin:"5px 0 0" }}>Analizar partido</h1>
      </div>

      {/* ── Game selector ── */}
      {!loadingGames && todayGames.length > 0 && (
        <div style={{ marginBottom:"20px" }}>
          <span style={{ ...S.label }}>Partidos de hoy — {todayGames.length} juegos</span>
          <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"6px", marginTop:"8px" }}>
            {todayGames.map((g, i) => {
              const sel    = selectedGame?.gamePk === g.gamePk;
              const gHId   = g.teams?.home?.team?.id;
              const gAId   = g.teams?.away?.team?.id;
              const gHA    = MLB_TEAMS.find(t => t.id === gHId)?.abbr || "?";
              const gAA    = MLB_TEAMS.find(t => t.id === gAId)?.abbr || "?";
              const gLive  = g.status?.detailedState === "In Progress";
              const gFin   = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
              const gTime  = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
              const hPit   = g.teams?.home?.probablePitcher?.fullName?.split(" ").slice(-1)[0];
              const aPit   = g.teams?.away?.probablePitcher?.fullName?.split(" ").slice(-1)[0];
              const hScore = g.teams?.home?.score;
              const aScore = g.teams?.away?.score;
              const hasScore = hScore !== undefined && aScore !== undefined;
              const gHN    = MLB_TEAMS.find(t => t.id === gHId)?.name;
              const gAN    = MLB_TEAMS.find(t => t.id === gAId)?.name;
              const hasCache = gHN && gAN && !!storage.getCachedPred(`${gHN}_${gAN}_${new Date().toDateString()}`);

              return (
                <div key={i} onClick={() => { setSelectedGame(g); setError(""); }}
                  style={{
                    minWidth:"120px", padding:"10px 12px", cursor:"pointer", flexShrink:0,
                    background: sel ? "rgba(24,132,133,0.07)" : "var(--bg-card)",
                    border:`1px solid ${sel ? "var(--teal)" : "var(--border)"}`,
                    borderRadius:"var(--r)", transition:"all .14s",
                    boxShadow: sel ? "0 0 0 2px rgba(24,132,133,0.15)" : "var(--shadow)",
                  }}
                  onMouseEnter={e => { if(!sel) e.currentTarget.style.borderColor="rgba(24,132,133,0.4)"; }}
                  onMouseLeave={e => { if(!sel) e.currentTarget.style.borderColor="var(--border)"; }}
                >
                  {/* Status */}
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", fontWeight:"700", letterSpacing:"1px",
                    color: gLive?"var(--red)":gFin?"var(--muted)":"var(--teal)", marginBottom:"8px" }}>
                    {gLive ? "● EN VIVO" : gFin ? "FINAL" : gTime}
                    {hasCache && !gLive && <span style={{ marginLeft:"4px", color:"var(--green)" }}>✓</span>}
                  </div>
                  {/* Teams with logos */}
                  {[{id:gAId, abbr:gAA, score:aScore},{id:gHId, abbr:gHA, score:hScore}].map((t,j) => (
                    <div key={j} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:j===0?"5px":0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                        <img src={`https://midfield.mlbstatic.com/v1/team/${t.id}/spots/72`} alt={t.abbr}
                          width="18" height="18" style={{ objectFit:"contain" }}
                          onError={e=>e.target.style.display="none"} />
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"600",
                          color: sel?"var(--navy)":"var(--text)" }}>{t.abbr}</span>
                      </div>
                      {hasScore && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:"var(--muted)" }}>{t.score}</span>}
                    </div>
                  ))}
                  {/* Pitchers */}
                  {(hPit || aPit) && (
                    <div style={{ marginTop:"7px", paddingTop:"6px", borderTop:"1px solid var(--border)" }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)" }}>{aPit || "TBD"}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)" }}>{hPit || "TBD"}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mini hero (selected game) ── */}
      {selectedGame && (
        <div style={{
          borderRadius:"var(--r)", marginBottom:"20px", overflow:"hidden",
          background:"linear-gradient(135deg, #0a1e30 0%, #184f6f 60%, #0d3535 100%)",
          padding:"20px 52px 32px", position:"relative",
        }}>
          {/* Foto del estadio */}
          {heroBg && (
            <div style={{
              position:"absolute", inset:0,
              backgroundImage:`url(${heroBg})`,
              backgroundSize:"cover", backgroundPosition:"center 40%",
              opacity:0.65, transition:"opacity 0.6s ease",
            }} />
          )}
          <div style={{
            position:"absolute", inset:0,
            background: heroBg
              ? "linear-gradient(135deg, rgba(6,14,22,0.60) 0%, rgba(10,30,50,0.42) 60%, rgba(4,20,20,0.65) 100%)"
              : "linear-gradient(90deg, rgba(24,132,133,0.15) 0%, transparent 60%)",
            pointerEvents:"none",
          }} />
          {/* Flechas navegación */}
          {todayGames.length > 1 && (
            <>
              <button onClick={() => navigateGame(-1)} style={{
                position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)",
                zIndex:2, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:"50%", width:"34px", height:"34px", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:"16px", backdropFilter:"blur(8px)",
                transition:"background .15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
              >‹</button>
              <button onClick={() => navigateGame(1)} style={{
                position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
                zIndex:2, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:"50%", width:"34px", height:"34px", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:"16px", backdropFilter:"blur(8px)",
                transition:"background .15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
              >›</button>
              {/* Indicador de posición */}
              <div style={{
                position:"absolute", bottom:"8px", left:"50%", transform:"translateX(-50%)",
                zIndex:2, display:"flex", gap:"4px",
              }}>
                {todayGames.map((_, i) => (
                  <div key={i} onClick={() => { setGameIdx(i); setSelectedGame(todayGames[i]); setError(""); }}
                    style={{
                      width: i===gameIdx ? "16px" : "5px", height:"5px",
                      borderRadius:"3px", cursor:"pointer",
                      background: i===gameIdx ? "#2dd4bf" : "rgba(255,255,255,0.3)",
                      transition:"all .2s",
                    }} />
                ))}
              </div>
            </>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:"0", position:"relative", zIndex:1 }}>
            {/* Away */}
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:"12px" }}>
              <img src={`https://midfield.mlbstatic.com/v1/team/${aId}/spots/72`} alt=""
                width="44" height="44" style={{ objectFit:"contain", filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
                onError={e=>e.target.style.display="none"} />
              <div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"26px", fontWeight:"900", color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>
                  {MLB_TEAMS.find(t=>t.id===aId)?.abbr || "?"}
                </div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"rgba(255,255,255,0.5)", marginTop:"2px" }}>
                  {selectedGame.teams?.away?.team?.locationName} {selectedGame.teams?.away?.team?.teamName}
                </div>
                {aRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.3)", marginTop:"2px" }}>{aRec.wins}–{aRec.losses}</div>}
              </div>
            </div>

            {/* Center */}
            <div style={{ textAlign:"center", padding:"0 20px", flexShrink:0 }}>
              {live || fin ? (
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"32px", fontWeight:"700", color:"rgba(255,255,255,0.9)" }}>{selectedGame.teams?.away?.score}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", color:"rgba(255,255,255,0.2)" }}>–</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"32px", fontWeight:"700", color:"rgba(255,255,255,0.9)" }}>{selectedGame.teams?.home?.score}</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.3)", letterSpacing:"3px", marginBottom:"4px" }}>VS</div>
                  {gt && <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"20px", fontWeight:"700", color:"rgba(255,255,255,0.85)" }}>{gt}</div>}
                </div>
              )}
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color: live?"#f87171":"rgba(255,255,255,0.3)", letterSpacing:"1px", marginTop:"4px" }}>
                {live ? "● EN VIVO" : fin ? "FINAL" : selectedGame.venue?.name || ""}
              </div>
            </div>

            {/* Home */}
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"12px" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"26px", fontWeight:"900", color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>
                  {MLB_TEAMS.find(t=>t.id===hId)?.abbr || "?"}
                </div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"rgba(255,255,255,0.5)", marginTop:"2px" }}>
                  {selectedGame.teams?.home?.team?.locationName} {selectedGame.teams?.home?.team?.teamName}
                </div>
                {hRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.3)", marginTop:"2px" }}>{hRec.wins}–{hRec.losses}</div>}
              </div>
              <img src={`https://midfield.mlbstatic.com/v1/team/${hId}/spots/72`} alt=""
                width="44" height="44" style={{ objectFit:"contain", filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
                onError={e=>e.target.style.display="none"} />
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-analysis stats ── */}
      {(homeObj && awayObj) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"20px" }}>

          {/* Pitchers */}
          <div style={{ ...S.card, padding:"16px 18px", gridColumn:"1 / 3" }}>
            <span style={S.label}>Pitchers probables</span>
            {preLoading ? (
              <div style={{ display:"flex", gap:"20px" }}>
                <div className="skeleton" style={{ flex:1, height:"70px" }} />
                <div style={{ width:"1px", background:"var(--border)" }} />
                <div className="skeleton" style={{ flex:1, height:"70px" }} />
              </div>
            ) : (
              <div style={{ display:"flex", gap:"20px", alignItems:"flex-start" }}>
                <PitcherBox
                  name={selectedGame?.teams?.away?.probablePitcher?.fullName}
                  stats={preStats?.aPS}
                  last3={preStats?.aLast3}
                  side="left"
                />
                <div style={{ width:"1px", background:"var(--border)", alignSelf:"stretch" }} />
                <PitcherBox
                  name={selectedGame?.teams?.home?.probablePitcher?.fullName}
                  stats={preStats?.hPS}
                  last3={preStats?.hLast3}
                  side="right"
                />
              </div>
            )}
          </div>

          {/* Weather */}
          <div style={{ ...S.card, padding:"16px 18px" }}>
            <span style={S.label}>Clima / Estadio</span>
            {preLoading ? (
              <div className="skeleton" style={{ height:"70px" }} />
            ) : preStats?.weather ? (
              <div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--navy)", marginBottom:"8px" }}>
                  {preStats.weather.stadium}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--text)" }}>
                    🌡️ {preStats.weather.temp}°F · {preStats.weather.desc}
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--text)" }}>
                    💨 {preStats.weather.wind}mph {preStats.weather.wdir}
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--text)" }}>
                    🌧️ {preStats.weather.rain}% lluvia
                  </div>
                  {preStats.weather.roof && (
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--teal)", marginTop:"2px" }}>ESTADIO TECHADO</div>
                  )}
                  {preStats.weather.note && (
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"#f59e0b", marginTop:"2px" }}>{preStats.weather.note}</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--muted)" }}>Sin datos</div>
            )}
          </div>

          {/* Recent form */}
          <div style={{ ...S.card, padding:"16px 18px" }}>
            <span style={S.label}>Forma reciente (últ. 10)</span>
            {preLoading ? (
              <div className="skeleton" style={{ height:"60px" }} />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginBottom:"5px" }}>
                    {MLB_TEAMS.find(t=>t.id===aId)?.abbr}
                  </div>
                  <FormDots form={preStats?.awayForm} />
                </div>
                <div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginBottom:"5px" }}>
                    {MLB_TEAMS.find(t=>t.id===hId)?.abbr}
                  </div>
                  <FormDots form={preStats?.homeForm} />
                </div>
              </div>
            )}
          </div>

          {/* H2H */}
          <div style={{ ...S.card, padding:"16px 18px", gridColumn:"1 / 4" }}>
            <span style={S.label}>H2H · Últimos enfrentamientos 2025</span>
            {preLoading ? (
              <div className="skeleton" style={{ height:"40px" }} />
            ) : preStats?.h2h?.length > 0 ? (
              <div style={{ display:"flex", gap:"8px", overflowX:"auto" }}>
                {preStats.h2h.slice(-6).map((g, i) => {
                  const hWin = parseInt(g.hs) > parseInt(g.as);
                  return (
                    <div key={i} style={{
                      flexShrink:0, padding:"8px 12px", borderRadius:"var(--r-sm)",
                      background:"rgba(0,0,0,0.03)", border:"1px solid var(--border)",
                      textAlign:"center", minWidth:"80px",
                    }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", marginBottom:"4px" }}>
                        {g.date?.slice(5)}
                      </div>
                      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700",
                        color: hWin?"var(--teal)":"var(--muted)" }}>{g.home}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"14px", fontWeight:"700", color:"var(--navy)", margin:"2px 0" }}>
                        {g.hs}–{g.as}
                      </div>
                      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700",
                        color: !hWin?"var(--teal)":"var(--muted)" }}>{g.away}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--muted)" }}>
                Sin enfrentamientos en 2025 todavía
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Analyze button + context ── */}
      {(homeTeam && awayTeam) && (
        <div style={{ ...S.card, padding:"20px 22px", marginBottom:"20px" }}>
          <div style={{ display:"flex", gap:"16px", alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:"200px" }}>
              <button onClick={() => setShowExtra(!showExtra)} style={{
                background:"none", border:"none", cursor:"pointer",
                display:"flex", alignItems:"center", gap:"6px",
                fontFamily:"'Inter',sans-serif", fontSize:"13px",
                color: extra?"var(--teal)":"var(--muted)", padding:0,
              }}>
                <span style={{ width:"18px", height:"18px", border:"1px solid var(--border)", borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px",
                  transform:showExtra?"rotate(45deg)":"none", transition:"transform .2s" }}>+</span>
                {extra ? "Contexto adicional activo" : "Agregar contexto adicional"}
              </button>
              {showExtra && (
                <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2}
                  placeholder="Lesiones, presión divisional, noticias de último momento..."
                  style={{ marginTop:"10px", resize:"vertical", lineHeight:"1.6", width:"100%" }} />
              )}
            </div>
            <button onClick={analyze} disabled={!canAnalyze}
              style={{
                padding:"13px 32px", background:"var(--teal)", color:"#fff",
                border:"none", borderRadius:"var(--r)", fontSize:"13px", fontWeight:"700",
                cursor: canAnalyze?"pointer":"not-allowed", opacity: canAnalyze?1:0.5,
                display:"flex", alignItems:"center", gap:"8px", flexShrink:0, whiteSpace:"nowrap",
              }}>
              {loading ? (
                <><span className="spin-anim" style={{ width:"14px", height:"14px", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block" }} />{phase}</>
              ) : prediction ? "Regenerar análisis" : "Analizar — todos los mercados"}
            </button>
          </div>
          {error && (
            <div style={{ marginTop:"12px", padding:"10px 14px", background:"rgba(200,16,46,0.06)", border:"1px solid rgba(200,16,46,0.2)", borderRadius:"var(--r-sm)", fontSize:"12px", color:"var(--red)" }}>{error}</div>
          )}
        </div>
      )}

      {/* No game selected */}
      {!homeTeam && !awayTeam && !loadingGames && (
        <div style={{ ...S.card, padding:"60px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"18px", fontWeight:"700", color:"var(--muted)", marginBottom:"8px" }}>Selecciona un partido arriba</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"var(--faint)" }}>Las estadísticas cargarán automáticamente</div>
        </div>
      )}

      {/* ── AI Results ── */}
      {prediction && (
        <div>
          {/* Summary */}
          {resumen && (
            <div style={{ ...S.card, borderTop:"2px solid var(--teal)", padding:"20px 22px", marginBottom:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <span style={S.label}>Análisis IA</span>
                {picks.length > 0 && (
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color:"var(--teal)",
                    background:"rgba(24,132,133,0.1)", border:"1px solid rgba(24,132,133,0.2)",
                    borderRadius:"4px", padding:"3px 10px" }}>{picks.length} picks</span>
                )}
              </div>
              <p style={{ fontSize:"13px", lineHeight:"1.9", color:"var(--text)", whiteSpace:"pre-wrap" }}>{resumen}</p>
            </div>
          )}

          {/* Picks grid */}
          {picks.length > 0 && (
            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:"700", fontSize:"15px", color:"var(--navy)", marginBottom:"12px" }}>
                Picks · {homeTeam?.split(" ").slice(-1)[0]} vs {awayTeam?.split(" ").slice(-1)[0]}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"10px" }}>
                {picks.map((p, i) => (
                  <PickCard key={i} p={p} onAddToBankroll={onAddBet ? (pick) => onAddBet({
                    match:`${homeTeam?.split(" ").slice(-1)[0]} vs ${awayTeam?.split(" ").slice(-1)[0]}`,
                    market:pick.mercado, pick:pick.pick, odds:pick.momio,
                    stake:"", result:"pending", date:new Date().toISOString().split("T")[0], id:Date.now()+i,
                  }) : null} />
                ))}
              </div>
            </div>
          )}

          {parlay && (
            <div style={{ ...S.card, borderLeft:"3px solid #f59e0b", padding:"16px 18px", marginBottom:"10px" }}>
              <span style={S.label}>Parlay sugerido</span>
              <p style={{ fontSize:"13px", color:"var(--text)", lineHeight:"1.7" }}>{parlay}</p>
            </div>
          )}

          {inv && (
            <div style={{ ...S.card, borderLeft:"3px solid var(--red)", padding:"16px 18px", marginBottom:"10px" }}>
              <span style={S.label}>Invalidadores</span>
              <p style={{ fontSize:"13px", color:"var(--muted)", lineHeight:"1.7", whiteSpace:"pre-wrap" }}>{inv}</p>
            </div>
          )}

          {pass && (
            <div style={{ background:"rgba(0,0,0,0.03)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"14px 18px" }}>
              <span style={S.label}>Sin valor — no apostar</span>
              <p style={{ fontSize:"13px", color:"var(--muted)", lineHeight:"1.6" }}>{pass}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
