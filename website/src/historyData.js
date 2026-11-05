// Datos históricos REALES de la Copa Primate extraídos directamente de los repositorios oficiales de la comunidad
// Vol. I: https://github.com/IkerRL/CopaPrimate
// Vol. II: https://github.com/IkerRL/CopaPrimateV2
// Canal oficial de directos: twitch.tv/makacagotica (MakacaGótica / Team Makaco)

export const PAST_EDITIONS = [
  {
    id: 'vol-1',
    name: 'Copa Primate Vol. I',
    edition: 'Vol. I',
    year: '2026',
    themeClass: 'theme-vol1',
    tagline: 'Fase de Grupos y Bracket Final de Playoffs',
    formatType: 'vol1-completo',
    formatDesc: '15 equipos divididos en 4 Grupos (A, B, C y D). Los 2 mejores clasificados de cada grupo avanzaron al Bracket Final de Playoffs (Cuartos, Semifinales y Gran Final).',
    broadcaster: {
      channel: 'MakacaGótica',
      platform: 'Twitch',
      url: 'https://www.twitch.tv/makacagotica',
      role: 'Caster Oficial & Creadora del Torneo',
      community: 'Team Makaco',
    },
    githubUrl: 'https://github.com/IkerRL/CopaPrimate',
    winner: {
      name: 'Golden Sex',
      players: ['Max', 'Broken'],
      logo: '/logos-v1/logo2.png',
      score: '3 - 2',
      runnerUp: 'TETONES: Equipo Nacional de Somalia',
    },
    stats: {
      teamsCount: 15,
      groupsCount: 4,
      playoffMatches: 7,
    },
    // Equipos reales por grupos en Vol. I con logos originales descargados de CopaPrimate
    groups: [
      {
        name: 'Grupo A',
        teams: [
          { name: 'Hijas del Kaos', players: ['Satha', 'Kaos'], logo: '/logos-v1/logo8.png', wins: 3, diff: '+9', status: 'Clasificado (#1)' },
          { name: 'Rose Devil', players: ['Tony', 'Jokker'], logo: '/logos-v1/logo1.png', wins: 2, diff: '+6', status: 'Clasificado (#2)' },
          { name: 'Al-dedillo VC', players: ['Xolo', 'Noavae'], logo: '/logos-v1/logo3.png', wins: 1, diff: '0', status: 'Eliminado' },
          { name: 'Bloody Fruit', players: ['MrPain 神', 'Sandiass21'], logo: '/logos-v1/logo7.png', wins: 0, diff: '-15', status: 'Eliminado' },
        ],
      },
      {
        name: 'Grupo B',
        teams: [
          { name: 'Miaus', players: ['Kae', 'Wilson'], logo: '/logos-v1/logo13.png', wins: 3, diff: '+12', status: 'Clasificado (#1)' },
          { name: 'Los Akrtona2', players: ['S3R4X', 'MasterKira'], logo: '/logos-v1/logo4.png', wins: 2, diff: '+6', status: 'Clasificado (#2)' },
          { name: 'GOATS', players: ['Mica', 'Marco'], logo: '/logos-v1/logo12.png', wins: 1, diff: '-3', status: 'Eliminado' },
          { name: 'Crimson Eclipse', players: ['ReyFhantom', 'zNyrex '], logo: '/logos-v1/logo5.png', wins: 0, diff: '-15', status: 'Eliminado' },
        ],
      },
      {
        name: 'Grupo C',
        teams: [
          { name: 'TETONES: Equipo Nacional de Somalia', players: ['Marrkitosss', 'Davv'], logo: '/logos-v1/logo11.png', wins: 3, diff: '+8', status: 'Clasificado (#1)' },
          { name: 'Golden Sex', players: ['Max', 'Broken'], logo: '/logos-v1/logo2.png', wins: 2, diff: '+2', status: 'Clasificado (#2)' },
          { name: 'SPIDYBOOBS', players: ['Sama', 'Potro'], logo: '/logos-v1/logo14.png', wins: 1, diff: '-1', status: 'Eliminado' },
          { name: 'MUGIWARAS', players: ['Andreloregon', 'Jess'], logo: '/logos-v1/logo15.png', wins: 0, diff: '-9', status: 'Eliminado' },
        ],
      },
      {
        name: 'Grupo D',
        teams: [
          { name: 'Team Obrikat', players: ['JettDiffs', 'EGOFack'], logo: '/logos-v1/logo10.png', wins: 2, diff: '+7', status: 'Clasificado (#1)' },
          { name: 'Makaco NinjaPelocho', players: ['Iker', 'Adri'], logo: '/logos-v1/logo6.png', wins: 1, diff: '+2', status: 'Clasificado (#2)' },
          { name: 'Konoha Makaca', players: ['MakaQuillo', 'MakaIsla'], logo: '/logos-v1/logo9.png', wins: 0, diff: '-9', status: 'Eliminado' },
        ],
      },
    ],
    // Bracket Final Vol. I con victoria 3 - 2 de Max y Broken (Golden Sex)
    bracket: {
      qf: [
        { t1: 'Hijas del Kaos', logo1: '/logos-v1/logo8.png', s1: 0, t2: 'Golden Sex', logo2: '/logos-v1/logo2.png', s2: 2, winner: 'Golden Sex' },
        { t1: 'Miaus', logo1: '/logos-v1/logo13.png', s1: 0, t2: 'Makaco NinjaPelocho', logo2: '/logos-v1/logo6.png', s2: 2, winner: 'Makaco NinjaPelocho' },
        { t1: 'TETONES: Equipo Nacional de Somalia', logo1: '/logos-v1/logo11.png', s1: 2, t2: 'Rose Devil', logo2: '/logos-v1/logo1.png', s2: 0, winner: 'TETONES: Equipo Nacional de Somalia' },
        { t1: 'Team Obrikat', logo1: '/logos-v1/logo10.png', s1: 0, t2: 'Los Akrtona2', logo2: '/logos-v1/logo4.png', s2: 2, winner: 'Los Akrtona2' },
      ],
      sf: [
        { t1: 'Golden Sex', logo1: '/logos-v1/logo2.png', s1: 2, t2: 'Makaco NinjaPelocho', logo2: '/logos-v1/logo6.png', s2: 1, winner: 'Golden Sex' },
        { t1: 'TETONES: Equipo Nacional de Somalia', logo1: '/logos-v1/logo11.png', s1: 2, t2: 'Los Akrtona2', logo2: '/logos-v1/logo4.png', s2: 1, winner: 'TETONES: Equipo Nacional de Somalia' },
      ],
      fn: [
        {
          t1: 'Golden Sex',
          logo1: '/logos-v1/logo2.png',
          s1: 3,
          t2: 'TETONES: Equipo Nacional de Somalia',
          logo2: '/logos-v1/logo11.png',
          s2: 2,
          winner: 'Golden Sex',
          note: '¡Campeones de la Copa Primate Vol. I! Max y Broken se coronaron tras vencer 3-2 a TETONES en un partidazo épico retransmitido en Twitch por MakacaGótica.',
        },
      ],
    },
  },
  {
    id: 'vol-2',
    name: 'Copa Primate Vol. II',
    edition: 'Vol. II',
    year: '2026',
    themeClass: 'theme-vol2',
    tagline: 'Liga Cruzada, Playoff 5º-12º y Bracket Final',
    formatType: 'vol2-completo',
    formatDesc: '12 equipos disputaron una Liga Cruzada a 4 jornadas. Los 4 primeros clasificaron directo a Cuartos de Final, mientras que del 5º al 12º disputaron la ronda de Playoff para completar el Bracket Final.',
    broadcaster: {
      channel: 'MakacaGótica',
      platform: 'Twitch',
      url: 'https://www.twitch.tv/makacagotica',
      role: 'Caster Oficial & Host',
      community: 'Team Makaco',
    },
    githubUrl: 'https://github.com/IkerRL/CopaPrimateV2',
    winner: {
      name: 'Los Akrtona2',
      players: ['Kira', 'Serax'],
      logo: '/logo2.png',
      score: '3 - 2',
      runnerUp: 'REHENKARMACIÓN',
    },
    stats: {
      teamsCount: 12,
      matchesPlayed: 24,
      jornadasCount: 4,
    },
    // Equipos por grupos
    groups: [
      {
        name: 'Grupo A',
        teams: [
          { name: 'Thunder Buddies', players: ['Brrokeen', 'Pipe'], logo: '/logo3.png' },
          { name: 'Los Akrtona2', players: ['Kira', 'Serax'], logo: '/logo2.png' },
          { name: 'Chuu-Chuu 100% MAX', players: ['MakaQuillo', 'Max'], logo: '/logo8.png' },
          { name: 'REHENKARMACIÓN', players: ['Satha', 'Makflat'], logo: '/logo1.png' },
        ],
      },
      {
        name: 'Grupo B',
        teams: [
          { name: 'Entry Baiters', players: ['レックウザ ', 'Militantedelsoe'], logo: '/logo5.png' },
          { name: 'Dream Team', players: ['JoKker', 'Pepardo'], logo: '/logo7.png' },
          { name: 'Makaco Ninja-Pelocho', players: ['MakacoNinja', 'Iker 😎'], logo: '/logo6.png' },
          { name: 'Kizuna', players: ['Alezita', 'Sarix'], logo: '/logo4.png' },
        ],
      },
      {
        name: 'Grupo C',
        teams: [
          { name: 'Sakura', players: ['Gustavo', 'Carlos'], logo: '/logo14.png' },
          { name: 'Soul Resonance', players: ['KrypT', 'Charly'], logo: '/logo11.png' },
          { name: 'Stranger Picks', players: ['TheDori', 'Sotomi'], logo: '/logo9.png' },
          { name: 'MARIIKS', players: ['Acid', 'Bru'], logo: '/logo10.png' },
        ],
      },
    ],
    // Clasificación Liga Cruzada
    standings: [
      { rank: 1, team: 'Sakura', logo: '/logo14.png', players: ['Gustavo', 'Carlos'], p: 4, w: 4, l: 0, pts: 12, diff: '+12', rf: 20, rc: 8, status: 'Top 4 Directo' },
      { rank: 2, team: 'Los Akrtona2', logo: '/logo2.png', players: ['Kira', 'Serax'], p: 4, w: 3, l: 1, pts: 9, diff: '+10', rf: 19, rc: 9, status: 'Top 4 Directo' },
      { rank: 3, team: 'REHENKARMACIÓN', logo: '/logo1.png', players: ['Satha', 'Makflat'], p: 4, w: 3, l: 1, pts: 9, diff: '+7', rf: 18, rc: 11, status: 'Top 4 Directo' },
      { rank: 4, team: 'Thunder Buddies', logo: '/logo3.png', players: ['Brrokeen', 'Pipe'], p: 4, w: 3, l: 1, pts: 9, diff: '+4', rf: 16, rc: 12, status: 'Top 4 Directo' },
      { rank: 5, team: 'MARIIKS', logo: '/logo10.png', players: ['Acid', 'Bru'], p: 4, w: 2, l: 2, pts: 6, diff: '+2', rf: 15, rc: 13, status: 'Playoff (5º)' },
      { rank: 6, team: 'Chuu-Chuu 100% MAX', logo: '/logo8.png', players: ['MakaQuillo', 'Max'], p: 4, w: 2, l: 2, pts: 6, diff: '+1', rf: 16, rc: 15, status: 'Playoff (6º)' },
      { rank: 7, team: 'Kizuna', logo: '/logo4.png', players: ['Alezita', 'Sarix'], p: 4, w: 2, l: 2, pts: 6, diff: '-2', rf: 14, rc: 16, status: 'Playoff (7º)' },
      { rank: 8, team: 'Dream Team', logo: '/logo7.png', players: ['JoKker', 'Pepardo'], p: 4, w: 2, l: 2, pts: 6, diff: '-3', rf: 10, rc: 13, status: 'Playoff (8º)' },
      { rank: 9, team: 'Entry Baiters', logo: '/logo5.png', players: ['レックウザ ', 'Militantedelsoe'], p: 4, w: 1, l: 3, pts: 3, diff: '-5', rf: 12, rc: 17, status: 'Playoff (9º)' },
      { rank: 10, team: 'Stranger Picks', logo: '/logo9.png', players: ['TheDori', 'Sotomi'], p: 4, w: 1, l: 3, pts: 3, diff: '-8', rf: 9, rc: 17, status: 'Playoff (10º)' },
      { rank: 11, team: 'Makaco Ninja-Pelocho', logo: '/logo6.png', players: ['MakacoNinja', 'Iker 😎'], p: 4, w: 1, l: 3, pts: 3, diff: '-9', rf: 10, rc: 19, status: 'Playoff (11º)' },
      { rank: 12, team: 'Soul Resonance', logo: '/logo11.png', players: ['KrypT', 'Charly'], p: 4, w: 0, l: 4, pts: 0, diff: '-9', rf: 11, rc: 20, status: 'Playoff (12º)' },
    ],
    // Ronda previa de playoffs (5º al 12º)
    playoffs: [
      { seed1: 5, t1: 'MARIIKS', logo1: '/logo10.png', s1: 2, seed2: 12, t2: 'Soul Resonance', logo2: '/logo11.png', s2: 1, winner: 'MARIIKS' },
      { seed1: 6, t1: 'Chuu-Chuu 100% MAX', logo1: '/logo8.png', s1: 1, seed2: 11, t2: 'Makaco Ninja-Pelocho', logo2: '/logo6.png', s2: 2, winner: 'Makaco Ninja-Pelocho' },
      { seed1: 7, t1: 'Kizuna', logo1: '/logo4.png', s1: 2, seed2: 10, t2: 'Stranger Picks', logo2: '/logo9.png', s2: 1, winner: 'Kizuna' },
      { seed1: 8, t1: 'Dream Team', logo1: '/logo7.png', s1: 0, seed2: 9, t2: 'Entry Baiters', logo2: '/logo5.png', s2: 2, winner: 'Entry Baiters' },
    ],
    // Bracket Final Vol. II con victoria 3 - 2 de Los Akrtona2 (Kira y Serax)
    bracket: {
      qf: [
        { t1: 'Sakura', logo1: '/logo14.png', s1: 2, t2: 'Entry Baiters', logo2: '/logo5.png', s2: 0, winner: 'Sakura' },
        { t1: 'Los Akrtona2', logo1: '/logo2.png', s1: 2, t2: 'Kizuna', logo2: '/logo4.png', s2: 0, winner: 'Los Akrtona2' },
        { t1: 'REHENKARMACIÓN', logo1: '/logo1.png', s1: 2, t2: 'Makaco Ninja-Pelocho', logo2: '/logo6.png', s2: 1, winner: 'REHENKARMACIÓN' },
        { t1: 'Thunder Buddies', logo1: '/logo3.png', s1: 2, t2: 'MARIIKS', logo2: '/logo10.png', s2: 1, winner: 'Thunder Buddies' },
      ],
      sf: [
        { t1: 'Sakura', logo1: '/logo14.png', s1: 1, t2: 'Los Akrtona2', logo2: '/logo2.png', s2: 2, winner: 'Los Akrtona2' },
        { t1: 'REHENKARMACIÓN', logo1: '/logo1.png', s1: 2, t2: 'Thunder Buddies', logo2: '/logo3.png', s2: 1, winner: 'REHENKARMACIÓN' },
      ],
      fn: [
        {
          t1: 'Los Akrtona2',
          logo1: '/logo2.png',
          s1: 3,
          t2: 'REHENKARMACIÓN',
          logo2: '/logo1.png',
          s2: 2,
          winner: 'Los Akrtona2',
          note: '¡Campeones de la Copa Primate Vol. II! Los Akrtona2 (Kira y Serax) levantaron la copa tras una agónica victoria por 3-2 frente a REHENKARMACIÓN.',
        },
      ],
    },
    // Jornadas de liga cruzada
    jornadas: [
      {
        numero: 1,
        partidos: [
          { t1: 'Thunder Buddies', s1: 5, t2: 'Entry Baiters', s2: 2 },
          { t1: 'Los Akrtona2', s1: 5, t2: 'Dream Team', s2: 0 },
          { t1: 'Chuu-Chuu 100% MAX', s1: 4, t2: 'Makaco Ninja-Pelocho', s2: 5 },
          { t1: 'REHENKARMACIÓN', s1: 5, t2: 'Kizuna', s2: 3 },
          { t1: 'Sakura', s1: 5, t2: 'Soul Resonance', s2: 3 },
          { t1: 'Stranger Picks', s1: 5, t2: 'MARIIKS', s2: 2 },
        ],
      },
      {
        numero: 2,
        partidos: [
          { t1: 'Thunder Buddies', s1: 1, t2: 'Sakura', s2: 5 },
          { t1: 'Los Akrtona2', s1: 5, t2: 'Stranger Picks', s2: 2 },
          { t1: 'Chuu-Chuu 100% MAX', s1: 5, t2: 'Soul Resonance', s2: 2 },
          { t1: 'REHENKARMACIÓN', s1: 5, t2: 'MARIIKS', s2: 3 },
          { t1: 'Entry Baiters', s1: 1, t2: 'Dream Team', s2: 5 },
          { t1: 'Makaco Ninja-Pelocho', s1: 2, t2: 'Kizuna', s2: 5 },
        ],
      },
      {
        numero: 3,
        partidos: [
          { t1: 'Thunder Buddies', s1: 5, t2: 'Los Akrtona2', s2: 4 },
          { t1: 'Chuu-Chuu 100% MAX', s1: 5, t2: 'REHENKARMACIÓN', s2: 3 },
          { t1: 'Entry Baiters', s1: 4, t2: 'Sakura', s2: 5 },
          { t1: 'Dream Team', s1: 5, t2: 'Stranger Picks', s2: 2 },
          { t1: 'Makaco Ninja-Pelocho', s1: 1, t2: 'MARIIKS', s2: 5 },
          { t1: 'Kizuna', s1: 5, t2: 'Soul Resonance', s2: 4 },
        ],
      },
      {
        numero: 4,
        partidos: [
          { t1: 'Thunder Buddies', s1: 5, t2: 'Kizuna', s2: 1 },
          { t1: 'Los Akrtona2', s1: 5, t2: 'Makaco Ninja-Pelocho', s2: 2 },
          { t1: 'Chuu-Chuu 100% MAX', s1: 2, t2: 'Entry Baiters', s2: 5 },
          { t1: 'REHENKARMACIÓN', s1: 5, t2: 'Dream Team', s2: 0 },
          { t1: 'Sakura', s1: 5, t2: 'Stranger Picks', s2: 0 },
          { t1: 'Soul Resonance', s1: 2, t2: 'MARIIKS', s2: 5 },
        ],
      },
    ],
  },
];
