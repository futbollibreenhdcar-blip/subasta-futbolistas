import { Buyer, BoughtPlayer } from '../types';

export interface ManagerEvaluation {
  buyerId: string;
  buyerName: string;
  squad: BoughtPlayer[];
  realLifeScore: number;       // 0 a 100: Palmarés histórico, Balones de Oro, Mundiales
  inGameScore: number;         // 0 a 100: GRL FC Mobile, Tiers, PlayStyles+
  tacticalBalanceScore: number;// 0 a 100: Cobertura de GK, DEF, MID, ATT
  totalFootballScore: number;  // 0 a 100: Puntuación ponderada global
  goalkeeperCount: number;
  defenderCount: number;
  midfielderCount: number;
  attackerCount: number;
  averageGrl: number;
  goldenPlaystylesCount: number;
  legendaryPlayers: string[];
  verdictTitle: string;
  verdictComment: string;
  tacticalVerdict: string;
}

export interface BotTournamentVerdict {
  champion: ManagerEvaluation;
  rankings: ManagerEvaluation[];
  botIntro: string;
}

// Base de conocimiento histórico de futbolistas (Balones de Oro, Mundiales, Champions, estatus de leyenda)
interface HistoricalProfile {
  ballonDor: number;
  worldCups: number;
  championsLeague: number;
  legendTier: 'GOAT' | 'LEYENDA_MAXIMA' | 'HISTORICO' | 'CRACK_MUNDIAL' | 'FIGURA';
  signatureTrait?: string;
}

const HISTORICAL_DATABASE: Record<string, HistoricalProfile> = {
  // GOATs & Super Leyendas
  'Pelé': { ballonDor: 7, worldCups: 3, championsLeague: 0, legendTier: 'GOAT', signatureTrait: 'Rey indiscutido del fútbol y tricampeón mundial' },
  'Messi': { ballonDor: 8, worldCups: 1, championsLeague: 4, legendTier: 'GOAT', signatureTrait: '8 Balones de Oro, campeón del mundo y genio contemporáneo' },
  'Lionel Messi': { ballonDor: 8, worldCups: 1, championsLeague: 4, legendTier: 'GOAT', signatureTrait: '8 Balones de Oro, campeón del mundo y genio contemporáneo' },
  'Cristiano Ronaldo': { ballonDor: 5, worldCups: 0, championsLeague: 5, legendTier: 'GOAT', signatureTrait: '5 Balones de Oro, 5 Champions y máximo goleador de la historia' },
  'C. Ronaldo': { ballonDor: 5, worldCups: 0, championsLeague: 5, legendTier: 'GOAT', signatureTrait: '5 Balones de Oro, 5 Champions y máximo goleador de la historia' },
  'Maradona': { ballonDor: 2, worldCups: 1, championsLeague: 0, legendTier: 'GOAT', signatureTrait: 'Héroe de México 86 y el talento más desbordante del siglo XX' },
  'Diego Maradona': { ballonDor: 2, worldCups: 1, championsLeague: 0, legendTier: 'GOAT', signatureTrait: 'Héroe de México 86 y el talento más desbordante del siglo XX' },
  'Cruyff': { ballonDor: 3, worldCups: 0, championsLeague: 3, legendTier: 'GOAT', signatureTrait: 'Creador del fútbol total y 3 veces Balón de Oro' },
  'Johan Cruyff': { ballonDor: 3, worldCups: 0, championsLeague: 3, legendTier: 'GOAT', signatureTrait: 'Creador del fútbol total y 3 veces Balón de Oro' },
  'Zidane': { ballonDor: 1, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Elegancia pura, campeón mundial y héroe de la Novena' },
  'Ronaldo Nazário': { ballonDor: 2, worldCups: 2, championsLeague: 0, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El Fenómeno original y bicampeón mundial' },
  'Ronaldo': { ballonDor: 2, worldCups: 2, championsLeague: 0, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El Fenómeno original y bicampeón mundial' },
  'Ronaldinho': { ballonDor: 1, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Magia brasileña, sonrisa eterna y campeón de todo' },
  'Maldini': { ballonDor: 0, worldCups: 0, championsLeague: 5, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El mejor defensor de todos los tiempos y 5 Copas de Europa' },
  'Paolo Maldini': { ballonDor: 0, worldCups: 0, championsLeague: 5, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El mejor defensor de todos los tiempos y 5 Copas de Europa' },
  'Beckenbauer': { ballonDor: 2, worldCups: 1, championsLeague: 3, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El Káiser, líder histórico de Alemania y Bayern Múnich' },
  'Yashin': { ballonDor: 1, worldCups: 0, championsLeague: 0, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'La Araña Negra, único arquero con Balón de Oro' },
  'Lev Yashin': { ballonDor: 1, worldCups: 0, championsLeague: 0, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'La Araña Negra, único arquero con Balón de Oro' },
  'Buffon': { ballonDor: 0, worldCups: 1, championsLeague: 0, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Campeón mundial 2006 y el arquero más regular de la era moderna' },
  'Gianluigi Buffon': { ballonDor: 0, worldCups: 1, championsLeague: 0, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Campeón mundial 2006 y el arquero más regular de la era moderna' },
  'Casillas': { ballonDor: 0, worldCups: 1, championsLeague: 3, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El Santo, capitán de España bicampeona de Europa y del Mundo' },
  'Iker Casillas': { ballonDor: 0, worldCups: 1, championsLeague: 3, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El Santo, capitán de España bicampeona de Europa y del Mundo' },
  'Neuer': { ballonDor: 0, worldCups: 1, championsLeague: 2, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Revolucionó el puesto de arquero líbero y campeón del mundo 2014' },
  'Manuel Neuer': { ballonDor: 0, worldCups: 1, championsLeague: 2, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Revolucionó el puesto de arquero líbero' },
  'Baresi': { ballonDor: 0, worldCups: 1, championsLeague: 3, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Capitán eterno del Milan invencible' },
  'Cafú': { ballonDor: 0, worldCups: 2, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Bicampeón mundial y récord de 3 finales de Copa del Mundo seguidas' },
  'Roberto Carlos': { ballonDor: 0, worldCups: 1, championsLeague: 3, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El misil zurdo de Brasil y del Real Madrid de los Galácticos' },
  'Kaká': { ballonDor: 1, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Balón de Oro 2007, velocidad imparable y campeón mundial' },
  'Henry': { ballonDor: 0, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Líder de Los Invencibles del Arsenal y campeón de Europa y del Mundo' },
  'Thierry Henry': { ballonDor: 0, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Líder de Los Invencibles del Arsenal' },
  'Xavi': { ballonDor: 0, worldCups: 1, championsLeague: 4, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'El cerebro del Tiki-Taka, campeón del mundo y 4 Champions' },
  'Iniesta': { ballonDor: 0, worldCups: 1, championsLeague: 4, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Autor del gol que bordó la estrella de España y mago de Stamford Bridge' },
  'Modrić': { ballonDor: 1, worldCups: 0, championsLeague: 6, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Balón de Oro 2018 y 6 veces rey de Europa con el Real Madrid' },
  'Luka Modrić': { ballonDor: 1, worldCups: 0, championsLeague: 6, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Balón de Oro 2018 y 6 Champions' },
  'Van Dijk': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'El muro de Anfield y mejor central de la Premier contemporánea' },
  'Virgil van Dijk': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'El muro de Anfield' },
  'Haaland': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Máquina goleadora demoledora y ganador del Triplete' },
  'Erling Haaland': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Máquina goleadora demoledora' },
  'Mbappé': { ballonDor: 0, worldCups: 1, championsLeague: 0, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Campeón mundial a los 19 años y hat-trick en final de Copa del Mundo' },
  'Kylian Mbappé': { ballonDor: 0, worldCups: 1, championsLeague: 0, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Campeón mundial y hat-trick en final' },
  'Bellingham': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Centrocampista total de clase mundial y campeón de Europa' },
  'Jude Bellingham': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Centrocampista total de clase mundial' },
  'Lamine Yamal': { ballonDor: 0, worldCups: 0, championsLeague: 0, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Joya precoz, campeón de la Eurocopa con gol antológico y regate prodigio' },
  'Vinícius Jr.': { ballonDor: 0, worldCups: 0, championsLeague: 2, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Goles decisivos en dos finales de Champions y desborde imparable' },
  'Vinícius Jr': { ballonDor: 0, worldCups: 0, championsLeague: 2, legendTier: 'CRACK_MUNDIAL', signatureTrait: 'Goles decisivos en dos finales de Champions' },
  'Forlán': { ballonDor: 0, worldCups: 0, championsLeague: 0, legendTier: 'HISTORICO', signatureTrait: 'Balón de Oro de Sudáfrica 2010 y Bota de Oro europea' },
  'Diego Forlán': { ballonDor: 0, worldCups: 0, championsLeague: 0, legendTier: 'HISTORICO', signatureTrait: 'Balón de Oro de Sudáfrica 2010 y Bota de Oro europea' },
  'Chiellini': { ballonDor: 0, worldCups: 0, championsLeague: 0, legendTier: 'HISTORICO', signatureTrait: 'Gladiador de la zaga de la Juventus y campeón de la Euro 2020' },
  'Touré': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'Fuerza descomunal y pulmón del Manchester City campeón' },
  'Yaya Touré': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'Fuerza descomunal y pulmón del Manchester City campeón' },
  'Cantona': { ballonDor: 0, worldCups: 0, championsLeague: 0, legendTier: 'HISTORICO', signatureTrait: 'El Rey de Old Trafford y carisma rebelde inigualable' },
  'Ribéry': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'Extremo temible del Bayern del Triplete histórico' },
  'Drogba': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'Héroe de Múnich 2012 y rey indiscutido de las finales con el Chelsea' },
  'Didier Drogba': { ballonDor: 0, worldCups: 0, championsLeague: 1, legendTier: 'HISTORICO', signatureTrait: 'Héroe de Múnich 2012' },
  'Kompany': { ballonDor: 0, worldCups: 0, championsLeague: 0, legendTier: 'HISTORICO', signatureTrait: 'Capitán de hierro y mariscal de la era dorada del City' },
  'Lahm': { ballonDor: 0, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Capitán campeón de Brasil 2014 y perfección táctica de lateral o volante' },
  'Philipp Lahm': { ballonDor: 0, worldCups: 1, championsLeague: 1, legendTier: 'LEYENDA_MAXIMA', signatureTrait: 'Capitán campeón de Brasil 2014' },
};

function getPlayerHistoricalProfile(name: string): HistoricalProfile {
  // Búsqueda directa o parcial
  if (HISTORICAL_DATABASE[name]) return HISTORICAL_DATABASE[name];
  const lower = name.toLowerCase();
  for (const [key, profile] of Object.entries(HISTORICAL_DATABASE)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return profile;
    }
  }
  return {
    ballonDor: 0,
    worldCups: 0,
    championsLeague: 0,
    legendTier: 'FIGURA',
  };
}

function categorizePosition(pos?: string): 'GK' | 'DEF' | 'MID' | 'ATT' {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'POR') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DFC', 'LI', 'LD'].includes(p)) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'MC', 'MCD', 'MCO', 'MI', 'MD'].includes(p)) return 'MID';
  return 'ATT'; // ST, CF, LW, RW, DC, SD, EI, ED
}

/**
 * Evalúa a un equipo de 11 jugadores en base al mérito futbolístico real e in-game.
 */
export function evaluateManagerSquad(buyer: Buyer): ManagerEvaluation {
  const squad = buyer.squad;

  let gkCount = 0;
  let defCount = 0;
  let midCount = 0;
  let attCount = 0;

  let totalGrl = 0;
  let goldenPlaystyles = 0;
  let tierSCount = 0;
  let totalRealLifePoints = 0;

  const legendaryPlayers: string[] = [];

  squad.forEach((bought) => {
    const posCat = categorizePosition(bought.version.posicion || bought.version.posicionPista);
    if (posCat === 'GK') gkCount++;
    else if (posCat === 'DEF') defCount++;
    else if (posCat === 'MID') midCount++;
    else attCount++;

    const grl = bought.version.grl || 115;
    totalGrl += grl;
    if (bought.version.tier === 'S' || grl >= 121) tierSCount++;

    // PlayStyles
    const playstyles = bought.version.playstyles || [];
    playstyles.forEach((ps) => {
      if (ps.level === 2) goldenPlaystyles++;
    });

    // Perfil histórico
    const profile = getPlayerHistoricalProfile(bought.playerName);
    let playerPoints = 35; // base por ser jugador top

    if (profile.legendTier === 'GOAT') {
      playerPoints += 55;
      legendaryPlayers.push(`${bought.playerName} (Leyenda Universal)`);
    } else if (profile.legendTier === 'LEYENDA_MAXIMA') {
      playerPoints += 45;
      legendaryPlayers.push(bought.playerName);
    } else if (profile.legendTier === 'HISTORICO') {
      playerPoints += 30;
      legendaryPlayers.push(bought.playerName);
    } else if (profile.legendTier === 'CRACK_MUNDIAL') {
      playerPoints += 22;
    }

    playerPoints += profile.ballonDor * 15;
    playerPoints += profile.worldCups * 12;
    playerPoints += profile.championsLeague * 6;

    totalRealLifePoints += playerPoints;
  });

  const squadSize = squad.length || 1;
  const avgGrl = Math.round((totalGrl / squadSize) * 10) / 10;

  // 1. Puntaje Histórico Real (0-100)
  // Escala calibrada: un equipo con leyendas mundiales y campeones supera los 85 pts
  const rawRealLife = totalRealLifePoints / (squadSize * 0.9);
  const realLifeScore = Math.min(100, Math.max(30, Math.round(rawRealLife)));

  // 2. Puntaje In-Game FC Mobile (0-100)
  // GRL 115 base = 50 pts, GRL 122 = 98 pts, bonificación por Tier S y PlayStyles+
  const grlComponent = Math.min(95, Math.max(40, Math.round((avgGrl - 114) * 8 + 45)));
  const psComponent = Math.min(15, goldenPlaystyles * 2);
  const inGameScore = Math.min(100, Math.max(35, grlComponent + psComponent));

  // 3. Puntuación de Balance Táctico (0-100)
  let tacticalScore = 80;

  // Penalización crítica: NO tener arquero
  if (gkCount === 0) {
    tacticalScore -= 40; // ¡Jugar sin arquero es un suicidio futbolístico!
  } else if (gkCount > 2) {
    tacticalScore -= 15; // Demasiados arqueros desperdician puestos
  } else {
    tacticalScore += 10; // Arquero garantizado
  }

  // Cobertura defensiva (ideal: 3-5 defensores)
  if (defCount === 0) {
    tacticalScore -= 30;
  } else if (defCount < 3) {
    tacticalScore -= 15;
  } else if (defCount >= 3 && defCount <= 5) {
    tacticalScore += 10;
  }

  // Cobertura de mediocampo (ideal: 2-4 volantes)
  if (midCount === 0) {
    tacticalScore -= 20;
  } else if (midCount >= 2 && midCount <= 4) {
    tacticalScore += 8;
  }

  // Pegada ofensiva (ideal: 2-4 delanteros)
  if (attCount === 0) {
    tacticalScore -= 25;
  } else if (attCount > 6) {
    tacticalScore -= 15; // Demasiados delanteros descompensan al equipo
  } else if (attCount >= 2 && attCount <= 4) {
    tacticalScore += 8;
  }

  const tacticalBalanceScore = Math.min(100, Math.max(10, tacticalScore));

  // Puntuación Global Ponderada (Fútbol Real 40% + In-Game 35% + Táctica 25%)
  const totalFootballScore = Math.round(
    realLifeScore * 0.40 + inGameScore * 0.35 + tacticalBalanceScore * 0.25
  );

  // Veredicto Narrativo del DT Bot
  let verdictTitle = '';
  let verdictComment = '';
  let tacticalVerdict = '';

  if (gkCount === 0) {
    tacticalVerdict = '⚠️ ¡Peligro mayúsculo! No fichaste ningún arquero profesional para el arco.';
  } else if (defCount < 3) {
    tacticalVerdict = '⚠️ Defensa muy desguarnecida. Con menos de 3 defensores sufrirán cada contraataque.';
  } else if (attCount > 5) {
    tacticalVerdict = '⚡ Delantera ultra-poblada, pero con riesgo de romperse el equipo en el mediocampo.';
  } else {
    tacticalVerdict = '✅ Formación sólida y equilibrada en todas las líneas del campo.';
  }

  if (totalFootballScore >= 88) {
    verdictTitle = '⭐ ONCE GALÁCTICO DE ÉPOCA';
    verdictComment = `¡Una verdadera máquina del fútbol! Con una media de GRL ${avgGrl} y figuras legendarias como ${legendaryPlayers.slice(0, 3).join(', ') || 'cracks mundiales'}, este equipo competiría por levantar cualquier trofeo de la historia.`;
  } else if (totalFootballScore >= 78) {
    verdictTitle = '🏆 CANDIDATO AL TÍTULO';
    verdictComment = `Plantel formidable con poder de fuego y jerarquía internacional. El DT armó una estructura temible con ${tierSCount} cartas de Tier S y ${goldenPlaystyles} PlayStyles dorados.`;
  } else if (totalFootballScore >= 68) {
    verdictTitle = '⚔️ EQUIPO COMPETITIVO';
    verdictComment = `Un conjunto con mucha garra y momentos de alta calidad, aunque con algunos detalles de sincronización táctica entre líneas.`;
  } else {
    verdictTitle = '🚧 PROYECTO EN RECONSTRUCCIÓN';
    verdictComment = `Plantilla con descompensaciones evidentes en la distribución de puestos o falta de jerarquía en posiciones clave. El DT deberá trabajar horas extras en la pizarra táctica.`;
  }

  return {
    buyerId: buyer.id,
    buyerName: buyer.name,
    squad,
    realLifeScore,
    inGameScore,
    tacticalBalanceScore,
    totalFootballScore,
    goalkeeperCount: gkCount,
    defenderCount: defCount,
    midfielderCount: midCount,
    attackerCount: attCount,
    averageGrl: avgGrl,
    goldenPlaystylesCount: goldenPlaystyles,
    legendaryPlayers,
    verdictTitle,
    verdictComment,
    tacticalVerdict,
  };
}

/**
 * Determina el campeón futbolístico y la tabla de posiciones según mérito deportivo.
 */
export function judgeTournament(buyers: Buyer[]): BotTournamentVerdict {
  const evaluations = buyers.map(evaluateManagerSquad);

  // Ordenar por puntuación futbolística total descendente
  evaluations.sort((a, b) => {
    if (b.totalFootballScore !== a.totalFootballScore) {
      return b.totalFootballScore - a.totalFootballScore;
    }
    // Desempate: mayor puntuación histórica real
    if (b.realLifeScore !== a.realLifeScore) {
      return b.realLifeScore - a.realLifeScore;
    }
    // Desempate: mayor promedio GRL
    return b.averageGrl - a.averageGrl;
  });

  const champion = evaluations[0];

  const botIntro = `Analizadas las 11 posiciones de cada escuadrón, la trayectoria real de sus futbolistas (Balones de Oro, Mundiales, Champions) y su potencia sobre el césped de FC Mobile, el veredicto del VAR Experto es inapelable:`;

  return {
    champion,
    rankings: evaluations,
    botIntro,
  };
}
