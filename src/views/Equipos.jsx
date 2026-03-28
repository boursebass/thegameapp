import { useState, useEffect } from "react";
import { MLB_TEAMS } from "../constants/teams";
import { fetchStandingsAll } from "../lib/mlb";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block" },
};

const col = {
  th: {
    fontFamily:"'DM Mono',monospace", fontSize:"10px", letterSpacing:"1px",
    color:"var(--muted)", textTransform:"uppercase",
    padding:"10px 12px", textAlign:"right",
    borderBottom:"2px solid var(--border)", fontWeight:"700",
    whiteSpace:"nowrap", background:"rgba(0,0,0,0.01)",
  },
  td: {
    fontFamily:"'DM Mono',monospace", fontSize:"13px",
    color:"var(--text)", padding:"10px 12px",
    borderBottom:"1px solid rgba(0,0,0,0.04)", textAlign:"right",
    whiteSpace:"nowrap",
  },
};

/* ── One division card ── */
function DivCard({ divName, teams }) {
  return (
    <div style={{ ...S.card, overflow:"hidden", flex:"1 1 280px" }}>
      {/* Header */}
      <div style={{ padding:"14px 16px 10px", borderBottom:"2px solid var(--border)" }}>
        <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:"16px", fontWeight:"800", color:"var(--navy)", margin:0 }}>{divName}</h3>
      </div>

      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th style={{ ...col.th, textAlign:"left", paddingLeft:"16px", width:"55%" }}>TEAM</th>
            <th style={col.th}>W</th>
            <th style={col.th}>L</th>
            <th style={col.th}>%</th>
            <th style={{ ...col.th, paddingRight:"16px" }}>GB</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const teamId = t.team?.id;
            const abbr   = MLB_TEAMS.find(tm => tm.id === teamId)?.abbr || "?";
            const city   = t.team?.locationName || "";
            const name   = t.team?.teamName || "";
            const isFirst = i === 0;
            return (
              <tr key={teamId}
                style={{ background: isFirst ? "rgba(24,132,133,0.04)" : "transparent", transition:"background .12s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(24,79,111,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background= isFirst?"rgba(24,132,133,0.04)":"transparent"}
              >
                {/* Team */}
                <td style={{ ...col.td, textAlign:"left", paddingLeft:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <img
                      src={`https://midfield.mlbstatic.com/v1/team/${teamId}/spots/72`}
                      alt={abbr} width="30" height="30"
                      style={{ objectFit:"contain", flexShrink:0 }}
                      onError={e => e.target.style.display="none"}
                    />
                    <div>
                      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700", color: isFirst?"var(--teal)":"var(--navy)" }}>{abbr}</span>
                      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:"11px", color:"var(--muted)", marginLeft:"6px" }}>{city} {name}</span>
                    </div>
                  </div>
                </td>
                {/* W */}
                <td style={{ ...col.td, fontWeight:"700" }}>{t.wins}</td>
                {/* L */}
                <td style={{ ...col.td, color:"var(--muted)" }}>{t.losses}</td>
                {/* PCT */}
                <td style={{ ...col.td, color:isFirst?"var(--teal)":"var(--text)", fontWeight:isFirst?"700":"400" }}>
                  {parseFloat(t.winningPercentage||0).toFixed(3)}
                </td>
                {/* GB */}
                <td style={{ ...col.td, color:"var(--muted)", paddingRight:"16px" }}>
                  {t.gamesBack==="-"||!t.gamesBack ? <span style={{ color:"var(--teal)" }}>—</span> : t.gamesBack}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── News ── */
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

/* ── Main ── */
export default function Equipos() {
  const [standings,     setStandings]     = useState(null);
  const [loadStandings, setLoadStandings] = useState(true);
  const [news,          setNews]          = useState([]);
  const [loadNews,      setLoadNews]      = useState(true);
  const [newsError,     setNewsError]     = useState(false);
  const [league,        setLeague]        = useState("AL");

  useEffect(() => {
    fetchStandingsAll()
      .then(setStandings).catch(()=>setStandings(null))
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
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <span style={S.label}>Temporada 2025</span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", margin:"6px 0 0" }}>
            Equipos & Noticias
          </h1>
        </div>

        {/* AL / NL toggle */}
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

      {/* Standings — 3 divisions side by side */}
      <div style={{ display:"flex", gap:"14px", marginBottom:"28px", flexWrap:"wrap" }}>
        {loadStandings
          ? [1,2,3].map(i=><div key={i} className="skeleton" style={{ flex:"1 1 280px", height:"260px" }}/>)
          : !standings
            ? <div style={{ ...S.card, padding:"40px", textAlign:"center", color:"var(--muted)", flex:1 }}>Error cargando standings.</div>
            : divisions.map(d=><DivCard key={d.divisionName} divName={d.divisionName} teams={d.teams}/>)
        }
      </div>

      {/* News */}
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
