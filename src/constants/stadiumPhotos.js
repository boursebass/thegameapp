// Fotos locales de estadios — mapeadas por teamId del equipo local
// Imágenes en /public/stadiums/{ABBR}.jpg
// Si el partido es en el mismo ciudad (LAD vs LAA), se usa el estadio del local

const STADIUM_PHOTOS = {
  108: "/stadiums/LAA.jpg",  // Angel Stadium
  109: "/stadiums/ARI.jpg",  // Chase Field
  110: "/stadiums/BAL.jpg",  // Camden Yards
  111: "/stadiums/BOS.jpg",  // Fenway Park
  112: "/stadiums/CHC.jpg",  // Wrigley Field
  113: "/stadiums/CIN.jpg",  // Great American Ball Park
  114: "/stadiums/CLE.jpg",  // Progressive Field
  115: "/stadiums/COL.jpg",  // Coors Field
  116: "/stadiums/DET.jpg",  // Comerica Park
  117: "/stadiums/HOU.jpg",  // Minute Maid Park
  118: "/stadiums/KC.jpg",   // Kauffman Stadium
  119: "/stadiums/LAD.jpg",  // Dodger Stadium
  120: "/stadiums/WSH.jpg",  // Nationals Park
  121: "/stadiums/NYM.jpg",  // Citi Field
  133: "/stadiums/OAK.jpg",  // Sutter Health Park
  134: "/stadiums/PIT.jpg",  // PNC Park
  135: "/stadiums/SD.jpg",   // Petco Park
  136: "/stadiums/SEA.jpg",  // T-Mobile Park
  137: "/stadiums/SF.jpg",   // Oracle Park
  138: "/stadiums/STL.jpg",  // Busch Stadium
  139: "/stadiums/TB.jpg",   // Tropicana Field
  140: "/stadiums/TEX.jpg",  // Globe Life Field
  141: "/stadiums/TOR.jpg",  // Rogers Centre
  142: "/stadiums/MIN.jpg",  // Target Field
  143: "/stadiums/PHI.jpg",  // Citizens Bank Park
  144: "/stadiums/ATL.jpg",  // Truist Park
  145: "/stadiums/CWS.jpg",  // Guaranteed Rate Field
  146: "/stadiums/MIA.jpg",  // loanDepot park
  147: "/stadiums/NYY.jpg",  // Yankee Stadium
  158: "/stadiums/MIL.jpg",  // American Family Field
};

export function getStadiumPhoto(homeTeamId, awayTeamId) {
  // Usa el estadio del equipo local
  // Si no existe foto del local, intenta con el visitante
  return STADIUM_PHOTOS[homeTeamId] || STADIUM_PHOTOS[awayTeamId] || null;
}
