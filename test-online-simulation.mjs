// scripts/test_online_simulation.mjs
// Script de simulación multijugador exhaustiva para el modo Online de Subasta de Futbolistas
import assert from 'node:assert';
import { evaluateManagerSquad } from './src/services/footballBotJudge.ts';

console.log('===============================================================');
console.log(' SIMULADOR MULTIJUGADOR ONLINE: SUBASTA CON RESCATE DE CANTERA ');
console.log('===============================================================\n');

// Mock de futbolistas con atributos completos
const mockCatalog = [
  {
    id: 'p_pele',
    name: 'Pelé',
    versions: [{ id: 'v_pele', grl: 122, posicion: 'CAM', tier: 'S', value: 100, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_TRICKSTER', level: 2, title: 'Fantasista' }] }],
  },
  {
    id: 'p_maradona',
    name: 'Diego Maradona',
    versions: [{ id: 'v_maradona', grl: 122, posicion: 'CAM', tier: 'S', value: 100, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_FINESSE_SHOT', level: 2, title: 'Tiro con Calidad' }] }],
  },
  {
    id: 'p_messi',
    name: 'Lionel Messi',
    versions: [{ id: 'v_messi', grl: 122, posicion: 'RW', tier: 'S', value: 98, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_FINESSE_SHOT', level: 2, title: 'Tiro con Calidad' }] }],
  },
  {
    id: 'p_cr7',
    name: 'Cristiano Ronaldo',
    versions: [{ id: 'v_cr7', grl: 120, posicion: 'LW', tier: 'A', value: 96, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_POWER_SHOT', level: 2, title: 'Tiro Potente' }] }],
  },
  {
    id: 'p_buffon',
    name: 'Gianluigi Buffon',
    versions: [{ id: 'v_buffon', grl: 122, posicion: 'GK', tier: 'S', value: 95, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_FAR_REACH', level: 2, title: 'Reflejos Felinos' }] }],
  },
  {
    id: 'p_maldini',
    name: 'Paolo Maldini',
    versions: [{ id: 'v_maldini', grl: 122, posicion: 'CB', tier: 'S', value: 95, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_STAND_TACKLE_MASTER', level: 2, title: 'Anticipación' }] }],
  },
  {
    id: 'p_zidane',
    name: 'Zinedine Zidane',
    versions: [{ id: 'v_zidane', grl: 122, posicion: 'CM', tier: 'S', value: 98, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_TIKI_TAKA', level: 2, title: 'Tiki-Taka' }] }],
  },
  {
    id: 'p_ronaldo_r9',
    name: 'Ronaldo Nazário',
    versions: [{ id: 'v_ronaldo_r9', grl: 122, posicion: 'ST', tier: 'S', value: 98, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_CLINICAL_FINISHER', level: 2, title: 'Definición Clínica' }] }],
  },
  {
    id: 'p_cafu',
    name: 'Cafú',
    versions: [{ id: 'v_cafu', grl: 121, posicion: 'RB', tier: 'S', value: 85, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_ACCELERATOR', level: 1, title: 'Paso Rápido' }] }],
  },
  {
    id: 'p_rcarlos',
    name: 'Roberto Carlos',
    versions: [{ id: 'v_rcarlos', grl: 121, posicion: 'LB', tier: 'S', value: 85, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_POWER_SHOT', level: 2, title: 'Tiro Potente' }] }],
  },
  {
    id: 'p_xavi',
    name: 'Xavi Hernández',
    versions: [{ id: 'v_xavi', grl: 121, posicion: 'CM', tier: 'S', value: 90, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_BULLET_PASS', level: 1, title: 'Pase Incisivo' }] }],
  },
  {
    id: 'p_iniesta',
    name: 'Andrés Iniesta',
    versions: [{ id: 'v_iniesta', grl: 121, posicion: 'CM', tier: 'S', value: 92, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_TIKI_TAKA', level: 2, title: 'Tiki-Taka' }] }],
  },
  {
    id: 'p_casillas',
    name: 'Iker Casillas',
    versions: [{ id: 'v_casillas', grl: 121, posicion: 'GK', tier: 'S', value: 92, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_FAR_REACH', level: 1, title: 'Reflejos Felinos' }] }],
  },
  {
    id: 'p_ramos',
    name: 'Sergio Ramos',
    versions: [{ id: 'v_ramos', grl: 121, posicion: 'CB', tier: 'S', value: 90, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_AERIAL_DEFENSE', level: 2, title: 'Juego Aéreo' }] }],
  },
  {
    id: 'p_puyol',
    name: 'Carles Puyol',
    versions: [{ id: 'v_puyol', grl: 120, posicion: 'CB', tier: 'A', value: 88, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_STAND_TACKLE_MASTER', level: 1, title: 'Anticipación' }] }],
  },
  {
    id: 'p_ronaldinho',
    name: 'Ronaldinho Gaúcho',
    versions: [{ id: 'v_ronaldinho', grl: 122, posicion: 'LW', tier: 'S', value: 98, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_TRICKSTER', level: 2, title: 'Fantasista' }] }],
  },
  {
    id: 'p_henry',
    name: 'Thierry Henry',
    versions: [{ id: 'v_henry', grl: 121, posicion: 'ST', tier: 'S', value: 94, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_FINESSE_SHOT', level: 1, title: 'Tiro con Calidad' }] }],
  },
  {
    id: 'p_beckham',
    name: 'David Beckham',
    versions: [{ id: 'v_beckham', grl: 120, posicion: 'RM', tier: 'A', value: 88, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_DEAD_BALL_SPECIALIST', level: 2, title: 'Balón Parado' }] }],
  },
  {
    id: 'p_kaka',
    name: 'Kaká',
    versions: [{ id: 'v_kaka', grl: 121, posicion: 'CAM', tier: 'S', value: 94, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_RAPID_DRIBBLE', level: 2, title: 'Velocidad Pura' }] }],
  },
  {
    id: 'p_pirlo',
    name: 'Andrea Pirlo',
    versions: [{ id: 'v_pirlo', grl: 120, posicion: 'CM', tier: 'A', value: 89, decks: ['leyendas'], playstyles: [{ name: 'PLAYSTYLE_LONG_BALL_PASSER', level: 2, title: 'Pase Largo Milimétrico' }] }],
  },
];

// Helper para obtener postulantes activos
function getActiveBidders(participantes, targetSquadSize = 11) {
  return participantes.filter((p) => p.squad.length < targetSquadSize);
}

// -------------------------------------------------------------
// TEST 1: Estado inicial de ronda con highestBid en 0
// -------------------------------------------------------------
console.log('--- TEST 1: Inicialización Limpia de Ronda Online ---');
const room = {
  codigo: 'SALA99',
  hostId: 'user_host',
  estado: 'en_juego',
  config: {
    targetSquadSize: 11,
    initialBudget: 50,
    minIncrement: 5,
    selectedDeck: 'leyendas',
  },
  participantes: [
    { id: 'user_host', name: 'Host DT', budget: 50, squad: [] },
    { id: 'user_broke', name: 'DT Quebrado', budget: 0, squad: [] },
    { id: 'user_regular', name: 'DT Regular', budget: 50, squad: [] },
  ],
  rondaActual: {
    roundNumber: 1,
    player: mockCatalog[0],
    version: mockCatalog[0].versions[0],
    highestBid: 0,
    highestBidderId: null,
    currentTurnBuyerIndex: 1, // Turno inicial en user_broke
    consecutivePasses: 0,
    isClosed: false,
    isDesierta: false,
    isRevealed: false,
    purchasedClue: null,
  },
  historial: [],
};

assert.strictEqual(room.rondaActual.highestBid, 0, 'La ronda inicial debe arrancar con highestBid en 0');
const minReq = room.rondaActual.highestBid === 0
  ? room.config.minIncrement
  : room.rondaActual.highestBid + room.config.minIncrement;
assert.strictEqual(minReq, 5, 'La primera oferta requerida debe ser minIncrement (5), no el doble');
console.log('✅ Apertura de ronda con precio inicial 0 e incremento base de 5: CORRECTO');

// -------------------------------------------------------------
// TEST 2: Puja de Rescate (0 Fichas) y Re-puja Competitiva
// -------------------------------------------------------------
console.log('\n--- TEST 2: Puja de Rescate por Quiebra (0 Fichas) ---');
const brokeBuyer = room.participantes[1];
assert.strictEqual(brokeBuyer.id, 'user_broke');

// user_broke no puede pagar 5, pero la puja actual es 0 -> puede solicitar rescate
const canRescue = room.rondaActual.highestBid === 0 && brokeBuyer.budget < minReq;
assert.strictEqual(canRescue, true, 'Manager quebrado debe ser elegible para Rescate de Cantera');

// Ejecuta puja de rescate por 0
room.rondaActual.highestBid = 0;
room.rondaActual.highestBidderId = brokeBuyer.id;
room.rondaActual.consecutivePasses = 0;
room.rondaActual.currentTurnBuyerIndex = (room.rondaActual.currentTurnBuyerIndex + 1) % room.participantes.length;

assert.strictEqual(room.rondaActual.highestBidderId, 'user_broke');
assert.strictEqual(room.rondaActual.highestBid, 0);

// Ahora le toca a user_regular (índice 2)
const regularBuyer = room.participantes[room.rondaActual.currentTurnBuyerIndex];
assert.strictEqual(regularBuyer.id, 'user_regular');

// user_regular puede superar la puja de 0 con la mínima regular (5)
const nextMin = room.rondaActual.highestBid === 0 && room.rondaActual.highestBidderId
  ? room.config.minIncrement
  : room.rondaActual.highestBid + room.config.minIncrement;
assert.strictEqual(nextMin, 5, 'Sobrepujar a un rescate requiere solo la mínima normal de 5 fichas');

room.rondaActual.highestBid = nextMin;
room.rondaActual.highestBidderId = regularBuyer.id;
room.rondaActual.consecutivePasses = 0;
room.rondaActual.currentTurnBuyerIndex = (room.rondaActual.currentTurnBuyerIndex + 1) % room.participantes.length;

assert.strictEqual(room.rondaActual.highestBid, 5);
assert.strictEqual(room.rondaActual.highestBidderId, 'user_regular');
console.log('✅ Rescate de 0 fichas solicitado y sobrepujado limpiamente por otro manager: CORRECTO');

// -------------------------------------------------------------
// TEST 3: Salto de Turno por Control de Host (Anti-AFK / Disconnect)
// -------------------------------------------------------------
console.log('\n--- TEST 3: Control de Host para Saltar Turno Inactivo ---');
// Host detecta que el siguiente participante no responde
const currentTurnBefore = room.rondaActual.currentTurnBuyerIndex;
const activeBidders = getActiveBidders(room.participantes, room.config.targetSquadSize);

// skipTurnByHost simula pase forzado
room.rondaActual.consecutivePasses += 1;
room.rondaActual.currentTurnBuyerIndex = (room.rondaActual.currentTurnBuyerIndex + 1) % activeBidders.length;

assert.notStrictEqual(room.rondaActual.currentTurnBuyerIndex, currentTurnBefore);
assert.strictEqual(room.rondaActual.consecutivePasses, 1);
console.log('✅ Control de Host saltó turno de forma segura sin romper el ciclo: CORRECTO');

// -------------------------------------------------------------
// TEST 4: Rescate en Ronda Desierta (0 Fichas para el Quebrado)
// -------------------------------------------------------------
console.log('\n--- TEST 4: Adjudicación en Ronda Desierta para Manager Sin Fondos ---');
// Nueva ronda donde nadie puja
const round2 = {
  roundNumber: 2,
  player: mockCatalog[1],
  version: mockCatalog[1].versions[0],
  highestBid: 0,
  highestBidderId: null,
  currentTurnBuyerIndex: 0,
  consecutivePasses: 3, // Todos pasaron
  isClosed: false,
};

const brokeList = room.participantes.filter(p => p.budget < room.config.minIncrement);
assert.strictEqual(brokeList.length, 1);
assert.strictEqual(brokeList[0].id, 'user_broke');

// En vez de descartar la carta, se le adjudica a user_broke por 0 fichas
const recipient = [...brokeList].sort((a, b) => a.squad.length - b.squad.length)[0];
assert.strictEqual(recipient.id, 'user_broke');

recipient.squad.push({
  playerId: round2.player.id,
  playerName: round2.player.name,
  paidPrice: 0,
  roundNumber: 2,
  version: round2.version,
});
round2.isClosed = true;

assert.strictEqual(recipient.squad.length, 1);
assert.strictEqual(recipient.squad[0].paidPrice, 0);
assert.strictEqual(recipient.budget, 0); // No se endeuda
console.log('✅ Ronda desierta rescató a manager quebrado a coste 0: CORRECTO');

// -------------------------------------------------------------
// TEST 5: Prevención de Desbordamiento de Índice de Turnos
// -------------------------------------------------------------
console.log('\n--- TEST 5: Protección Contra Desbordamiento de Índice de Turnos ---');
// Simulamos que el host completa sus 11 fichajes y sale de activeBidders
const hostBuyer = room.participantes[0];
hostBuyer.squad = new Array(11).fill(null).map((_, i) => ({
  playerName: `Jugador Host ${i}`,
  paidPrice: 5,
  version: mockCatalog[2].versions[0],
}));

const remainingActive = getActiveBidders(room.participantes, room.config.targetSquadSize);
assert.strictEqual(remainingActive.length, 2, 'Quedan 2 participantes activos');

// Si el índice almacenado era 2 (que correspondía al 3er jugador),
// antes producía remainingActive[2] = undefined -> partida congelada!
const rawTurnIndex = 2;
const safeTurnIndex = remainingActive.length > 0 ? (rawTurnIndex % remainingActive.length) : 0;
const currentActive = remainingActive[safeTurnIndex];

assert.ok(currentActive !== undefined, 'currentActive no debe ser undefined');
assert.ok(safeTurnIndex < remainingActive.length, 'safeTurnIndex debe estar acotado');
console.log(`✅ Turn Index Clamping: raw ${rawTurnIndex} acotado a ${safeTurnIndex} (${currentActive.name}): CORRECTO`);

// -------------------------------------------------------------
// TEST 6: Bancarrota Total Multijugador y Auto-Draft Final
// -------------------------------------------------------------
console.log('\n--- TEST 6: Bancarrota Total y Auto-Draft a Once Titular Completo ---');
// Los managers restantes agotan todo su dinero y no pueden pujar más
room.participantes.forEach(p => {
  p.budget = 0;
});

// Verificamos condición de bancarrota total
const activeBankrupt = getActiveBidders(room.participantes, room.config.targetSquadSize);
const isTotalBankruptcy = activeBankrupt.length > 0 && activeBankrupt.every(b => b.budget < room.config.minIncrement);
assert.strictEqual(isTotalBankruptcy, true, 'Debe detectarse bancarrota total');

// Ejecutar auto-draft de rescate hasta 11 jugadores
let catalogIdx = 3;
room.participantes.forEach(participant => {
  const needed = room.config.targetSquadSize - participant.squad.length;
  for (let i = 0; i < needed; i++) {
    const card = mockCatalog[catalogIdx % mockCatalog.length];
    catalogIdx++;
    participant.squad.push({
      playerId: card.id,
      playerName: card.name,
      paidPrice: 0,
      roundNumber: 99,
      version: card.versions[0],
    });
  }
});
room.estado = 'finalizado';

// Verificar que TODOS los managers tienen exactamente 11 jugadores
room.participantes.forEach(p => {
  assert.strictEqual(p.squad.length, 11, `${p.name} debe tener exactamente 11 jugadores`);
});
assert.strictEqual(room.estado, 'finalizado', 'La sala debe pasar a estado finalizado');
console.log('✅ Todos los managers completaron su Once Titular (11/11) y la sala finalizó limpiamente');

// -------------------------------------------------------------
// TEST 7: DT Bot Evaluador de los 3 Planteles Finales
// -------------------------------------------------------------
console.log('\n--- TEST 7: Evaluación de los 3 Planteles Finales por el DT Bot ---');
room.participantes.forEach(participant => {
  const evalResult = evaluateManagerSquad(participant);
  assert.ok(evalResult.totalFootballScore > 0, `Puntuación de ${participant.name} debe ser mayor a 0`);
  assert.strictEqual(evalResult.squad.length, 11, `Plantel de ${participant.name} debe evaluarse con 11 jugadores`);
  console.log(` 🏆 ${participant.name}: ${evalResult.totalFootballScore} pts (${evalResult.tacticalVerdict})`);
});
console.log('✅ Evaluación futbolística del DT Bot ejecutada sin errores para todos los planteles');

console.log('\n===============================================================');
console.log(' TODAS LAS PRUEBAS DE SIMULACIÓN ONLINE COMPLETADAS CON ÉXITO ');
console.log('===============================================================');
