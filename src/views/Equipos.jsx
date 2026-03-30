import { useState, useEffect } from "react";
import { MLB_TEAMS } from "../constants/teams";
import { fetchStandingsAll, fetchRecentForm } from "../lib/mlb";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block" },
};

const PLAYOFF_SPOTS = 3; // 1 líder + 2 wildcards por liga (simplificado)

/* ── Racha (últimos resultados) ── */
function FormDots({ form }) {
  if (!form?.length) return <span style={{ fontSize:"9px", color:"var(--muted)" }}>—</span>;
  const last5 = form.slice(-5);
  return (
    <div style={{ display:"flex", gap:"2px", alignItems:"center" }}>
      {last5.map((g, i) => (
        <div key={i} style={{
          width:"7px", height:"7px", borderRadius:"50%",
          background: g.won ? "var(--green)" : "var(--red)",
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

/* ── Barra de win% ── */
function PctBar({ pct }) {
  const v = parseFloat(pct || 0);
  const color = v >= 0.6 ? "var(--teal)" : v >= 0.5 ? "var(--green)" : v >= 0.4 ? "var(--yellow)" : "var(--red)";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
      <div style={{ width:"48px", height:"4px", background:"rgba(0,0,0,0.08)", borderRadius:"2px", overflow:"hidden" }}>
        <div style={{ width:`${v*100}%`, height:"100%", background:color, borderRadius:"2px", transition:"width .4s" }} />
      </div>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color, minWidth:"38px" }}>
        {v.toFixed(3)}
      </span>
    </div>
  );
}

/* ── Badge de posición playoff ── */
function PlayoffBadge({ pos, total }) {
  if (pos === 1) return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", fontWeight:"800", color:"#fff", background:"var(--teal)", borderRadius:"4px", padding:"1px 5px", letterSpacing:"0.5px" }}>LÍD</span>
  );
  if (pos <= 3) return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", fontWeight:"800", color:"var(--teal)", background:"rgba(24,132,133,0.12)", border:"1px solid rgba(24,132,133,0.3)", borderRadius:"4px", padding:"1px 5px" }}>WC</span>
  );
  if (pos === total) return (
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)", background:"rgba(0,0,0,0.05)", borderRadius:"4px", padding:"1px 5px" }}>—</span>
  );
  return null;
}

/* ── Division card ── */
function DivCard({ divName, teams, forms }) {
  return (
    <div style={{ ...S.card, overflow:"hidden", flex:"1 1 300px" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px 10px", borderBottom:"2px solid var(--border)", background:"rgba(24,79,111,0.03)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:"15px", fontWeight:"800", color:"var(--navy)", margin:0 }}>{divName}</h3>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"var(--muted)", letterSpacing:"1px" }}>2025</span>
      </div>

      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"rgba(0,0,0,0.01)" }}>
            <th style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"8px 16px", textAlign:"left", borderBottom:"1px solid var(--border)", fontWeight:"700" }}>EQUIPO</th>
            <th style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"8px 8px", textAlign:"center", borderBottom:"1px solid var(--border)", fontWeight:"700" }}>W</th>
            <th style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"8px 8px", textAlign:"center", borderBottom:"1px solid var(--border)", fontWeight:"700" }}>L</th>
            <th style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"8px 8px", textAlign:"left", borderBottom:"1px solid var(--border)", fontWeight:"700" }}>%</th>
            <th style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"8px 8px", textAlign:"center", borderBottom:"1px solid var(--border)", fontWeight:"700" }}>GB</th>
            <th style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"8px 12px 8px 4px", textAlign:"center", borderBottom:"1px solid var(--border)", fontWeight:"700" }}>ÚLT 5</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const teamId  = t.team?.id;
            const abbr    = MLB_TEAMS.find(tm => tm.id === teamId)?.abbr || "?";
            const city    = t.team?.locationName || "";
            const name    = t.team?.teamName || "";
            const isFirst = i === 0;
            const pct     = parseFloat(t.winningPercentage || 0);
            const form    = forms?.[teamId] || [];

            // Línea de corte playoff (entre pos 3 y 4 en la división)
            const showCut = i === 0 && teams.length > 1;

            return (
              <tr key={teamId}
                style={{
                  background: isFirst ? "rgba(24,132,133,0.03)" : "transparent",
                  transition:"background .12s",
                  borderLeft: isFirst ? "3px solid var(--teal)" : "3px solid transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(24,79,111,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background=isFirst?"rgba(24,132,133,0.03)":"transparent"}
              >
                {/* Equipo */}
                <td style={{ padding:"10px 16px", borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <img
                      src={`https://midfield.mlbstatic.com/v1/team/${teamId}/spots/72`}
                      alt={abbr} width="28" height="28"
                      style={{ objectFit:"contain", flexShrink:0 }}
                      onError={e => e.target.style.display="none"}
                    />
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700", color:isFirst?"var(--teal)":"var(--navy)" }}>{abbr}</span>
                        <PlayoffBadge pos={i+1} total={teams.length} />
                      </div>
                      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"10px", color:"var(--muted)" }}>{city} {name}</span>
                    </div>
                  </div>
                </td>
                {/* W */}
                <td style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"700", color:"var(--text)", padding:"10px 8px", textAlign:"center", borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
                  {t.wins}
                </td>
                {/* L */}
                <td style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", color:"var(--muted)", padding:"10px 8px", textAlign:"center", borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
                  {t.losses}
                </td>
                {/* PCT con barra */}
                <td style={{ padding:"10px 8px", borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
                  <PctBar pct={pct} />
                </td>
                {/* GB */}
                <td style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:"var(--muted)", padding:"10px 8px", textAlign:"center", borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
                  {!t.gamesBack || t.gamesBack === "-" ? <span style={{ color:"var(--teal)", fontWeight:"700" }}>—</span> : t.gamesBack}
                </td>
                {/* Forma últimos 5 */}
                <td style={{ padding:"10px 12px 10px 4px", borderBottom:"1px solid rgba(0,0,0,0.04)", textAlign:"center" }}>
                  <FormDots form={form} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── News item ── */
function NewsItem({ item, i }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" style={{
      display:"flex", gap:"12px", padding:"13px 0",
      borderBottom:"1px solid var(--border)", textDecoration:"none",
    }}
    onMouseEnter={e => e.currentTarget.style.opacity="0.7"}
    onMouseLeave={e => e.currentTarget.style.opacity="1"}
    >
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"700", color:"var(--teal)", minWidth:"20px", marginTop:"1px" }}>
        {String(i+1).padStart(2,"0")}
      </span>
      <div>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)", lineHeight:"1.45", marginBottom:"3px" }}>{item.title}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)" }}>{item.source} · {item.date}</div>
      </div>
    </a>
  );
}

/* ── Resumen liga (lideres + últimos) ── */
function LeagueSummary({ divisions, league }) {
  if (!divisions.length) return null;
  const allTeams = divisions.flatMap(d => d.teams.map(t => ({ ...t, div: d.divisionName })));
  const sorted   = [...allTeams].sort((a,b) => parseFloat(b.winningPercentage||0) - parseFloat(a.winningPercentage||0));
  const top3     = sorted.slice(0,3);
  const bot3     = sorted.slice(-3).reverse();

  return (
    <div style={{ display:"flex", gap:"14px", marginBottom:"20px", flexWrap:"wrap" }}>
      {/* Mejores */}
      <div style={{ ...S.card, flex:1, minWidth:"220px", padding:"16px 20px" }}>
        <div style={{ ...S.label, marginBottom:"12px" }}>Mejor record {league}</div>
        {top3.map((t, i) => {
          const teamId = t.team?.id;
          const abbr   = MLB_TEAMS.find(tm => tm.id === teamId)?.abbr || "?";
          const medals = ["01","02","03"];
          return (
            <div key={teamId} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:i<2?"10px":0 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", fontWeight:"800", color:"var(--teal)", minWidth:"20px" }}>{medals[i]}</span>
              <img src={`https://midfield.mlbstatic.com/v1/team/${teamId}/spots/72`} alt={abbr} width="22" height="22" style={{ objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700", color:"var(--navy)", flex:1 }}>{abbr}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:"700", color:"var(--teal)" }}>{t.wins}–{t.losses}</span>
            </div>
          );
        })}
      </div>
      {/* Peores */}
      <div style={{ ...S.card, flex:1, minWidth:"220px", padding:"16px 20px" }}>
        <div style={{ ...S.label, marginBottom:"12px" }}>Peor record {league}</div>
        {bot3.map((t, i) => {
          const teamId = t.team?.id;
          const abbr   = MLB_TEAMS.find(tm => tm.id === teamId)?.abbr || "?";
          return (
            <div key={teamId} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:i<2?"10px":0 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", color:"var(--muted)", minWidth:"16px" }}>#{allTeams.length - i}</span>
              <img src={`https://midfield.mlbstatic.com/v1/team/${teamId}/spots/72`} alt={abbr} width="22" height="22" style={{ objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700", color:"var(--navy)", flex:1 }}>{abbr}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:"700", color:"var(--red)" }}>{t.wins}–{t.losses}</span>
            </div>
          );
        })}
      </div>
      {/* Stats globales */}
      <div style={{ ...S.card, flex:1, minWidth:"220px", padding:"16px 20px" }}>
        <div style={{ ...S.label, marginBottom:"12px" }}>Liga {league}</div>
        {[
          { l:"Equipos",     v: allTeams.length },
          { l:"Juegos prom", v: allTeams.length ? Math.round(allTeams.reduce((a,t)=>(a + t.wins + t.losses),0)/allTeams.length) : 0 },
          { l:"Mayor racha", v: (() => { const t = sorted[0]; return t ? `${MLB_TEAMS.find(tm=>tm.id===t.team?.id)?.abbr} ${t.wins}G` : "—"; })() },
        ].map((s,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:i<2?"10px":0 }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"var(--muted)", letterSpacing:"0.5px" }}>{s.l}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:"700", color:"var(--navy)" }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Equipos() {
  const [standings,     setStandings]     = useState(null);
  const [loadStandings, setLoadStandings] = useState(true);
  const [news,          setNews]          = useState([]);
  const [loadNews,      setLoadNews]      = useState(true);
  const [newsError,     setNewsError]     = useState(false);
  const [league,        setLeague]        = useState("AL");
  const [forms,         setForms]         = useState({});

  useEffect(() => {
    fetchStandingsAll()
      .then(data => {
        setStandings(data);
        // Cargar forma reciente de todos los equipos en background
        const allTeams = data.flatMap(d => d.teams.map(t => t.team?.id)).filter(Boolean);
        allTeams.forEach(id => {
          fetchRecentForm(id)
            .then(f => setForms(prev => ({ ...prev, [id]: f })))
            .catch(() => {});
        });
      })
      .catch(()=>setStandings(null))
      .finally(()=>setLoadStandings(false));
    fetch("/api/news")
      .then(r=>r.json()).then(d=>{setNews(d);setLoadNews(false);})
      .catch(()=>{setNewsError(true);setLoadNews(false);});
  }, []);

  const divisions = standings
    ? standings.filter(d=>d.league===league).sort((a,b)=>a.divisionName.localeCompare(b.divisionName))
    : [];

  return (
    <div className="fade-up">

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <span style={S.label}>Temporada 2025</span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", margin:"6px 0 0" }}>
            Equipos & Noticias
          </h1>
        </div>
        <div style={{ display:"flex", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"3px", gap:"3px", backdropFilter:"blur(12px)" }}>
          {["AL","NL"].map(l => (
            <button key={l} onClick={()=>setLeague(l)} style={{
              padding:"7px 28px", borderRadius:"6px", border:"none",
              background:league===l?"var(--navy)":"transparent",
              color:league===l?"#fff":"var(--muted)",
              fontSize:"13px", fontWeight:"700", cursor:"pointer", transition:"all .15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Resumen de liga */}
      {!loadStandings && standings && <LeagueSummary divisions={divisions} league={league} />}

      {/* Standings — 3 divisiones */}
      <div style={{ display:"flex", gap:"14px", marginBottom:"28px", flexWrap:"wrap" }}>
        {loadStandings
          ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ flex:"1 1 300px", height:"280px" }}/>)
          : !standings
            ? <div style={{ ...S.card, padding:"40px", textAlign:"center", color:"var(--muted)", flex:1 }}>Error cargando standings.</div>
            : divisions.map(d=><DivCard key={d.divisionName} divName={d.divisionName} teams={d.teams} forms={forms}/>)
        }
      </div>

      {/* Leyenda */}
      <div style={{ display:"flex", gap:"16px", marginBottom:"24px", flexWrap:"wrap" }}>
        {[
          { color:"var(--teal)", label:"LÍD — Líder de división" },
          { color:"rgba(24,132,133,0.4)", label:"WC — Zona wildcard" },
          { color:"var(--green)", label:"● Victoria reciente" },
          { color:"var(--red)", label:"● Derrota reciente" },
        ].map((l,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:l.color }} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.5px" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Noticias */}
      <div style={{ ...S.card, padding:"20px 24px" }}>
        <h2 style={{ fontFamily:"'Inter',sans-serif", fontSize:"18px", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Latest News</h2>
        <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"1px", marginBottom:"6px" }}>MLB · NOTICIAS RECIENTES</p>
        {loadNews
          ? <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{ height:"52px"}}/>)}</div>
          : newsError
            ? <p style={{ color:"var(--muted)", fontSize:"13px", padding:"20px 0" }}>Noticias disponibles en producción (Vercel).</p>
            : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 32px" }}>
                {news.slice(0,10).map((item,i)=><NewsItem key={i} item={item} i={i}/>)}
              </div>
        }
      </div>
    </div>
  );
}
