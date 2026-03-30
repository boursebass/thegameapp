import { storage } from "./storage";

export async function callClaude(prompt, maxTokens = 300) {
  const key = storage.getAnthropicKey();
  if (!key) throw new Error("Sin API key — configura tu Anthropic key en Ajustes");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || `API ${res.status}`);
  return d.content?.[0]?.text?.trim() || "";
}

export async function callClaudeStream(prompt, onChunk, maxTokens = 1800) {
  const key = storage.getAnthropicKey();
  if (!key) throw new Error("Sin API key — configura tu Anthropic key en Ajustes");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) { const d = await res.json(); throw new Error(d.error?.message || `API ${res.status}`); }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "", buf = "";
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop();
    for (const ln of lines) {
      if (!ln.startsWith("data: ")) continue;
      const raw = ln.slice(6); if (raw === "[DONE]") continue;
      try {
        const p = JSON.parse(raw);
        if (p.type === "content_block_delta" && p.delta?.text) { full += p.delta.text; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
export function buildPrompt({ homeTeam, awayTeam, context, hSt, aSt, homeForm, awayForm, hPitcher, aPitcher, hPS, aPS, hLast3, aLast3, h2h, weather, odds, umpire, bullpenHome, bullpenAway, personalInstructions, betHistory }) {
  const fmt  = n => n ? (n > 0 ? "+" : "") + n : "N/D";
  const fmtSt = (s, n) => !s ? `${n}: sin datos` :
    `${n}: ${s.wins}W-${s.losses}L | .${String(s.pct).split(".")[1]||"---"} | ${s.divRank}° ${s.divName} | Liga ${s.lgRank}° | Ult.10: ${s.l10w}-${s.l10l} | Dif: ${s.rs-s.ra>=0?"+":""}${s.rs-s.ra} | Casa: ${s.homeW??"-"}-${s.homeL??"-"} | Visita: ${s.awayW??"-"}-${s.awayL??"-"}${s.streak?` | Racha: ${s.streak}`:""}`;
  const fmtForm = (g, n) => !g?.length ? `${n}: sin datos` :
    `${n} [${g.filter(x=>x.won).length}/${g.length}]: ${g.map(x=>`${x.won?"G":"P"}${x.mine}-${x.opp}(${x.isHome?"L":"V"})`).join(" ")} | Prom RC: ${(g.reduce((a,x)=>a+x.mine,0)/g.length).toFixed(1)}`;
  const fmtP = (n, s) => !n ? "TBD" : !s ? `${n} — sin stats 2025` :
    `${n}: ERA ${s.era} | WHIP ${s.whip} | ${s.ip}IP/${s.gs}AP | K/9: ${s.k9} | BB/9: ${s.bb9} | HR: ${s.hr} | Rec ${s.w}-${s.l} | BAA: ${s.avg}`;
  const fmtL3 = (starts, n) => !starts?.length ? `${n}: sin aperturas previas` :
    `${n} — últimas 3:\n` + starts.map(s=>`   ${s.date} vs ${s.opp}: ${s.ip}IP, ${s.h}H, ${s.er}ER, ${s.bb}BB, ${s.k}K [${s.result}]`).join("\n");
  const fmtH2H = g => !g?.length ? "Sin H2H" : g.map(x=>`${x.date}: ${x.home} ${x.hs}-${x.as} ${x.away}`).join(" | ");
  const fmtW = w => !w ? "No disponible" :
    `${w.stadium}: ${w.temp}F | Viento ${w.wind}mph ${w.wdir} | ${w.desc} | Lluvia: ${w.rain}%${w.roof?" | TECHO CERRADO":""}${w.altitude?` | Altitud: ${w.altitude} pies`:""}${w.note?"\n   FACTOR ESTADIO: "+w.note:""}`;
  const fmtOdds = o => !o ? "Sin acceso al mercado" : !o.found ? "Partido no localizado en API" :
    `${o.bookmaker} | ML: Local ${fmt(o.hml)} (impl:${o.implH||"?"}%) / Visita ${fmt(o.aml)}
   Run Line: ${o.hsp?.point>0?"+":""}${o.hsp?.point||"-"} (${fmt(o.hsp?.price)}) / ${o.asp?.point>0?"+":""}${o.asp?.point||"-"} (${fmt(o.asp?.price)})
   Totales: O${o.over?.point} (${fmt(o.over?.price)}) / U${o.under?.point} (${fmt(o.under?.price)})`;
  const fmtBullpen = (bp, name) => !bp||!Object.keys(bp).length ? `${name}: sin datos` :
    `${name}: `+Object.entries(bp).map(([p,apps])=>`${p} ${apps.length}x`).join(", ");

  const historySummary = (() => {
    if (!betHistory?.length) return null;
    const settled = betHistory.filter(b => b.result && b.result !== "pending");
    if (!settled.length) return null;
    const wins = settled.filter(b => b.result === "W").length;
    const wr = ((wins/settled.length)*100).toFixed(0);
    return `HISTORIAL (${settled.length} apuestas): Win Rate ${wr}% | Últimas 5: ${settled.slice(-5).map(b=>`${b.match||"?"}[${b.result}]`).join(",")}`;
  })();

  return `Eres el modelo de predicción MLB más rentable. Tu único objetivo: identificar apuestas con VALOR ESPERADO POSITIVO real.

REGLA CORE: Solo recomiendas picks cuando tu prob estimada > prob implícita del momio. Sin valor = sin pick.

FECHA: ${new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
PARTIDO: ${homeTeam} (LOCAL) vs ${awayTeam} (VISITANTE)
${context?`CONTEXTO: ${context}`:""}
${personalInstructions?`INSTRUCCIONES DEL APOSTADOR:\n${personalInstructions}`:""}
${historySummary?`\n${historySummary}`:""}

════ STANDINGS ════
${fmtSt(hSt,homeTeam)}
${fmtSt(aSt,awayTeam)}

════ FORMA RECIENTE (12 juegos) ════
${fmtForm(homeForm,homeTeam)}
${fmtForm(awayForm,awayTeam)}

════ MONTÍCULO ════
LOCAL:     ${fmtP(hPitcher?.fullName,hPS)}
VISITANTE: ${fmtP(aPitcher?.fullName,aPS)}

════ ÚLTIMAS 3 APERTURAS ════
${fmtL3(hLast3,hPitcher?.fullName||"Local")}
${fmtL3(aLast3,aPitcher?.fullName||"Visitante")}

════ BULLPEN (últimos 3 días) ════
${fmtBullpen(bullpenHome,homeTeam)} | ${fmtBullpen(bullpenAway,awayTeam)}

════ UMPIRE ════
${umpire?`${umpire} — evalúa zona expansiva vs restrictiva`:"No confirmado"}

════ H2H RECIENTE ════
${fmtH2H(h2h)}

════ CLIMA Y ESTADIO ════
${fmtW(weather)}

════ CUOTAS EN VIVO ════
${fmtOdds(odds)}

════════════════════════════════════════
PROCESO OBLIGATORIO:
1. Calcula tu prob real estimada por mercado
2. Calcula la prob implícita del momio
3. Solo genera pick si prob real > prob implícita (EV positivo)
4. Aplica Kelly fraccional (25% Kelly)

FORMATO DE RESPUESTA:

**RESUMEN** (3 líneas max)

---PICK---
Mercado: [ML / Run Line / Over X.X / Under X.X / Props]
Pick: [decisión específica]
ProbReal: [X%]
ProbImplicita: [X%]
EV: [+X%]
Kelly: [X% del bankroll]
Confianza: [X%]
Momio: [número americano]
Unidades: [1-3]
Razon: [una línea — el edge específico]
---FIN---

**PARLAY +EV**: [solo si 2-3 picks independientes con EV+, si no "No hay parlay de valor"]
**INVALIDADORES**: [2 eventos que cancelarían el análisis]
**PASS**: [mercados sin valor — importante para disciplina]

REGLA DE ORO: Es mejor no apostar que apostar sin edge.`;
}

// ── PARSERS ───────────────────────────────────────────────────────────────
export function parsePicks(text) {
  const picks = [];
  const blocks = text.split(/---PICK---/).slice(1);
  for (const b of blocks) {
    const end   = b.indexOf("---FIN---");
    const block = end >= 0 ? b.slice(0, end) : b;
    const get   = key => { const m = block.match(new RegExp(key+":\\s*(.+)","i")); return m ? m[1].trim() : ""; };
    const mercado = get("Mercado"); if (!mercado) continue;
    const probReal = parseFloat(get("ProbReal")?.replace(/[%\s]/g,"")) || 0;
    const probImpl = parseFloat(get("ProbImplicita")?.replace(/[%\s]/g,"")) || 0;
    const evStr    = get("EV");
    const evNum    = parseFloat(evStr?.replace(/[+%\s]/g,"")) || (probReal > probImpl ? probReal - probImpl : 0);
    picks.push({
      mercado, pick: get("Pick"), confianza: parseInt(get("Confianza")) || 0,
      momio: get("Momio"), unidades: get("Unidades"), razon: get("Razon"),
      probReal, probImpl, ev: evNum, evStr,
      kelly: parseFloat(get("Kelly")) || 0, kellyStr: get("Kelly"),
    });
  }
  return picks;
}

export const getResumen      = t => { const m = t.match(/\*\*RESUMEN\*\*\s*([\s\S]*?)(?=---PICK---|$)/i); return m ? m[1].trim() : ""; };
export const getParlayLine   = t => { const m = t.match(/\*\*PARLAY \+?EV\*\*:\s*(.+)/i); return m ? m[1].trim() : ""; };
export const getInvalidadores= t => { const m = t.match(/\*\*INVALIDADORES\*\*:\s*([\s\S]*?)(?=\*\*|$)/i); return m ? m[1].trim() : ""; };
export const getPassLine     = t => { const m = t.match(/\*\*PASS\*\*:\s*(.+)/i); return m ? m[1].trim() : ""; };

// ── DAILY PICKS ───────────────────────────────────────────────────────────
export function buildDailyPicksPrompt(games, bankroll, casino) {
  const fecha = new Date().toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const lista = games.map((g, i) => {
    const hName = g.teams?.home?.team?.name  || "?";
    const aName = g.teams?.away?.team?.name  || "?";
    const hAbbr = g.teams?.home?.team?.abbreviation || "?";
    const aAbbr = g.teams?.away?.team?.abbreviation || "?";
    const hPit  = g.teams?.home?.probablePitcher?.fullName || "TBD";
    const aPit  = g.teams?.away?.probablePitcher?.fullName || "TBD";
    const time  = g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}) : "--";
    const live  = g.status?.detailedState === "In Progress";
    const fin   = ["Final","Game Over","Completed Early"].includes(g.status?.detailedState);
    return `${i+1}. ${aName} (${aAbbr}) VISITA vs ${hName} (${hAbbr}) LOCAL — ${live?"EN VIVO":fin?"FINAL":time}\n   Lanzadores: ${aPit} (V) vs ${hPit} (L)`;
  }).join("\n\n");

  return `Eres un analista de apuestas MLB de élite. Hoy es ${fecha}.
El apostador juega en ${casino} con un bankroll de sesión de $${bankroll} USD.

PARTIDOS DE HOY (${games.length} juegos):
${lista}

TAREA: Analiza cada partido con los datos disponibles e identifica los picks con mayor valor esperado para HOY. Sé selectivo — es mejor 2 picks sólidos que 6 mediocres.

REGLA CORE: Solo recomienda picks donde estimes prob real > prob implícita del momio típico del mercado.

FORMATO OBLIGATORIO — usa exactamente estas etiquetas:

---PICK---
Partido: [ABBR_V vs ABBR_L]
Mercado: [Moneyline / Run Line / Over X.X / Under X.X]
Pick: [selección exacta, ej: NYY / Over 8.5 / LAD -1.5]
Momio: [momio americano estimado, ej: -130]
Confianza: [50-85]%
Unidades: [0.5 / 1 / 1.5 / 2]
Razon: [1 línea — el edge específico]
---FIN---

(repite para cada pick recomendado, máximo 4)

---PARLAY---
[Lista los picks del parlay en formato "ABBR_V vs ABBR_L | Mercado | Pick | Momio", uno por línea]
[Solo incluye parlay si hay 2-3 picks independientes con valor. Si no, escribe "Sin parlay de valor hoy."]
---FIN_PARLAY---

---RESUMEN_DIA---
[2-3 líneas resumiendo la jornada y el razonamiento general]
---FIN_RESUMEN---`;
}

export function parseDailyPicks(text) {
  // Picks
  const picks = [];
  const blocks = text.split(/---PICK---/).slice(1);
  for (const b of blocks) {
    const end   = b.indexOf("---FIN---");
    const block = end >= 0 ? b.slice(0, end) : b;
    const get   = key => { const m = block.match(new RegExp(key+":\\s*(.+)","i")); return m ? m[1].trim() : ""; };
    const mercado = get("Mercado"); if (!mercado) continue;
    picks.push({
      id:         Date.now() + Math.random(),
      partido:    get("Partido"),
      mercado,
      pick:       get("Pick"),
      momio:      get("Momio"),
      confianza:  parseInt(get("Confianza")) || 60,
      unidades:   parseFloat(get("Unidades")) || 1,
      razon:      get("Razon"),
      result:     "pending",
    });
  }

  // Parlay legs
  const parlayMatch = text.match(/---PARLAY---([\s\S]*?)---FIN_PARLAY---/i);
  const parlayLegs  = [];
  if (parlayMatch) {
    const lines = parlayMatch[1].trim().split("\n").filter(l => l.includes("|"));
    for (const line of lines) {
      const parts = line.split("|").map(s => s.trim());
      if (parts.length >= 4) {
        parlayLegs.push({ id: Date.now() + Math.random(), partido: parts[0], mercado: parts[1], pick: parts[2], momio: parts[3] });
      }
    }
  }

  // Resumen
  const resumenMatch = text.match(/---RESUMEN_DIA---([\s\S]*?)---FIN_RESUMEN---/i);
  const resumen = resumenMatch ? resumenMatch[1].trim() : "";

  return { picks, parlayLegs, resumen };
}
