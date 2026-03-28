import { useState, useEffect } from "react";
import { MLB_TEAMS } from "../constants/teams";
import { fetchStandingsAll } from "../lib/mlb";

const S = {
  card:  { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"18px 20px", boxShadow:"var(--shadow)" },
  label: { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"2px", color:"var(--muted)", textTransform:"uppercase", display:"block", marginBottom:"6px" },
  th:    { fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"1px", color:"var(--muted)", textTransform:"uppercase", padding:"6px 10px", textAlign:"left", borderBottom:"1px solid var(--border)", fontWeight:"600" },
  td:    { fontFamily:"'DM Mono',monospace", fontSize:"12px", color:"var(--text)", padding:"8px 10px", borderBottom:"1px solid var(--border)" },
};

function NewsItem({ item }) {
  return (
    <a href={item.link} target="_blank" rel="noreferrer" style={{
      display:"block", textDecoration:"none",
      padding:"12px 0",
      borderBottom:"1px solid var(--border)",
    }}>
      <div style={{ fontFamily:"'Inter',sans-serif", fontSize:"13px", fontWeight:"600", color:"var(--text)", marginBottom:"3px", lineHeight:"1.4" }}>
        {item.title}
      </div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"var(--muted)", letterSpacing:"0.5px" }}>
        {item.source} · {item.date}
      </div>
    </a>
  );
}

export default function Equipos() {
  const [standings,     setStandings]     = useState(null);
  const [loadStandings, setLoadStandings] = useState(true);
  const [news,          setNews]          = useState([]);
  const [loadNews,      setLoadNews]      = useState(true);
  const [newsError,     setNewsError]     = useState(false);
  const [tab,           setTab]           = useState("standings"); // standings | news
  const [league,        setLeague]        = useState("AL"); // AL | NL

  useEffect(() => {
    fetchStandingsAll()
      .then(setStandings)
      .catch(() => setStandings(null))
      .finally(() => setLoadStandings(false));

    // Fetch news via serverless function (bypasses CORS)
    fetch("/api/news")
      .then(r => r.json())
      .then(data => { setNews(data); setLoadNews(false); })
      .catch(() => { setNewsError(true); setLoadNews(false); });
  }, []);

  // fetchStandingsAll returns [{ divisionName, league, teams, season }]
  const divisions = standings
    ? standings
        .filter(d => d.league === league)
        .sort((a, b) => a.divisionName.localeCompare(b.divisionName))
        .map(d => [d.divisionName, d.teams])
    : [];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom:"24px" }}>
        <span style={S.label}>MLB 2025</span>
        <h1 style={{ fontFamily:"'Inter',sans-serif", fontSize:"clamp(20px,3vw,26px)", fontWeight:"800", color:"var(--navy)", marginBottom:"4px" }}>Equipos & Noticias</h1>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"20px" }}>
        {[["standings","Standings"],["news","Noticias MLB"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding:"8px 18px", borderRadius:"var(--r-sm)", border:`1px solid ${tab===v?"var(--teal)":"var(--border)"}`,
            background:tab===v?"rgba(24,132,133,0.1)":"var(--bg-card)",
            color:tab===v?"var(--teal)":"var(--muted)",
            fontSize:"12px", fontWeight:tab===v?"600":"400", cursor:"pointer",
          }}>{l}</button>
        ))}
      </div>

      {/* Standings */}
      {tab === "standings" && (
        <>
          <div style={{ display:"flex", gap:"6px", marginBottom:"18px" }}>
            {["AL","NL"].map(l => (
              <button key={l} onClick={() => setLeague(l)} style={{
                padding:"6px 20px", borderRadius:"var(--r-sm)", border:`1px solid ${league===l?"var(--navy)":"var(--border)"}`,
                background:league===l?"var(--navy)":"var(--bg-card)",
                color:league===l?"#fff":"var(--muted)",
                fontSize:"12px", fontWeight:"600", cursor:"pointer",
              }}>{l}</button>
            ))}
          </div>

          {loadStandings ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"14px" }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:"200px" }} />)}
            </div>
          ) : !standings ? (
            <div style={{ ...S.card, textAlign:"center", padding:"40px", color:"var(--muted)" }}>
              Error cargando standings. Verifica tu conexión.
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"14px" }}>
              {divisions.map(([divName, teams]) => (
                <div key={divName} style={S.card}>
                  <span style={{ ...S.label, marginBottom:"12px" }}>{divName}</span>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width:"30px", textAlign:"center" }}>#</th>
                        <th style={S.th}>Equipo</th>
                        <th style={{ ...S.th, textAlign:"right" }}>W</th>
                        <th style={{ ...S.th, textAlign:"right" }}>L</th>
                        <th style={{ ...S.th, textAlign:"right" }}>PCT</th>
                        <th style={{ ...S.th, textAlign:"right" }}>GB</th>
                        <th style={{ ...S.th, textAlign:"right" }}>L10</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((t, i) => {
                        const teamId = t.team?.id;
                        const abbr   = MLB_TEAMS.find(tm => tm.id === teamId)?.abbr || "?";
                        const name   = t.team?.name || "";
                        const l10    = t.records?.splitRecords?.find(r => r.type === "lastTen");
                        const l10str = l10 ? `${l10.wins}-${l10.losses}` : "—";
                        return (
                          <tr key={teamId} style={{ background:i===0?"rgba(24,132,133,0.04)":"transparent" }}>
                            <td style={{ ...S.td, textAlign:"center", color:"var(--muted)", fontSize:"10px" }}>{i+1}</td>
                            <td style={{ ...S.td, fontFamily:"'Inter',sans-serif", fontWeight:i===0?"700":"500" }}>
                              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:i===0?"var(--teal)":"var(--text)", marginRight:"6px" }}>{abbr}</span>
                              <span style={{ fontSize:"11px", color:"var(--muted)", display:"inline" }}>{name}</span>
                            </td>
                            <td style={{ ...S.td, textAlign:"right", fontWeight:"600" }}>{t.wins}</td>
                            <td style={{ ...S.td, textAlign:"right" }}>{t.losses}</td>
                            <td style={{ ...S.td, textAlign:"right", color:"var(--teal)" }}>{t.winningPercentage}</td>
                            <td style={{ ...S.td, textAlign:"right", color:"var(--muted)" }}>{t.gamesBack}</td>
                            <td style={{ ...S.td, textAlign:"right", fontSize:"10px", color:"var(--muted)" }}>{l10str}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* News */}
      {tab === "news" && (
        <div style={S.card}>
          {loadNews ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:"52px" }} />)}
            </div>
          ) : newsError ? (
            <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)", fontSize:"13px" }}>
              <div style={{ marginBottom:"8px" }}>No se pudieron cargar las noticias.</div>
              <div style={{ fontSize:"11px" }}>El endpoint <code>/api/news</code> solo funciona en producción (Vercel).</div>
            </div>
          ) : news.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px", color:"var(--muted)", fontSize:"13px" }}>Sin noticias disponibles.</div>
          ) : (
            <div>
              <span style={S.label}>{news.length} artículos recientes</span>
              {news.map((item, i) => <NewsItem key={i} item={item} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
