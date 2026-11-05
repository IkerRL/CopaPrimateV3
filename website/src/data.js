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

// Equipos de la Copa Primate Vol. III (2026)
// En esta copa los rosters se encuentran ocultos hasta la fecha oficial de revelación
export const TEAMS = [
  {
    id: 1,
    name: 'Los Monos',
    logo: '/monkeys.jpg',
    hidden: false,
    cupsPlayed: '3 Copas (2026)',
    cupsCount: 3,
    topAgents: ['Jett', 'Reyna', 'Omen'],
    kills: 148,
    deaths: 86,
    assists: 72,
    players: [
      {
        name: 'TenZ#NA1',
        currentRank: 'Diamante',
        peakRank: 'Diamante',
        rank: 'Diamante',
        points: 6,
        level: 120,
        agent: 'Jett',
        stats: { kills: 62, deaths: 24, assists: 18 },
        agents: ['Jett', 'Jett', 'Reyna']
      },
      {
        name: 'Kyedae#0001',
        currentRank: 'Oro',
        peakRank: 'Oro',
        rank: 'Oro',
        points: 4,
        level: 85,
        agent: 'Reyna',
        stats: { kills: 48, deaths: 31, assists: 26 },
        agents: ['Reyna', 'Clove']
      },
      {
        name: 'ScreaM#1 tap',
        currentRank: 'Plata',
        peakRank: 'Plata',
        rank: 'Plata',
        points: 3,
        level: 45,
        agent: 'Omen',
        stats: { kills: 38, deaths: 31, assists: 28 },
        agents: ['Omen', 'Omen', 'Brimstone']
      },
    ],
  },
  {
    id: 2,
    name: 'Gorilas',
    logo: '/gorilas.jpg',
    hidden: false,
    cupsPlayed: '2 Copas (2026)',
    cupsCount: 2,
    topAgents: ['Raze', 'Clove', 'Cypher'],
    kills: 112,
    deaths: 128,
    assists: 51,
    players: [
      {
        name: 'Mixwell#G2',
        currentRank: 'Platino',
        peakRank: 'Diamante',
        rank: 'Platino',
        points: 5.5,
        level: 200,
        agent: 'Raze',
        stats: { kills: 52, deaths: 38, assists: 14 },
        agents: ['Raze', 'Raze', 'Jett']
      },
      {
        name: 'Keloqz#FR',
        currentRank: 'Oro',
        peakRank: 'Platino',
        rank: 'Oro',
        points: 4.5,
        level: 90,
        agent: 'Clove',
        stats: { kills: 36, deaths: 44, assists: 19 },
        agents: ['Clove', 'Reyna']
      },
      {
        name: 'Avova#123',
        currentRank: 'Plata',
        peakRank: 'Oro',
        rank: 'Plata',
        points: 3.5,
        level: 50,
        agent: 'Cypher',
        stats: { kills: 24, deaths: 46, assists: 18 },
        agents: ['Cypher', 'Cypher', 'Killjoy']
      },
    ],
  },
  {
    id: 3,
    name: 'Primates FC',
    logo: '/logo3.png',
    hidden: false,
    cupsPlayed: '3 Copas (2026)',
    cupsCount: 3,
    topAgents: ['Sova', 'Killjoy', 'Brimstone'],
    kills: 136,
    deaths: 98,
    assists: 68,
    players: [
      {
        name: 'Knekro#123',
        currentRank: 'Oro',
        peakRank: 'Oro',
        rank: 'Oro',
        points: 4,
        level: 150,
        agent: 'Sova',
        stats: { kills: 50, deaths: 32, assists: 28 },
        agents: ['Sova', 'Sova', 'Fade']
      },
      {
        name: 'IlloJuan#Malaga',
        currentRank: 'Plata',
        peakRank: 'Plata',
        rank: 'Plata',
        points: 3,
        level: 60,
        agent: 'Killjoy',
        stats: { kills: 46, deaths: 30, assists: 22 },
        agents: ['Killjoy', 'Cypher']
      },
      {
        name: 'Xokas#WoW',
        currentRank: 'Bronce',
        peakRank: 'Plata',
        rank: 'Bronce',
        points: 2.5,
        level: 41,
        agent: 'Brimstone',
        stats: { kills: 40, deaths: 36, assists: 18 },
        agents: ['Brimstone', 'Brimstone', 'Omen']
      },
    ],
  },
  {
    id: 4,
    name: 'Chimp Squad',
    logo: '/logo4.png',
    hidden: false,
    cupsPlayed: '1ª Copa (Debut 2026)',
    cupsCount: 1,
    topAgents: ['Fade', 'Iso', 'Breach'],
    kills: 124,
    deaths: 115,
    assists: 59,
    players: [
      {
        name: 'Boaster#FNC',
        currentRank: 'Ascendente',
        peakRank: 'Inmortal',
        rank: 'Inmortal',
        points: 7.5,
        level: 300,
        agent: 'Fade',
        stats: { kills: 56, deaths: 34, assists: 25 },
        agents: ['Fade', 'Fade', 'Sova']
      },
      {
        name: 'Derke#FNC',
        currentRank: 'Diamante',
        peakRank: 'Ascendente',
        rank: 'Ascendente',
        points: 6.5,
        level: 120,
        agent: 'Iso',
        stats: { kills: 48, deaths: 38, assists: 18 },
        agents: ['Iso', 'Jett']
      },
      {
        name: 'Leo#FNC',
        currentRank: 'Hierro',
        peakRank: 'Bronce',
        rank: 'Hierro',
        points: 1.5,
        level: 42,
        agent: 'Breach',
        stats: { kills: 20, deaths: 43, assists: 16 },
        agents: ['Breach', 'KAY/O']
      },
    ],
  },
];

// Tabla de Clasificación con estadísticas detalladas: Kills, Muertes, Asistencias, K/D, Agentes y Copas Jugadas
export const STANDINGS = [
  { 
    rank: 1, 
    team: 'Los Monos', 
    logo: '/monkeys.jpg', 
    p: 3, 
    w: 3, 
    l: 0, 
    points: 9, 
    form: ['W', 'W', 'W'],
    kills: 148,
    deaths: 86,
    assists: 72,
    kda: 1.72,
    topAgents: ['Jett', 'Reyna', 'Omen'],
    cupsPlayed: '3 Copas (2026)',
    cupsCount: 3,
    badge: 'Veterano'
  },
  { 
    rank: 2, 
    team: 'Primates FC', 
    logo: '/logo3.png', 
    p: 3, 
    w: 2, 
    l: 1, 
    points: 6, 
    form: ['W', 'L', 'W'],
    kills: 136,
    deaths: 98,
    assists: 68,
    kda: 1.38,
    topAgents: ['Sova', 'Killjoy', 'Brimstone'],
    cupsPlayed: '3 Copas (2026)',
    cupsCount: 3,
    badge: 'Veterano'
  },
  { 
    rank: 3, 
    team: 'Chimp Squad', 
    logo: '/logo4.png', 
    p: 3, 
    w: 1, 
    l: 2, 
    points: 3, 
    form: ['L', 'W', 'L'],
    kills: 124,
    deaths: 115,
    assists: 59,
    kda: 1.07,
    topAgents: ['Fade', 'Iso', 'Breach'],
    cupsPlayed: '1ª Copa (2026)',
    cupsCount: 1,
    badge: 'Debutante'
  },
  { 
    rank: 4, 
    team: 'Gorilas', 
    logo: '/gorilas.jpg', 
    p: 3, 
    w: 0, 
    l: 3, 
    points: 0, 
    form: ['L', 'L', 'L'],
    kills: 112,
    deaths: 128,
    assists: 51,
    kda: 0.87,
    topAgents: ['Raze', 'Clove', 'Cypher'],
    cupsPlayed: '2 Copas (2026)',
    cupsCount: 2,
    badge: 'Consagrado'
  },
];

export const teamPoints = (team) =>
  Math.round(
    team.players.reduce((sum, p) => sum + (p.points !== undefined ? p.points : (RANKS[p.rank]?.points || 0)), 0) * 10
  ) / 10;
