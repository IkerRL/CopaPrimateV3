// Datos compartidos de la Copa Primate
// Escala de puntos ascendente del 1 al 8 con límite de 16 pts
// TODAS las ediciones de la Copa Primate se disputan en 2026

export const RANKS = {
  Hierro: { points: 1, color: '#7d7d7d' },
  Bronce: { points: 2, color: '#b0773e' },
  Plata: { points: 3, color: '#c4cdd3' },
  Oro: { points: 4, color: '#f0c43c' },
  Platino: { points: 5, color: '#3fd2c7' },
  Diamante: { points: 6, color: '#c88cf0' },
  Ascendente: { points: 7, color: '#3ecf8e' },
  Inmortal: { points: 8, color: '#ff4f6d' },
  Radiante: { points: 8, color: '#fff2a8' },
};

// Equipos y clasificaciones de la Copa Primate Vol. III (se cargan dinámicamente desde el servidor)
export const TEAMS = [];

export const STANDINGS = [];

export const teamPoints = (team) =>
  Math.round(
    (team?.players || []).reduce((sum, p) => sum + (p.points !== undefined ? p.points : (RANKS[p.rank]?.points || 0)), 0) * 10
  ) / 10;
