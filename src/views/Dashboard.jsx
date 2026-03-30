import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { computeBankroll } from "../lib/math";
import { fetchStandingsAll } from "../lib/mlb";
import { MLB_TEAMS } from "../constants/teams";
import { getStadiumPhoto } from "../constants/stadiumPhotos";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase" },
};

/* ── Featured hero ─────────────────────────────────────────────── */
function FeaturedGame({ g, onAnalyze }) {
  const [bgImg, setBgImg] = useState(null);

  useEffect(() => {
    const homeId = g?.teams?.home?.team?.id;
    const awayId = g?.teams?.away?.team?.id;
    const local  = getStadiumPhoto(homeId, awayId);
    if (local) { setBgImg(local); return; }
    // fallback: rotar estadios icónicos según el día
    const fallbacks = ["/stadiums/LAD.jpg","/stadiums/NYY.jpg","/stadiums/BOS.jpg","/stadiums/CHC.jpg","/stadiums/SF.jpg"];
    setBgImg(fallbacks[new Date().getDay() % fallbacks.length]);
  }, [g?.gamePk]);

  // Foto de fallback cuando no hay partido — usar un estadio al azar de la biblioteca
  const FALLBACK_STADIUMS = ["/stadiums/LAD.jpg","/stadiums/NYY.jpg","/stadiums/BOS.jpg","/stadiums/CHC.jpg","/stadiums/SF.jpg"];
  const fallbackImg = FALLBACK_STADIUMS[new Date().getDay() % FALLBACK_STADIUMS.length];

  if (!g) return (
    <div style={{
      borderRadius:"var(--r)", overflow:"hidden",
      background:"linear-gradient(160deg, #0a1e30 0%, #184f6f 55%, #0d3535 100%)",
      position:"relative", minHeight:"320px",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`url(${fallbackImg})`,
        backgroundSize:"cover", backgroundPosition:"center 40%",
        opacity:0.65,
      }} />
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(160deg, rgba(6,14,22,0.65) 0%, rgba(10,30,50,0.45) 50%, rgba(4,20,20,0.70) 100%)",
      }} />
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"16px", fontWeight:"700", color:"#fff" }}>Sin partidos hoy</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.5)", marginTop:"6px", letterSpacing:"1px" }}>DESCANSA LA PELOTA</div>
      </div>
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
      position:"relative",
      display:"flex", flexDirection:"column",
      cursor:"pointer", minHeight:"320px",
    }} onClick={onAnalyze}>
      {/* Stadium photo background */}
      {bgImg && (
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${bgImg})`,
          backgroundSize:"cover", backgroundPosition:"center 40%",
          opacity:0.75,
          transition:"opacity 0.6s ease",
        }} />
      )}
      {/* Dark gradient overlay for readability */}
      <div style={{
        position:"absolute", inset:0,
        background: bgImg
          ? "linear-gradient(160deg, rgba(6,14,22,0.55) 0%, rgba(10,30,50,0.35) 50%, rgba(4,20,20,0.60) 100%)"
          : "linear-gradient(160deg, rgba(10,30,48,0.6) 0%, rgba(24,79,111,0.3) 55%, rgba(13,53,53,0.5) 100%)",
        pointerEvents:"none",
      }} />

      {/* Status bar */}
      <div style={{ padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {live && <span className="live-dot" />}
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", letterSpacing:"1.5px",
            color: live?"#f87171": fin?"rgba(255,255,255,0.35)":"#2dd4bf" }}>
            {live ? `EN VIVO · ${statusLabel}` : fin ? "FINAL" : `HOY · ${statusLabel}`}
          </span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.55)", letterSpacing:"0.5px" }}>
          {g.venue?.name || ""}
        </span>
      </div>

      {/* Matchup — flex row: Away | Score | Home */}
      <div style={{ flex:1, padding:"16px 32px 24px", position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:"0" }}>

        {/* Away team */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"#2dd4bf", letterSpacing:"2px", marginBottom:"10px" }}>VISITANTE</div>
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"6px" }}>
            <img
              src={`https://midfield.mlbstatic.com/v1/team/${g.teams?.away?.team?.id}/spots/72`}
              alt={aA} width="52" height="52"
              style={{ objectFit:"contain", flexShrink:0, filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
              onError={e=>e.target.style.display="none"}
            />
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"42px", fontWeight:"900",
                color:"#ffffff", letterSpacing:"-2px", lineHeight:1,
                textShadow:"0 2px 12px rgba(0,0,0,0.6)" }}>{aA}</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color:"rgba(255,255,255,0.75)", marginTop:"3px", whiteSpace:"nowrap" }}>{aCity} {aN}</div>
            </div>
          </div>
          {aRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"rgba(255,255,255,0.6)", marginBottom:"10px" }}>{aRec.wins}–{aRec.losses}</div>}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:"10px" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"#84cb8a", letterSpacing:"2px", marginBottom:"3px" }}>PITCHER</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.85)", fontWeight:"500" }}>{aPit}</div>
          </div>
        </div>

        {/* Center score / VS */}
        <div style={{ width:"160px", flexShrink:0, textAlign:"center", padding:"0 8px" }}>
          {hasScore ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"56px", fontWeight:"700",
                color: aWin?"#fff":"rgba(255,255,255,0.65)", lineHeight:1,
                textShadow:"0 2px 16px rgba(0,0,0,0.5)" }}>{aR}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"20px", color:"rgba(255,255,255,0.3)" }}>–</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"56px", fontWeight:"700",
                color: hWin?"#fff":"rgba(255,255,255,0.65)", lineHeight:1,
                textShadow:"0 2px 16px rgba(0,0,0,0.5)" }}>{hR}</span>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.45)", letterSpacing:"4px", marginBottom:"10px" }}>VS</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"30px", fontWeight:"800", color:"#ffffff", letterSpacing:"-0.5px", textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}>{gt}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"#2dd4bf", letterSpacing:"1px", marginTop:"6px" }}>HORA LOCAL</div>
            </div>
          )}
        </div>

        {/* Home team */}
        <div style={{ flex:1, minWidth:0, textAlign:"right" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"#2dd4bf", letterSpacing:"2px", marginBottom:"10px" }}>LOCAL</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"14px", marginBottom:"6px" }}>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"42px", fontWeight:"900",
                color:"#ffffff", letterSpacing:"-2px", lineHeight:1,
                textShadow:"0 2px 12px rgba(0,0,0,0.6)" }}>{hA}</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", color:"rgba(255,255,255,0.75)", marginTop:"3px", whiteSpace:"nowrap" }}>{hCity} {hN}</div>
            </div>
            <img
              src={`https://midfield.mlbstatic.com/v1/team/${g.teams?.home?.team?.id}/spots/72`}
              alt={hA} width="52" height="52"
              style={{ objectFit:"contain", flexShrink:0, filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
              onError={e=>e.target.style.display="none"}
            />
          </div>
          {hRec && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:"rgba(255,255,255,0.6)", marginBottom:"10px" }}>{hRec.wins}–{hRec.losses}</div>}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:"10px" }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"#84cb8a", letterSpacing:"2px", marginBottom:"3px", textAlign:"right" }}>PITCHER</div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.85)", fontWeight:"500", textAlign:"right" }}>{hPit}</div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding:"12px 24px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.5)", letterSpacing:"1px" }}>
          PARTIDO DESTACADO · CLICK PARA ANALIZAR
        </span>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:"700", color:"#2dd4bf" }}>
          Analizar con IA →
        </span>
      </div>
    </div>
  );
}

/* ── Mini game card ─────────────────────────────────────────────── */
function MiniGame({ g, onAnalyze }) {
  const hId = g.teams?.home?.team?.id;
  const aId = g.teams?.away?.team?.id;
  const hA  = MLB_TEAMS.find(t => t.id === hId)?.abbr || "?";
  const aA  = MLB_TEAMS.find(t => t.id === aId)?.abbr || "?";
  const hR  = g.teams?.home?.score;
  const aR  = g.teams?.away?.score;
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

  const teams = [
    { id:aId, abbr:aA, r:aR, win:aWin },
    { id:hId, abbr:hA, r:hR, win:hWin },
  ];

  return (
    <div className="card-hover" onClick={onAnalyze} style={{
      ...S.card, padding:"10px 12px", cursor:"pointer", minWidth:"148px", flexShrink:0,
      borderTop:`2px solid ${live?"var(--red)":fin?"var(--border)":"var(--teal)"}`,
    }}>
      {/* Status */}
      <div style={{ marginBottom:"8px" }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", fontWeight:"600",
          color: live?"var(--red)":fin?"var(--muted)":"var(--teal)" }}>
          {live && "● "}{statusLabel}
        </span>
      </div>
      {/* Teams */}
      {teams.map((t, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:i===0?"5px":0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <img
              src={`https://midfield.mlbstatic.com/v1/team/${t.id}/spots/72`}
              alt={t.abbr} width="20" height="20"
              style={{ objectFit:"contain", flexShrink:0 }}
              onError={e=>e.target.style.display="none"}
            />
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight:t.win?"700":"500", color:t.win?"var(--navy)":"var(--text)" }}>{t.abbr}</span>
          </div>
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

  const [featuredIdx, setFeaturedIdx] = useState(0);

  const stats   = computeBankroll(bankroll?.starting||0, bets);
  const pending = bets.filter(b => !b.result || b.result === "pending");
  const live    = todayGames.filter(g => g.status?.detailedState === "In Progress");

  const sorted = [
    ...todayGames.filter(g => g.status?.detailedState === "In Progress"),
    ...todayGames.filter(g => ["Scheduled","Pre-Game","Warmup"].includes(g.status?.detailedState))
      .sort((a,b)=>new Date(b.gameDate)-new Date(a.gameDate)),
    ...todayGames.filter(g=>["Final","Game Over","Completed Early"].includes(g.status?.detailedState)),
  ];
  const featured = sorted[featuredIdx] || sorted[0];
  const rest     = sorted.filter((_, i) => i !== featuredIdx);

  function navFeatured(dir) {
    if (!sorted.length) return;
    setFeaturedIdx(i => (i + dir + sorted.length) % sorted.length);
  }

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
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 360px", gap:"22px", alignItems:"start" }}>

        {/* LEFT */}
        <div>
          {/* Featured */}
          {loadingGames
            ? <div className="skeleton" style={{ height:"360px", borderRadius:"var(--r)", marginBottom:"14px" }} />
            : <div style={{ marginBottom:"14px", position:"relative" }}
                onMouseEnter={e=>{ e.currentTarget.querySelectorAll(".hero-nav").forEach(el=>el.style.opacity="1"); }}
                onMouseLeave={e=>{ e.currentTarget.querySelectorAll(".hero-nav").forEach(el=>el.style.opacity="0"); }}
              >
                <FeaturedGame g={featured} onAnalyze={()=>{ if(featured){onPickGame(featured);onNav("analizar");}}} />
                {/* Flechas navegación — se muestran solo al hacer hover */}
                {sorted.length > 1 && (<>
                  <button className="hero-nav" onClick={e=>{e.stopPropagation();navFeatured(-1);}} style={{
                    position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)",
                    zIndex:10, background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.18)",
                    borderRadius:"50%", width:"36px", height:"36px", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", backdropFilter:"blur(8px)",
                    opacity:"0", transition:"opacity .2s, background .15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.10)"}
                  ><ChevronLeft size={18} strokeWidth={2.5} /></button>
                  <button className="hero-nav" onClick={e=>{e.stopPropagation();navFeatured(1);}} style={{
                    position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)",
                    zIndex:10, background:"rgba(255,255,255,0.10)", border:"1px solid rgba(255,255,255,0.18)",
                    borderRadius:"50%", width:"36px", height:"36px", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", backdropFilter:"blur(8px)",
                    opacity:"0", transition:"opacity .2s, background .15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.22)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.10)"}
                  ><ChevronRight size={18} strokeWidth={2.5} /></button>
                  {/* Dots */}
                  <div className="hero-nav" style={{ position:"absolute", bottom:"10px", left:"50%", transform:"translateX(-50%)", zIndex:10, display:"flex", gap:"5px", opacity:"0", transition:"opacity .2s" }}>
                    {sorted.map((_,i) => (
                      <div key={i} onClick={e=>{e.stopPropagation();setFeaturedIdx(i);}} style={{
                        width: i===featuredIdx ? "18px" : "6px", height:"6px",
                        borderRadius:"3px", cursor:"pointer",
                        background: i===featuredIdx ? "#2dd4bf" : "rgba(255,255,255,0.35)",
                        transition:"all .2s",
                      }} />
                    ))}
                  </div>
                </>)}
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
                          <img
                            src={`https://midfield.mlbstatic.com/v1/team/${t.team?.id}/spots/72`}
                            alt={abbr} width="22" height="22"
                            style={{ objectFit:"contain" }}
                            onError={e => e.target.style.display="none"}
                          />
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
