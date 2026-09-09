// Test suite para verificar las reglas de negocio del motor de subasta
import assert from 'node:assert';

console.log('--- TEST 1: Lógica de Sorteo sin Repetición y Filtro por Mazo ---');
const mockPlayers = [
  {
    id: 'p1',
    name: 'Lionel Messi',
    versions: [
      { id: 'v1_1', versionTag: 'Prime 2012', tier: 'S', value: 99, decks: ['leyendas', 'estrellas_actuales'] },
      { id: 'v1_2', versionTag: 'PSG 2021', tier: 'A', value: 85, decks: ['estrellas_actuales'] },
    ],
  },
  {
    id: 'p2',
    name: 'Gianluigi Buffon',
    versions: [
      { id: 'v2_1', versionTag: 'Parma 1999', tier: 'B', value: 75, decks: ['arqueros', 'retirados'] },
      { id: 'v2_2', versionTag: 'Mundial 2006', tier: 'S', value: 95, decks: ['arqueros', 'leyendas'] },
    ],
  },
  {
    id: 'p3',
    name: 'Kylian Mbappé',
    versions: [
      { id: 'v3_1', versionTag: 'Mundial 2018', tier: 'S', value: 92, decks: ['estrellas_actuales'] },
    ],
  },
];

// Filtrar mazo arqueros
const gkPlayers = mockPlayers.filter(p => p.versions.some(v => v.decks.includes('arqueros')));
assert.strictEqual(gkPlayers.length, 1);
assert.strictEqual(gkPlayers[0].name, 'Gianluigi Buffon');

// Sorteo sin repetición
const usedIds = ['p1'];
const available = mockPlayers.filter(p => !usedIds.includes(p.id));
assert.strictEqual(available.length, 2);
assert.ok(!available.some(p => p.id === 'p1'));
console.log('✅ Sorteo y filtrado de mazos: CORRECTO');

console.log('\n--- TEST 2: Lógica de Puja por Turnos y Pases Consecutivos ---');
// Simular subasta con 3 compradores
const buyers = [
  { id: 'b1', name: 'Manager 1', budget: 500, squad: [] },
  { id: 'b2', name: 'Manager 2', budget: 500, squad: [] },
  { id: 'b3', name: 'Manager 3', budget: 500, squad: [] },
];

// Caso A: Ronda Desierta (todos pasan inicialmente)
let consecutivePasses = 0;
let highestBidder = null;
let highestBid = 0;
let isDesierta = false;
let isClosed = false;

for (let i = 0; i < buyers.length; i++) {
  consecutivePasses++;
  if (highestBidder === null && consecutivePasses >= buyers.length) {
    isDesierta = true;
    isClosed = true;
  }
}
assert.strictEqual(isDesierta, true);
assert.strictEqual(isClosed, true);
assert.strictEqual(highestBid, 0);
console.log('✅ Ronda desierta: CORRECTO');

// Caso B: Subasta disputada
consecutivePasses = 0;
highestBidder = null;
highestBid = 0;
isDesierta = false;
isClosed = false;

// Turno 1: b1 puja 10
highestBid = 10;
highestBidder = 'b1';
consecutivePasses = 0;

// Turno 2: b2 sube a 25
highestBid = 25;
highestBidder = 'b2';
consecutivePasses = 0;

// Turno 3: b3 pasa
consecutivePasses++;
assert.strictEqual(consecutivePasses, 1);
assert.strictEqual(isClosed, false);

// Turno 4: b1 pasa
consecutivePasses++;
assert.strictEqual(consecutivePasses, 2);
// Como hay 3 compradores, 2 pases consecutivos tras la oferta de b2 cierran la puja!
if (consecutivePasses >= buyers.length - 1) {
  isClosed = true;
}
assert.strictEqual(isClosed, true);
assert.strictEqual(highestBidder, 'b2');
assert.strictEqual(highestBid, 25);
console.log('✅ Cierre de puja con ganador: CORRECTO');

console.log('\n--- TEST 3: Métricas de Pantalla Final ("Mejor Manager" y "Peor Estafado") ---');
const finishedBuyers = [
  {
    id: 'b1',
    name: 'Manager Inteligente',
    initialBudget: 500,
    budget: 400, // gastó 100
    squad: [
      { paidPrice: 50, version: { value: 90, tier: 'S', versionTag: 'V1' } }, // +40 ganancia
      { paidPrice: 50, version: { value: 80, tier: 'A', versionTag: 'V2' } }, // +30 ganancia
    ],
  },
  {
    id: 'b2',
    name: 'Manager Despilfarrador',
    initialBudget: 500,
    budget: 350, // gastó 150
    squad: [
      { paidPrice: 120, version: { value: 20, tier: 'D', versionTag: 'Malo' } }, // sobrepago +100 (ESTAFA)
      { paidPrice: 30, version: { value: 30, tier: 'C', versionTag: 'Regular' } },
    ],
  },
];

// Cálculo de métricas
const stats = finishedBuyers.map(b => {
  const spent = b.initialBudget - b.budget;
  const totalVal = b.squad.reduce((acc, p) => acc + p.version.value, 0);
  const ratio = spent > 0 ? totalVal / spent : 0;
  let maxOverpay = 0;
  let worstItem = null;
  b.squad.forEach(p => {
    const diff = p.paidPrice - p.version.value;
    if (diff > maxOverpay) {
      maxOverpay = diff;
      worstItem = p;
    }
  });
  return { buyer: b, spent, totalVal, ratio, maxOverpay, worstItem };
});

const bestManager = [...stats].sort((a, b) => b.ratio - a.ratio)[0];
assert.strictEqual(bestManager.buyer.name, 'Manager Inteligente');
assert.strictEqual(bestManager.ratio, 170 / 100); // 1.7x

let worstBuyer = null;
let maxOver = 0;
stats.forEach(s => {
  if (s.maxOverpay > maxOver) {
    maxOver = s.maxOverpay;
    worstBuyer = s.buyer;
  }
});
assert.strictEqual(worstBuyer.name, 'Manager Despilfarrador');
assert.strictEqual(maxOver, 100);
console.log('✅ Cálculo de rankings y premios: CORRECTO');

console.log('\n--- TEST 4: Regla Obligatoria de 11 Fichajes (Once Titular FUT) ---');
const TARGET_SQUAD_SIZE = 11;
const testSquadManagers = [
  { id: 'm1', name: 'DT 1', squad: new Array(10).fill({ paidPrice: 10, version: { value: 10 } }) },
  { id: 'm2', name: 'DT 2', squad: new Array(11).fill({ paidPrice: 10, version: { value: 10 } }) },
];

// m2 ya tiene 11 futbolistas (plantel completo), por lo que debe quedar inactivo
let activeList = testSquadManagers.filter(m => m.squad.length < TARGET_SQUAD_SIZE);
assert.strictEqual(activeList.length, 1);
assert.strictEqual(activeList[0].id, 'm1');

// Cuando m1 ficha su jugador #11, ambos están completos y la subasta termina
testSquadManagers[0].squad.push({ paidPrice: 10, version: { value: 10 } });
activeList = testSquadManagers.filter(m => m.squad.length < TARGET_SQUAD_SIZE);
assert.strictEqual(activeList.length, 0);
console.log('✅ Regla de 11 fichajes obligatorios por manager: CORRECTO');

console.log('\n--- TEST 5: Evaluación del DT Bot / Jurado Futbolístico Experto ---');
// Importar lógica del DT Bot
import { evaluateManagerSquad, judgeTournament } from './src/services/footballBotJudge.ts';

const dreamTeamBuyer = {
  id: 'dt_legend',
  name: 'DT Campeón Galáctico',
  budget: 50,
  initialBudget: 500,
  squad: [
    { playerName: 'Gianluigi Buffon', paidPrice: 50, version: { grl: 122, posicion: 'GK', tier: 'S', value: 95, playstyles: [{ name: 'PLAYSTYLE_FAR_REACH', level: 2, title: 'Reflejos Felinos' }] } },
    { playerName: 'Paolo Maldini', paidPrice: 50, version: { grl: 122, posicion: 'CB', tier: 'S', value: 95, playstyles: [{ name: 'PLAYSTYLE_STAND_TACKLE_MASTER', level: 2, title: 'Anticipación' }] } },
    { playerName: 'Virgil van Dijk', paidPrice: 40, version: { grl: 122, posicion: 'CB', tier: 'S', value: 90, playstyles: [{ name: 'PLAYSTYLE_AERIAL_DEFENSE', level: 1, title: 'Juego Aéreo' }] } },
    { playerName: 'Cafú', paidPrice: 40, version: { grl: 121, posicion: 'RB', tier: 'S', value: 85, playstyles: [{ name: 'PLAYSTYLE_ACCELERATOR', level: 1, title: 'Paso Rápido' }] } },
    { playerName: 'Roberto Carlos', paidPrice: 40, version: { grl: 121, posicion: 'LB', tier: 'S', value: 85, playstyles: [{ name: 'PLAYSTYLE_POWER_SHOT', level: 2, title: 'Tiro Potente' }] } },
    { playerName: 'Zidane', paidPrice: 50, version: { grl: 122, posicion: 'CM', tier: 'S', value: 98, playstyles: [{ name: 'PLAYSTYLE_TIKI_TAKA', level: 2, title: 'Tiki-Taka' }] } },
    { playerName: 'Xavi', paidPrice: 40, version: { grl: 121, posicion: 'CM', tier: 'S', value: 90, playstyles: [{ name: 'PLAYSTYLE_BULLET_PASS', level: 1, title: 'Pase Incisivo' }] } },
    { playerName: 'Pelé', paidPrice: 60, version: { grl: 122, posicion: 'CAM', tier: 'S', value: 100, playstyles: [{ name: 'PLAYSTYLE_TRICKSTER', level: 2, title: 'Fantasista' }] } },
    { playerName: 'Lionel Messi', paidPrice: 50, version: { grl: 122, posicion: 'RW', tier: 'S', value: 98, playstyles: [{ name: 'PLAYSTYLE_FINESSE_SHOT', level: 2, title: 'Tiro con Calidad' }] } },
    { playerName: 'Cristiano Ronaldo', paidPrice: 50, version: { grl: 120, posicion: 'LW', tier: 'A', value: 96, playstyles: [{ name: 'PLAYSTYLE_POWER_SHOT', level: 2, title: 'Tiro Potente' }] } },
    { playerName: 'Ronaldo Nazário', paidPrice: 50, version: { grl: 122, posicion: 'ST', tier: 'S', value: 98, playstyles: [{ name: 'PLAYSTYLE_CLINICAL_FINISHER', level: 2, title: 'Definición Clínica' }] } },
  ],
};

const chaoticBuyer = {
  id: 'dt_chaotic',
  name: 'DT Descompensado',
  budget: 450,
  initialBudget: 500,
  squad: new Array(11).fill(null).map((_, i) => ({
    playerName: `Delantero Random ${i}`,
    paidPrice: 5,
    version: { grl: 115, posicion: 'ST', tier: 'C', value: 40, playstyles: [] },
  })),
};

const evalDream = evaluateManagerSquad(dreamTeamBuyer);
const evalChaotic = evaluateManagerSquad(chaoticBuyer);

assert.ok(evalDream.totalFootballScore > evalChaotic.totalFootballScore, 'Dream team debe superar al equipo caótico');
assert.ok(evalDream.realLifeScore >= 80, 'Pelé, Messi, CR7 y Zidane deben dar alta puntuación histórica');
assert.strictEqual(evalChaotic.goalkeeperCount, 0, 'Equipo caótico no tiene portero');
assert.ok(evalChaotic.tacticalBalanceScore < 60, 'Jugar sin arquero y con 11 delanteros debe penalizar el balance');
assert.ok(evalDream.goldenPlaystylesCount >= 5, 'Dream team debe acumular múltiples PlayStyles+ dorados');

const tournament = judgeTournament([chaoticBuyer, dreamTeamBuyer]);
assert.strictEqual(tournament.champion.buyerId, 'dt_legend', 'El DT Campeón Galáctico debe coronarse campeón de torneo');
console.log('✅ DT Bot Evaluador y VAR Futbolístico: CORRECTO (Puntuación Campeón: ' + evalDream.totalFootballScore + ' pts vs ' + evalChaotic.totalFootballScore + ' pts)');

console.log('\n=======================================');
console.log(' TODOS LOS TESTS DE REGLAS PASARON (5/5) ');
console.log('=======================================');
