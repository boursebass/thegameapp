import { useState, useEffect } from "react";
import { MLB_TEAMS } from "../constants/teams";
import { fetchStandingsAll } from "../lib/mlb";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block" },
};

function StreakBadge({ code }) {
  if (!code) return <span style={{ color:"var(--muted)", fontSize:"11px" }}>—</span>;
  const isW = code.startsWith("W");
  return (
    <span style={{
      fontFamily:"'DM Mono',monospace", fontSize:"10px", fontWeight:"700",
      color: isW ? "var(--teal)" : "var(--red)",
      background: isW ? "rgba(24,132,133,0.1)" : "rgba(200,16,46,0.08)",
      border: `1px solid ${isW ? "rgba(24,132,133,0.2)" : "rgba(200,16,46,0.15)"}`,
      borderRadius:"4px", padding:"1px 6px",
    }}>{code}</span>
  );
}

function WinBar({ wins, losses }) {
  const total = wins + losses;
  if (!total) return null;
  const pct = (wins / total) * 100;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
      <div style={{ flex:1, height:"4px", background:"rgba(200,16,46,0.15)", borderRadius:"2px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"var(--teal)", borderRadius:"2px", transition:"width .4s" }} />
      </div>
    </div>
  );
}

function DivisionTable({ divName, teams }) {
  const th = {
    fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1.5px",
    color:"var(--muted)", textTransform:"uppercase",
    padding:"10px 14px", textAlign:"right", borderBottom:"1px solid var(--border)",
    fontWeight:"600", whiteSpace:"nowrap",
  };
  const td = {
    fontFamily:"'DM Mono',monospace", fontSize:"12px",
    color:"var(--text)", padding:"10px 14px",
    borderBottom:"1px solid rgba(0,0,0,0.04)", textAlign:"right",
    whiteSpace:"nowrap",
  };

  return (
    <div style={{ ...S.card, overflow:"hidden" }}>
      {/* Division header */}
      <div style={{
        padding:"14px 20px",
        background:"rgba(24,79,111,0.04)",
        borderBottom:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:"10px",
      }}>
        <span style={{
          fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"700",
          color:"var(--navy)", letterSpacing:"-0.2px",
        }}>{divName}</span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"1px" }}>
          {teams.length} equipos
        </span>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:"560px" }}>
          <thead>
            <tr style={{ background:"rgba(0,0,0,0.01)" }}>
              <th style={{ ...th, textAlign:"left", paddingLeft:"20px", width:"36px" }}>#</th>
              <th style={{ ...th, textAlign:"left" }}>Equipo</th>
              <th style={th}>W</th>
              <th style={th}>L</th>
              <th style={{ ...th, color:"var(--teal)" }}>PCT</th>
              <th style={th}>GB</th>
              <th style={th}>Casa</th>
              <th style={th}>Visita</th>
              <th style={th}>L10</th>
              <th style={th}>Racha</th>
              <th style={{ ...th, paddingRight:"20px" }}>W%</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const teamId = t.team?.id;
              const abbr   = MLB_TEAMS.find(tm => tm.id === teamId)?.abbr || "?";
              const city   = t.team?.locationName || "";
              const name   = t.team?.teamName || t.team?.name?.split(" ").slice(-1)[0] || "";
              const l10    = t.records?.splitRecords?.find(r => r.type === "lastTen");
              const home   = t.records?.splitRecords?.find(r => r.type === "home");
              const away   = t.records?.splitRecords?.find(r => r.type === "away");
              const streak = t.streak?.streakCode;
              const isFirst = i === 0;

              return (
                <tr key={teamId} style={{
                  background: isFirst
                    ? "rgba(24,132,133,0.05)"
                    : i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)",
                  transition:"background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(24,79,111,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = isFirst ? "rgba(24,132,133,0.05)" : i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)"}
                >
                  {/* Rank */}
                  <td style={{ ...td, textAlign:"center", paddingLeft:"20px", color:"var(--muted)", fontSize:"11px", fontWeight: isFirst ? "700" : "400" }}>
                    {isFirst ? (
                      <span style={{ color:"var(--teal)" }}>{i+1}</span>
                    ) : i+1}
                  </td>

                  {/* Team */}
                  <td style={{ ...td, textAlign:"left", paddingLeft:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <img
                        src={`https://midfield.mlbstatic.com/v1/team/${teamId}/spots/72`}
                        alt={abbr}
                        width="28" height="28"
                        style={{ objectFit:"contain", flexShrink:0 }}
                        onError={e => { e.target.style.display="none"; }}
                      />
                      <div>
                        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"12px", fontWeight: isFirst ? "700" : "500", color:"var(--text)", lineHeight:1 }}>
                          {city} <span style={{ fontWeight:"400", color:"var(--muted)" }}>{name}</span>
                        </div>
                        <div style={{ marginTop:"4px" }}>
                          <WinBar wins={t.wins||0} losses={t.losses||0} />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td style={{ ...td, fontWeight:"700", color:"var(--text)" }}>{t.wins}</td>
                  <td style={{ ...td, color:"var(--muted)" }}>{t.losses}</td>
                  <td style={{ ...td, color:"var(--teal)", fontWeight:"600" }}>
                    {parseFloat(t.winningPercentage||0).toFixed(3)}
                  </td>
                  <td style={{ ...td, color:"var(--muted)" }}>
                    {t.gamesBack === "-" || !t.gamesBack ? <span style={{ color:"var(--teal)", fontWeight:"700" }}>—</span> : t.gamesBack}
                  </td>
                  <td style={{ ...td, fontSize:"11px" }}>
                    {home ? `${home.wins}-${home.losses}` : "—"}
                  </td>
                  <td style={{ ...td, fontSize:"11px" }}>
                    {away ? `${away.wins}-${away.losses}` : "—"}
                  </td>
                  <td style={{ ...td, fontSize:"11px" }}>
                    {l10 ? `${l10.wins}-${l10.losses}` : "—"}
                  </td>
                  <td style={{ ...td }}>
                    <StreakBadge code={streak} />
                  </td>
                  <td style={{ ...td, paddingRight:"20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", justifyContent:"flex-end" }}>
                      <div style={{ width:"40px", height:"4px", background:"rgba(0,0,0,0.08)", borderRadius:"2px", overflow:"hidden" }}>
                        <div style={{
                          height:"100%",
                          width:`${parseFloat(t.winningPercentage||0)*100}%`,
                          background: parseFloat(t.winningPercentage||0) >= 0.5 ? "var(--teal)" : "var(--red)",
                          borderRadius:"2px",
                        }} />
                      </div>
                      <span style={{ fontSize:"10px", color:"var(--muted)", minWidth:"28px" }}>
                        {(parseFloat(t.winningPercentage||0)*100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewsItem({ item }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" style={{
      display:"flex", gap:"14px", alignItems:"flex-start",
      textDecoration:"none", padding:"14px 0",
      borderBottom:"1px solid var(--border)",
      transition:"opacity .15s",
    }}
    onMouseEnter={e => e.currentTarget.style.opacity="0.75"}
    onMouseLeave={e => e.currentTarget.style.opacity="1"}
    >
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)", marginBottom:"4px", lineHeight:"1.5" }}>
          {item.title}
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.5px" }}>
          {item.source} · {item.date}
        </div>
      </div>
      <span style={{ fontSize:"14px", color:"var(--muted)", marginTop:"1px", flexShrink:0 }}>→</span>
    </a>
  );
}

export default function Equipos() {
  const [standings,     setStandings]     = useState(null);
  const [loadStandings, setLoadStandings] = useState(true);
  const [news,          setNews]          = useState([]);
  const [loadNews,      setLoadNews]      = useState(true);
  const [newsError,     setNewsError]     = useState(false);
  const [tab,           setTab]           = useState("standings");
  const [league,        setLeague]        = useState("AL");

  useEffect(() => {
    fetchStandingsAll()
      .then(setStandings)
      .catch(() => setStandings(null))
      .finally(() => setLoadStandings(false));

    fetch("/api/news")
      .then(r => r.json())
      .then(data => { setNews(data); setLoadNews(false); })
      .catch(() => { setNewsError(true); setLoadNews(false); });
  }, []);

  const divisions = standings
    ? standings
        .filter(d => d.league === league)
        .sort((a, b) => a.divisionName.localeCompare(b.divisionName))
        .map(d => [d.divisionName, d.teams])
    : [];

  // League summary stats
  const leagueTeams = standings
    ? standings.filter(d => d.league === league).flatMap(d => d.teams)
    : [];
  const totalGames = leagueTeams.reduce((s, t) => s + (t.wins||0) + (t.losses||0), 0) / 2;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <span style={S.label}>Temporada 2025</span>
          <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", margin:"6px 0 4px" }}>
            Equipos & Noticias
          </h1>
          {standings && (
            <p style={{ fontSize:"12px", color:"var(--muted)" }}>
              {leagueTeams.length} equipos · {Math.round(totalGames)} partidos jugados
            </p>
          )}
        </div>

        {/* Liga toggle */}
        <div style={{
          display:"flex", background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:"var(--r-sm)", padding:"3px", gap:"3px",
          backdropFilter:"blur(12px)", boxShadow:"var(--shadow)",
        }}>
          {["AL","NL"].map(l => (
            <button key={l} onClick={() => setLeague(l)} style={{
              padding:"7px 24px", borderRadius:"6px",
              border:"none",
              background: league===l ? "var(--navy)" : "transparent",
              color: league===l ? "#fff" : "var(--muted)",
              fontSize:"13px", fontWeight:"700", cursor:"pointer",
              transition:"all .15s", letterSpacing:"0.5px",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"20px" }}>
        {[["standings","Standings"],["news","Noticias MLB"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding:"8px 20px", borderRadius:"var(--r-sm)",
            border:`1px solid ${tab===v ? "var(--teal)" : "var(--border)"}`,
            background: tab===v ? "rgba(24,132,133,0.1)" : "var(--bg-card)",
            color: tab===v ? "var(--teal)" : "var(--muted)",
            fontSize:"12px", fontWeight: tab===v ? "600" : "400", cursor:"pointer",
            backdropFilter:"blur(12px)",
          }}>{l}</button>
        ))}
      </div>

      {/* Standings */}
      {tab === "standings" && (
        <>
          {loadStandings ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:"220px" }} />)}
            </div>
          ) : !standings ? (
            <div style={{ ...S.card, textAlign:"center", padding:"40px", color:"var(--muted)" }}>
              Error cargando standings.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {divisions.map(([divName, teams]) => (
                <DivisionTable key={divName} divName={divName} teams={teams} />
              ))}
            </div>
          )}
        </>
      )}

      {/* News */}
      {tab === "news" && (
        <div style={{ ...S.card, padding:"20px 24px" }}>
          {loadNews ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:"56px" }} />)}
            </div>
          ) : newsError ? (
            <div style={{ textAlign:"center", padding:"48px", color:"var(--muted)", fontSize:"13px" }}>
              <div style={{ fontSize:"24px", marginBottom:"12px" }}>📡</div>
              <div style={{ fontWeight:"600", marginBottom:"6px" }}>Noticias no disponibles en local</div>
              <div style={{ fontSize:"11px" }}>El proxy <code>/api/news</code> solo funciona en Vercel (producción).</div>
            </div>
          ) : news.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px", color:"var(--muted)" }}>Sin noticias disponibles.</div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                <span style={S.label}>{news.length} artículos recientes</span>
              </div>
              {news.map((item, i) => <NewsItem key={i} item={item} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
