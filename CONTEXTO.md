# THEGAMEAPP — Contexto del proyecto

## Stack
- React 19 + Vite 8, sin Tailwind — inline styles + CSS custom properties
- Vercel (deploy): serverless functions en `/api/`
- GitHub: github.com/boursebass/thegameapp

## Usuario
- Nombre de usuario: `coca` / contraseña: `coca123` (hardcoded en `src/components/Login.jsx`)
- Usa PC (desktop first), después se optimizará para móvil
- Idioma: **español siempre**, no cambiar sin autorización

---

## Estructura de archivos clave

```
src/
  App.jsx                  — Auth wrapper + Main (hooks separados para evitar violación de reglas)
  index.css                — Variables CSS, glassmorphism, skeleton, animaciones
  components/
    Login.jsx              — Pantalla de login con glass card
    TopNav.jsx             — Nav sticky con glassmorphism, gear icon para Settings
  views/
    Dashboard.jsx          — Home: hero partido + mini cards + news sidebar + standings
    Analizar.jsx           — Análisis de partidos con IA (Claude streaming)
    Equipos.jsx            — Standings por división (3 columnas) + noticias
    Predicciones.jsx       — Historial de predicciones guardadas
    Bankroll.jsx           — Gestión de capital y apuestas
    Estadisticas.jsx       — KPIs, barras P&L, reporte IA
    Settings.jsx           — API keys (Anthropic + Odds API), instrucciones personales
  constants/
    teams.js               — MLB_TEAMS (id, name, abbr, city), STADIUMS (lat/lon/nombre), PARK_NOTES
    stadiumPhotos.js       — Mapeo teamId → /stadiums/ABBR.jpg (biblioteca local, 30 estadios)
  lib/
    mlb.js                 — Todas las llamadas a statsapi.mlb.com
    claude.js              — callClaudeStream, buildPrompt, parsePicks, getResumen, etc.
    math.js                — computeBankroll
    storage.js             — localStorage con prefijo tga_
api/
  news.js                  — Vercel serverless: proxy RSS de MLB.com + CBS Sports
  analyze.js               — Vercel Edge: proxy Claude API (streaming)
public/
  stadiums/                — 30 fotos JPG de estadios (Wikimedia Commons, libre uso)
    ARI.jpg, ATL.jpg, BAL.jpg, BOS.jpg, CHC.jpg, CIN.jpg, CLE.jpg, COL.jpg
    CWS.jpg, DET.jpg, HOU.jpg, KC.jpg, LAA.jpg, LAD.jpg, MIA.jpg, MIL.jpg
    MIN.jpg, NYM.jpg, NYY.jpg, OAK.jpg, PHI.jpg, PIT.jpg, SD.jpg, SEA.jpg
    SF.jpg, STL.jpg, TB.jpg, TEX.jpg, TOR.jpg, WSH.jpg
vercel.json                — Config build Vite + funciones serverless
```

---

## Diseño / UI

### Paleta de colores
```css
--bg: #f0f7f4          /* fondo claro */
--bg-card: rgba(255,255,255,0.65)  /* glassmorphism en cards */
--navy: #184f6f
--teal: #188485
--green: #84cb8a
--red: #c8102e
--border: rgba(255,255,255,0.7)
```

### Glassmorphism
- Solo en cards, nav, tabs — NO en el fondo de la página
- CSS selector automático: `div[style*="var(--bg-card)"] { backdrop-filter: blur(16px) }`
- Fondo de página: claro (`#f0f7f4`) con blobs animados

### Hero del partido (Dashboard + Analizar)
- Fondo oscuro: `linear-gradient(160deg, #0a1e30, #184f6f, #0d3535)`
- Foto del estadio local: `/stadiums/{ABBR}.jpg` al 65-75% opacidad
- Overlay oscuro encima para legibilidad del texto
- Texto: blanco puro `#fff` con `textShadow` para destacar sobre la foto
- Labels VISITANTE/LOCAL en teal `#2dd4bf`
- Labels PITCHER en verde `#84cb8a`

---

## Dashboard (src/views/Dashboard.jsx)

### Layout
```
[Top bar: fecha + EN VIVO badge + bankroll stats]
[Grid: minmax(0,1fr) | 360px]
  LEFT:
    FeaturedGame hero (minHeight:320px, flex column)
    Mini games scroll (con logos 20px)
  RIGHT:
    News sidebar (8 noticias)
    Standings líderes (AL + NL, con logos)
```

### FeaturedGame
- Foto estadio local desde biblioteca local
- Layout: `display:flex` row — Away(flex:1) | Score(160px fixed) | Home(flex:1)
- `minWidth:0` en Away y Home para evitar overflow
- Auto-refresh cada 60 segundos (interval en App.jsx)
- Partido destacado = primero de la lista ordenada: EN VIVO → Programados → Finalizados

---

## Analizar (src/views/Analizar.jsx)

### Layout
```
[Header]
[Selector de partidos — cards horizontales con logos + pitchers + scores]
[Mini-hero oscuro con foto estadio + flechas ‹ › para navegar + dots indicadores]
[Pre-analysis stats (carga automática al seleccionar):
  - Pitchers probables (ERA, WHIP, K/9, IP + últimas 3 salidas)
  - Clima/Estadio (temp, viento, lluvia, techo)
  - Forma reciente (10 últimos, puntos verdes/rojos)
  - H2H 2025 (cards de enfrentamientos)
]
[Botón Analizar + contexto adicional opcional]
[Resultados IA: resumen, picks con EV/Kelly, parlay, invalidadores]
```

### Navegación entre partidos
- Flechas ‹ › sobre el mini-hero — ciclan en loop por `todayGames`
- Dots indicadores abajo del hero (también clickeables)
- Estado: `gameIdx` en useState, se sincroniza con `selectedGame`

### Análisis IA
- Claude API streaming via `/api/analyze.js` (Vercel Edge)
- Fuentes de datos: standings, forma reciente, pitcher stats, últimas 3 salidas,
  bullpen load, H2H, clima, odds (Odds API opcional), umpire
- Resultados parseados: picks con confianza%, EV, Kelly, momio, unidades
- Se cachean en localStorage por día

---

## Equipos (src/views/Equipos.jsx)
- 3 DivCards lado a lado (flex 1 1 280px)
- Toggle AL / NL
- Logos de equipos 30px desde midfield CDN
- Sección noticias abajo en grid 2 columnas

---

## APIs usadas

| API | URL base | Uso |
|-----|----------|-----|
| MLB Stats API | statsapi.mlb.com/api/v1 | Schedule, standings, pitcher stats, H2H, bullpen |
| Open-Meteo | api.open-meteo.com | Clima del estadio |
| Odds API | api.the-odds-api.com | Momios (key opcional del usuario) |
| Claude API | api.anthropic.com | Análisis streaming (key en Settings) |
| MLB logo CDN | midfield.mlbstatic.com/v1/team/{id}/spots/72 | Logos de equipos |

## Noticias
- Solo disponibles en producción (Vercel) — CORS via `/api/news.js`
- Fuentes: MLB.com RSS + CBS Sports RSS
- En dev muestra placeholder "Noticias disponibles en Vercel"

---

## Pendiente / Próximas tareas
- [ ] Arreglar navegación con flechas en Analizar (al cambiar partido con ‹ ›, las stats pre-análisis y el análisis de IA se deben resetear/recargar)
- [ ] Optimización mobile (después de terminar desktop)
- [ ] Comprimir imágenes grandes: BAL (4MB), LAD (2.7MB), WSH (4.8MB), CHC (1.4MB)
- [ ] Subir a Vercel cuando el usuario quiera

---

## Reglas de trabajo
1. **Idioma: español siempre** — no cambiar sin autorización del usuario
2. No agregar features no pedidas, no refactorizar código no solicitado
3. Confirmar antes de acciones destructivas (git force push, borrar archivos, etc.)
4. El usuario prefiere ver el resultado antes de confirmar — hacer cambios, mostrar, él decide
