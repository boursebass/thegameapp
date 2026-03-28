import { useState, useEffect } from "react";
import { MLB_TEAMS } from "../constants/teams";
import { fetchStandings, fetchRecentForm, fetchPitcherStats, fetchLast3Starts, fetchH2H, fetchWeather, fetchOdds, fetchUmpire, fetchBullpenLoad } from "../lib/mlb";
import { callClaudeStream, buildPrompt, parsePicks, getResumen, getParlayLine, getInvalidadores, getPassLine } from "../lib/claude";
import { storage } from "../lib/storage";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"20px 22px", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
};

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
              color: hasEV ? "var(--teal)" : "var(--red)",
              background: hasEV ? "rgba(24,132,133,0.1)" : "rgba(200,16,46,0.08)",
              border:`1px solid ${hasEV ? "rgba(24,132,133,0.2)" : "rgba(200,16,46,0.2)"}`,
              borderRadius:"4px", padding:"2px 7px",
            }}>EV {p.ev > 0 ? "+" : ""}{p.ev.toFixed(1)}%</span>
          )}
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"600", color:col }}>{p.confianza}%</span>
        </div>
      </div>

      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"16px", fontWeight:"700", color:"var(--text)", marginBottom:"6px" }}>{p.pick}</div>

      {(p.probReal > 0 || p.probImpl > 0) && (
        <div style={{ display:"flex", gap:"12px", marginBottom:"8px", flexWrap:"wrap" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--teal)" }}>Real {p.probReal}%</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)" }}>Impl. {p.probImpl}%</span>
          {p.kelly > 0 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"#f59e0b" }}>Kelly {p.kelly}%</span>}
        </div>
      )}

      <p style={{ fontSize:"12px", color:"var(--muted)", lineHeight:"1.6", marginBottom:"10px" }}>{p.razon}</p>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:"12px" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)" }}>Momio <span style={{color:"var(--navy)",fontWeight:"600"}}>{p.momio}</span></span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)" }}>{p.unidades}u</span>
        </div>
        {onAddToBankroll && (
          <button onClick={() => onAddToBankroll(p)} style={{
            fontFamily:"'Inter',sans-serif", fontSize:"11px", fontWeight:"600",
            background:"var(--teal)", color:"#fff", border:"none",
            borderRadius:"var(--r-sm)", padding:"5px 12px", cursor:"pointer",
          }}>+ Bankroll</button>
        )}
      </div>

      {/* Confidence bar */}
      <div style={{ marginTop:"10px", background:"var(--bg-sub)", borderRadius:"2px", height:"3px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${p.confianza}%`, background:col, borderRadius:"2px", transition:"width .6s" }} />
      </div>
    </div>
  );
}

export default function Analizar({ selectedGame, setSelectedGame, todayGames, loadingGames, onSavePrediction, onAddBet }) {
  const [tab, setTab] = useState("single");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [extra, setExtra] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [allLoading, setAllLoading] = useState(false);
  const [allProgress, setAllProgress] = useState({ done:0, total:0 });
  const [allResults, setAllResults] = useState([]);

  const oddsKey  = storage.getOddsKey();
  const homeObj  = MLB_TEAMS.find(t => t.name === homeTeam);
  const awayObj  = MLB_TEAMS.find(t => t.name === awayTeam);
  const canAnalyze = homeTeam && awayTeam && !loading;
  const cacheKey = homeTeam && awayTeam ? `${homeTeam}_${awayTeam}_${new Date().toDateString()}` : null;

  useEffect(() => {
    if (!selectedGame) return;
    const hId = selectedGame.teams?.home?.team?.id;
    const aId = selectedGame.teams?.away?.team?.id;
    const hN  = MLB_TEAMS.find(t => t.id === hId)?.name || "";
    const aN  = MLB_TEAMS.find(t => t.id === aId)?.name || "";
    setHomeTeam(hN); setAwayTeam(aN); setError("");
    const cached = storage.getCachedPred(`${hN}_${aN}_${new Date().toDateString()}`);
    setPrediction(cached || "");
  }, [selectedGame]);

  useEffect(() => {
    if (!homeTeam || !awayTeam) return;
    setPrediction(storage.getCachedPred(`${homeTeam}_${awayTeam}_${new Date().toDateString()}`) || "");
  }, [homeTeam, awayTeam]);

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

  async function analyzeAll() {
    if (!storage.getAnthropicKey()) { setError("Configura tu Anthropic key en Ajustes"); return; }
    const games = todayGames.filter(g => !["Final","Game Over"].includes(g.status?.detailedState));
    if (!games.length) return;
    setAllLoading(true); setAllResults([]); setAllProgress({ done:0, total:games.length });
    const standings = await fetchStandings().catch(() => ({}));
    const results = [];
    for (let i = 0; i < games.length; i++) {
      setAllProgress({ done:i, total:games.length });
      const g = games[i];
      const hId = g.teams?.home?.team?.id; const aId = g.teams?.away?.team?.id;
      const hO  = MLB_TEAMS.find(t => t.id === hId); const aO = MLB_TEAMS.find(t => t.id === aId);
      if (!hO || !aO) continue;
      try {
        const hP = g.teams?.home?.probablePitcher || null;
        const aP = g.teams?.away?.probablePitcher || null;
        const [r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11] = await Promise.allSettled([
          fetchRecentForm(hO.id), fetchRecentForm(aO.id),
          hP ? fetchPitcherStats(hP.id) : Promise.resolve(null),
          aP ? fetchPitcherStats(aP.id) : Promise.resolve(null),
          hP ? fetchLast3Starts(hP.id) : Promise.resolve([]),
          aP ? fetchLast3Starts(aP.id) : Promise.resolve([]),
          fetchH2H(hO.id, aO.id), fetchWeather(hO.id),
          oddsKey ? fetchOdds(hO.name, aO.name, oddsKey) : Promise.resolve(null),
          fetchUmpire(g.gamePk),
          fetchBullpenLoad(hO.id).then(h => fetchBullpenLoad(aO.id).then(a => ({ h, a }))).catch(() => ({ h:{}, a:{} })),
        ]);
        const v  = r => r.status === "fulfilled" ? r.value : null;
        const bd = v(r11) || { h:{}, a:{} };
        const prompt = buildPrompt({
          homeTeam: hO.name, awayTeam: aO.name, context:"",
          hSt: standings[hO.id], aSt: standings[aO.id],
          homeForm:v(r1)||[], awayForm:v(r2)||[],
          hPitcher:hP, aPitcher:aP, hPS:v(r3), aPS:v(r4),
          hLast3:v(r5)||[], aLast3:v(r6)||[],
          h2h:v(r7)||[], weather:v(r8), odds:v(r9),
          umpire:v(r10), bullpenHome:bd.h, bullpenAway:bd.a,
        });
        const { callClaude } = await import("../lib/claude");
        const full = await callClaude(prompt, 2000);
        const res  = { homeTeam: hO.name, awayTeam: aO.name, picks: parsePicks(full), text: full };
        results.push(res);
        setAllResults([...results]);
        onSavePrediction({ ...res, date: new Date().toISOString(), id: Date.now() + i });
      } catch(e) { console.warn(e); }
      if (i < games.length - 1) await new Promise(res => setTimeout(res, 600));
    }
    setAllProgress({ done:games.length, total:games.length });
    setAllLoading(false);
  }

  const picks  = prediction ? parsePicks(prediction) : [];
  const resumen= prediction ? getResumen(prediction) : "";
  const parlay = prediction ? getParlayLine(prediction) : "";
  const inv    = prediction ? getInvalidadores(prediction) : "";
  const pass   = prediction ? getPassLine(prediction) : "";

  return (
    <div className="fade-up">
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(22px,3vw,28px)", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Analizar partido</h1>
        <p style={{ color:"var(--muted)", fontSize:"13px" }}>10 fuentes de datos · Todos los mercados · EV + Kelly</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:"24px" }}>
        <button className={`tab-btn${tab==="single"?" active":""}`} onClick={() => setTab("single")}>Partido individual</button>
        <button className={`tab-btn${tab==="all"?" active":""}`} onClick={() => setTab("all")}>Analizar todos hoy</button>
      </div>

      {tab === "single" && (
        <>
          {/* Game chips */}
          {!loadingGames && todayGames.length > 0 && (
            <div style={{ marginBottom:"20px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" }}>Partidos de hoy</span>
              <div style={{ display:"flex", gap:"6px", overflowX:"auto", paddingBottom:"4px", marginTop:"8px" }}>
                {todayGames.slice(0,16).map((g,i) => {
                  const sel  = selectedGame?.gamePk === g.gamePk;
                  const hA   = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id)?.abbr || "?";
                  const aA   = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id)?.abbr || "?";
                  const gt   = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
                  const live = g.status?.detailedState === "In Progress";
                  const hN   = MLB_TEAMS.find(t => t.id === g.teams?.home?.team?.id)?.name;
                  const aN   = MLB_TEAMS.find(t => t.id === g.teams?.away?.team?.id)?.name;
                  const hasCache = hN && aN && !!storage.getCachedPred(`${hN}_${aN}_${new Date().toDateString()}`);
                  return (
                    <div key={i} onClick={() => { setSelectedGame(g); setError(""); }}
                      style={{
                        minWidth:"68px", padding:"10px 8px", textAlign:"center", cursor:"pointer",
                        background: sel ? "#edf7ed" : "var(--bg-card)",
                        border:`1px solid ${sel ? "var(--teal)" : "var(--border)"}`,
                        borderBottom:`2px solid ${sel ? "var(--teal)" : hasCache ? "var(--green)" : "transparent"}`,
                        borderRadius:"var(--r-sm)", flexShrink:0, transition:"all .14s",
                      }}>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"600", color:sel?"var(--navy)":"var(--text)" }}>{aA}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--faint)", margin:"2px 0" }}>@</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"600", color:sel?"var(--navy)":"var(--text)" }}>{hA}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", marginTop:"4px", color: live?"var(--red)":"var(--muted)" }}>
                        {live ? "● LIVE" : gt}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"16px", alignItems:"start", marginBottom:"20px" }}>
            <div style={{ ...S.card }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                <div>
                  <span style={S.label}>Local</span>
                  <select value={homeTeam} onChange={e => { setHomeTeam(e.target.value); setSelectedGame(null); }}>
                    <option value="">— Equipo local —</option>
                    {MLB_TEAMS.filter(t => t.name !== awayTeam).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <span style={S.label}>Visitante</span>
                  <select value={awayTeam} onChange={e => { setAwayTeam(e.target.value); setSelectedGame(null); }}>
                    <option value="">— Equipo visitante —</option>
                    {MLB_TEAMS.filter(t => t.name !== homeTeam).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {homeTeam && awayTeam && (
                <div style={{ padding:"10px 14px", background:"var(--bg-sub)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", textAlign:"center", marginBottom:"14px" }}>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"14px", fontWeight:"700", color:"var(--navy)" }}>{homeTeam}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)", margin:"0 12px", border:"1px solid var(--border)", borderRadius:"3px", padding:"2px 8px" }}>VS</span>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"14px", fontWeight:"700", color:"var(--navy)" }}>{awayTeam}</span>
                </div>
              )}

              {selectedGame && (selectedGame.teams?.home?.probablePitcher || selectedGame.teams?.away?.probablePitcher) && (
                <div style={{ padding:"8px 12px", background:"rgba(132,203,138,0.1)", border:"1px solid rgba(132,203,138,0.3)", borderRadius:"var(--r-sm)", marginBottom:"14px", display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)" }}>{selectedGame.teams?.home?.probablePitcher?.fullName || "TBD"}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--teal)" }}>{selectedGame.teams?.away?.probablePitcher?.fullName || "TBD"}</span>
                </div>
              )}

              <div style={{ marginBottom:"14px" }}>
                <button onClick={() => setShowExtra(!showExtra)} style={{
                  background:"none", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:"6px",
                  fontFamily:"'Inter',sans-serif", fontSize:"13px",
                  color: extra ? "var(--teal)" : "var(--muted)",
                }}>
                  <span style={{ width:"18px", height:"18px", border:"1px solid var(--border-md)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", transform:showExtra?"rotate(45deg)":"none", transition:"transform .2s" }}>+</span>
                  {extra ? "Contexto adicional activo" : "Agregar contexto"}
                </button>
                {showExtra && (
                  <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2}
                    placeholder="Lesiones, presión divisional, noticias de último momento..."
                    style={{ marginTop:"10px", resize:"vertical", lineHeight:"1.6" }} />
                )}
              </div>

              <button onClick={analyze} disabled={!canAnalyze}
                style={{
                  width:"100%", padding:"13px", background:"var(--teal)", color:"#fff",
                  border:"none", borderRadius:"var(--r)", fontSize:"13px", fontWeight:"700",
                  cursor: canAnalyze ? "pointer" : "not-allowed",
                  opacity: canAnalyze ? 1 : 0.5,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                }}>
                {loading ? (
                  <><span className="spin-anim" style={{ width:"14px", height:"14px", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block" }} /> {phase}</>
                ) : prediction ? "Regenerar análisis" : "Analizar — todos los mercados"}
              </button>

              {error && (
                <div style={{ marginTop:"10px", padding:"10px 14px", background:"rgba(200,16,46,0.06)", border:"1px solid rgba(200,16,46,0.2)", borderRadius:"var(--r-sm)", fontSize:"12px", color:"var(--red)" }}>{error}</div>
              )}
            </div>

            {/* Pick count */}
            {prediction && !loading && (
              <div style={{ ...S.card, textAlign:"center", minWidth:"120px" }}>
                <span style={S.label}>Picks EV+</span>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"36px", fontWeight:"700", color:"var(--teal)", lineHeight:1 }}>{picks.length}</div>
                <div style={{ fontSize:"11px", color:"var(--muted)", marginTop:"4px" }}>mercados</div>
              </div>
            )}
          </div>

          {/* Results */}
          {prediction && (
            <div>
              {resumen && (
                <div style={{ ...S.card, borderTop:"2px solid var(--teal)", marginBottom:"16px" }}>
                  <span style={S.label}>Análisis</span>
                  <p style={{ fontSize:"13px", lineHeight:"1.9", color:"var(--text-sub)", whiteSpace:"pre-wrap" }}>{resumen}</p>
                </div>
              )}

              {picks.length > 0 && (
                <div style={{ marginBottom:"16px" }}>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:"600", fontSize:"14px", color:"var(--navy)", marginBottom:"12px" }}>
                    Picks · {homeTeam?.split(" ").slice(-1)[0]} vs {awayTeam?.split(" ").slice(-1)[0]}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"10px" }}>
                    {picks.map((p,i) => (
                      <PickCard key={i} p={p} onAddToBankroll={onAddBet ? (pick) => onAddBet({ match:`${homeTeam?.split(" ").slice(-1)[0]} vs ${awayTeam?.split(" ").slice(-1)[0]}`, market:pick.mercado, pick:pick.pick, odds:pick.momio, stake:"", result:"pending", date:new Date().toISOString().split("T")[0], id:Date.now()+i }) : null} />
                    ))}
                  </div>
                </div>
              )}

              {parlay && (
                <div style={{ ...S.card, borderLeft:"3px solid #f59e0b", marginBottom:"10px" }}>
                  <span style={S.label}>Parlay sugerido</span>
                  <p style={{ fontSize:"13px", color:"var(--text-sub)", lineHeight:"1.7" }}>{parlay}</p>
                </div>
              )}

              {inv && (
                <div style={{ ...S.card, borderLeft:"3px solid var(--red)", marginBottom:"10px" }}>
                  <span style={S.label}>Invalidadores</span>
                  <p style={{ fontSize:"13px", color:"var(--muted)", lineHeight:"1.7", whiteSpace:"pre-wrap" }}>{inv}</p>
                </div>
              )}

              {pass && (
                <div style={{ background:"var(--bg-sub)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"14px 18px" }}>
                  <span style={S.label}>Sin valor — no apostar</span>
                  <p style={{ fontSize:"13px", color:"var(--faint)", lineHeight:"1.6" }}>{pass}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "all" && (
        <div>
          <div style={{ ...S.card, marginBottom:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
              <div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"16px", fontWeight:"700", color:"var(--navy)", marginBottom:"4px" }}>Analizar todos los partidos de hoy</div>
                <div style={{ fontSize:"13px", color:"var(--muted)" }}>{todayGames.length} partidos · Una llamada por partido · Se guardan automáticamente</div>
              </div>
              <button onClick={analyzeAll} disabled={allLoading || !todayGames.length}
                style={{
                  padding:"11px 22px", background:"var(--teal)", color:"#fff",
                  border:"none", borderRadius:"var(--r)", fontSize:"13px", fontWeight:"700",
                  cursor: allLoading ? "not-allowed" : "pointer", opacity: allLoading ? 0.7 : 1,
                  display:"flex", alignItems:"center", gap:"8px",
                }}>
                {allLoading ? <><span className="spin-anim" style={{ width:"13px", height:"13px", border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block" }} /> {allProgress.done}/{allProgress.total} analizados</> : "Analizar todos"}
              </button>
            </div>
            {allLoading && (
              <div style={{ marginTop:"14px" }}>
                <div style={{ background:"var(--bg-sub)", borderRadius:"4px", height:"4px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${allProgress.total > 0 ? allProgress.done/allProgress.total*100 : 0}%`, background:"var(--teal)", transition:"width .4s" }} />
                </div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)", marginTop:"6px" }}>Analizando partido {allProgress.done + 1} de {allProgress.total}...</div>
              </div>
            )}
          </div>

          {allResults.map((r,i) => {
            const top = r.picks?.sort((a,b) => b.confianza-a.confianza)[0];
            return (
              <div key={i} className="card-hover" style={{ ...S.card, marginBottom:"10px", cursor:"pointer" }}
                onClick={() => { const g = todayGames.find(g => { const hN=MLB_TEAMS.find(t=>t.id===g.teams?.home?.team?.id)?.name; const aN=MLB_TEAMS.find(t=>t.id===g.teams?.away?.team?.id)?.name; return hN===r.homeTeam&&aN===r.awayTeam; }); if(g){setSelectedGame(g);setTab("single");} }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"10px" }}>
                  <div>
                    <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"700", color:"var(--navy)" }}>
                      {r.homeTeam?.split(" ").slice(-1)[0]} <span style={{color:"var(--muted)",fontWeight:"400"}}>vs</span> {r.awayTeam?.split(" ").slice(-1)[0]}
                    </div>
                    {top && <div style={{ fontSize:"12px", color:"var(--muted)", marginTop:"2px" }}>{top.mercado}: {top.pick}</div>}
                  </div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {r.picks?.slice(0,3).map((p,j) => {
                      const col = p.confianza>=70?"var(--green)":p.confianza>=55?"#f59e0b":"var(--red)";
                      return <span key={j} style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:col, background:`${p.confianza>=70?"rgba(132,203,138,0.12)":p.confianza>=55?"rgba(245,158,11,0.12)":"rgba(200,16,46,0.08)"}`, border:`1px solid ${p.confianza>=70?"rgba(132,203,138,0.3)":p.confianza>=55?"rgba(245,158,11,0.3)":"rgba(200,16,46,0.2)"}`, borderRadius:"4px", padding:"3px 8px" }}>{p.confianza}% {p.mercado?.split(" ")[0]}</span>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {!allLoading && allResults.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px", color:"var(--muted)", fontSize:"13px" }}>
              <div style={{ fontSize:"20px", fontWeight:"700", color:"var(--faint)", marginBottom:"8px" }}>Sin análisis aún</div>
              Presiona "Analizar todos" para procesar los partidos de hoy
            </div>
          )}
        </div>
      )}
    </div>
  );
}
