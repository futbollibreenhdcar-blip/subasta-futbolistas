import { supabase } from './supabase';
import type { DeckType, Player, PlayerVersion, Buyer, BoughtPlayer } from '../types';

export interface RoomParticipant extends Buyer {
  isHost?: boolean;
  isReady?: boolean;
}

export interface RoomRoundState {
  roundNumber: number;
  player: Player;
  version: PlayerVersion;
  highestBid: number;
  highestBidderId: string | null;
  currentTurnBuyerIndex: number;
  consecutivePasses: number;
  isDesierta: boolean;
  isClosed: boolean;
  isRevealed: boolean;
  purchasedClue?: {
    type: 'posicion' | 'continente' | 'decada';
    label: string;
    buyerName: string;
  } | null;
}

export interface RoomState {
  id: string;
  codigo: string;
  hostId?: string;
  estado: 'esperando' | 'subastando' | 'revelando' | 'finalizado';
  config: {
    initialBudget: number;
    minIncrement: number;
    targetSquadSize: number; // Siempre 11 fichajes por equipo
    selectedDeck: DeckType;
  };
  participantes: RoomParticipant[];
  ronda_actual: RoomRoundState | null;
  usedPlayerIds?: string[];
  historial: string[];
  created_at?: string;
}

function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  let res = '';
  for (let i = 0; i < 2; i++) {
    res += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 2; i++) {
    res += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return res;
}

/**
 * Crea una nueva sala multijugador donde el creador (Host) TAMBIÉN juega como Manager
 */
export async function createRoom(options: {
  hostName: string;
  initialBudget?: number;
  minIncrement?: number;
  selectedDeck?: DeckType;
}): Promise<{ room: RoomState; hostParticipant: RoomParticipant }> {
  const codigo = generateRoomCode();
  const initialBudget = options.initialBudget || 500;

  const hostId = `host_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const hostParticipant: RoomParticipant = {
    id: hostId,
    name: options.hostName.trim() || 'DT Creador',
    budget: initialBudget,
    initialBudget: initialBudget,
    squad: [],
    isHost: true,
    isReady: true,
  };

  const roomData: RoomState = {
    id: codigo,
    codigo,
    hostId,
    estado: 'esperando',
    config: {
      initialBudget,
      minIncrement: options.minIncrement || 5,
      targetSquadSize: 11, // Regla oficial obligatoria: 11 fichajes
      selectedDeck: options.selectedDeck || 'mixto',
    },
    participantes: [hostParticipant],
    ronda_actual: null,
    usedPlayerIds: [],
    historial: [`🚀 Sala creada por ${hostParticipant.name}. Invita a tus amigos con el código ${codigo}.`],
  };

  const { error } = await supabase.from('salas').insert({
    id: codigo,
    codigo,
    estado: roomData.estado,
    config: roomData.config,
    participantes: roomData.participantes,
    ronda_actual: roomData.ronda_actual,
    historial: roomData.historial,
  });

  if (error) {
    throw new Error('Error al crear sala en Supabase: ' + error.message);
  }

  return { room: roomData, hostParticipant };
}

/**
 * Obtiene el estado actual de una sala por su código
 */
export async function getRoom(codigo: string): Promise<RoomState | null> {
  const cleanCode = codigo.trim().toUpperCase();
  const { data, error } = await supabase
    .from('salas')
    .select('*')
    .eq('codigo', cleanCode)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    codigo: data.codigo,
    hostId: data.participantes?.find((p: any) => p.isHost)?.id,
    estado: data.estado,
    config: data.config,
    participantes: data.participantes || [],
    ronda_actual: data.ronda_actual,
    usedPlayerIds: data.usedPlayerIds || [],
    historial: data.historial || [],
  };
}

/**
 * Permite a un jugador unirse o reconectarse a la sala desde su celular
 */
export async function joinRoom(
  codigo: string,
  playerName: string,
  participantId?: string
): Promise<{ participant: RoomParticipant; room: RoomState }> {
  const cleanCode = codigo.trim().toUpperCase();
  const room = await getRoom(cleanCode);

  if (!room) {
    throw new Error(`La sala "${cleanCode}" no existe.`);
  }

  const cleanName = playerName.trim();

  // 1. Si el jugador ya estaba registrado por ID de participante (reconexión confiable)
  if (participantId) {
    const existingById = room.participantes.find((p) => p.id === participantId);
    if (existingById) {
      return { participant: existingById, room };
    }
  }

  // 2. Si el jugador ya estaba registrado por nombre exacto en la sala
  const existingByName = room.participantes.find(
    (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (existingByName) {
    return { participant: existingByName, room };
  }

  // 3. Si no estaba y la partida ya empezó, no permite entrar a nuevos jugadores
  if (room.estado !== 'esperando') {
    throw new Error('La subasta en esta sala ya ha comenzado y no admite nuevos participantes.');
  }

  if (room.participantes.length >= 8) {
    throw new Error('La sala está completa (máximo 8 managers).');
  }

  if (!cleanName) {
    throw new Error('Por favor ingresa un nombre válido para unirte a la sala.');
  }

  const newParticipant: RoomParticipant = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    budget: room.config.initialBudget,
    initialBudget: room.config.initialBudget,
    squad: [],
    isHost: false,
    isReady: true,
  };

  const updatedParticipants = [...room.participantes, newParticipant];
  const updatedHistorial = [
    `📱 ${cleanName} se unió a la sala.`,
    ...room.historial.slice(0, 15),
  ];

  await supabase
    .from('salas')
    .update({
      participantes: updatedParticipants,
      historial: updatedHistorial,
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', cleanCode);

  return {
    participant: newParticipant,
    room: {
      ...room,
      participantes: updatedParticipants,
      historial: updatedHistorial,
    },
  };
}

/**
 * Filtra jugadores elegibles según el mazo seleccionado y que no hayan sido sorteados
 */
function getEligiblePlayers(allPlayers: Player[], usedIds: string[], deck: DeckType): Player[] {
  return allPlayers.filter((p) => {
    if (usedIds.includes(p.id)) return false;
    if (deck === 'mixto') return p.versions.length > 0;
    return p.versions.some((v) => v.decks.includes(deck));
  });
}

/**
 * Inicia la subasta sorteando la primera carta para todos los dispositivos
 */
export async function startOnlineAuction(room: RoomState, allPlayers: Player[]): Promise<void> {
  const eligible = getEligiblePlayers(allPlayers, [], room.config.selectedDeck);
  if (eligible.length === 0) {
    throw new Error('No hay futbolistas disponibles en este mazo.');
  }

  const randomPlayer = eligible[Math.floor(Math.random() * eligible.length)];
  const matchingVersions =
    room.config.selectedDeck === 'mixto'
      ? randomPlayer.versions
      : randomPlayer.versions.filter((v) => v.decks.includes(room.config.selectedDeck));
  const chosenVersion = matchingVersions[Math.floor(Math.random() * matchingVersions.length)] || randomPlayer.versions[0];

  const firstRound: RoomRoundState = {
    roundNumber: 1,
    player: randomPlayer,
    version: chosenVersion,
    highestBid: 0,
    highestBidderId: null,
    currentTurnBuyerIndex: 0,
    consecutivePasses: 0,
    isDesierta: false,
    isClosed: false,
    isRevealed: false,
    purchasedClue: null,
  };

  const updatedHistorial = [
    `⚽ ¡Comenzó la subasta! Ronda 1: Silueta misteriosa de Tier ${chosenVersion.tier} (${chosenVersion.evento}) en el estrado.`,
    ...room.historial.slice(0, 10),
  ];

  await supabase
    .from('salas')
    .update({
      estado: 'subastando',
      ronda_actual: firstRound,
      historial: updatedHistorial,
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', room.codigo);
}

/**
 * Realiza una puja atómica desde el dispositivo del jugador activo
 */
export async function placeBidInRoom(
  room: RoomState,
  participantId: string,
  amount: number
): Promise<void> {
  const currentRoom = (await getRoom(room.codigo)) || room;
  if (!currentRoom.ronda_actual || currentRoom.ronda_actual.isClosed) return;

  const buyer = currentRoom.participantes.find((p) => p.id === participantId);
  if (!buyer) return;

  // Si es puja de rescate de cantera (0 Fichas):
  // Se permite cuando nadie ha ofertado aún y el participante no tiene fondos para la puja mínima
  const isRescueBid = amount === 0 && currentRoom.ronda_actual.highestBid === 0;
  if (!isRescueBid) {
    if (buyer.budget < amount) return;
    if (amount <= currentRoom.ronda_actual.highestBid) return;
  }

  const activeBidders = currentRoom.participantes.filter(
    (b) => b.squad.length < currentRoom.config.targetSquadSize
  );

  const safeNextIdx =
    activeBidders.length > 0
      ? (currentRoom.ronda_actual.currentTurnBuyerIndex + 1) % activeBidders.length
      : 0;

  const updatedRound: RoomRoundState = {
    ...currentRoom.ronda_actual,
    highestBid: amount,
    highestBidderId: participantId,
    currentTurnBuyerIndex: safeNextIdx,
    consecutivePasses: 0, // Se resetean los pases tras una nueva oferta
  };

  const bidMsg =
    amount === 0
      ? `🚨 ${buyer.name} solicitó un Fichaje de Rescate de Cantera (0 Fichas).`
      : `🔥 ${buyer.name} ofertó ${amount} Fichas Estelares.`;

  const updatedHistorial = [
    bidMsg,
    ...currentRoom.historial.slice(0, 15),
  ];

  await supabase
    .from('salas')
    .update({
      ronda_actual: updatedRound,
      historial: updatedHistorial,
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', currentRoom.codigo);
}

/**
 * Pasa de turno. Si todos los demás pasaron, cierra la ronda y revela la carta.
 */
export async function passTurnInRoom(
  room: RoomState,
  participantId: string
): Promise<void> {
  const currentRoom = (await getRoom(room.codigo)) || room;
  if (!currentRoom.ronda_actual || currentRoom.ronda_actual.isClosed) return;

  const buyer = currentRoom.participantes.find((p) => p.id === participantId);
  if (!buyer) return;

  const activeBidders = currentRoom.participantes.filter(
    (b) => b.squad.length < currentRoom.config.targetSquadSize
  );

  const newPasses = currentRoom.ronda_actual.consecutivePasses + 1;
  const newHistorial = [
    `✋ ${buyer.name} pasó turno.`,
    ...currentRoom.historial.slice(0, 15),
  ];

  // Caso 1: Nadie ofertó y todos pasaron
  if (currentRoom.ronda_actual.highestBidderId === null) {
    if (newPasses >= activeBidders.length) {
      // 🌟 RESCATE FINANCIERO:
      // Si algún manager activo no tiene presupuesto suficiente (< minIncrement),
      // se le adjudica el futbolista como Agente Libre de Cantera a 0 Fichas para no bloquear la partida!
      const minInc = currentRoom.config.minIncrement || 5;
      const brokeManagers = activeBidders.filter((b) => b.budget < minInc);

      if (brokeManagers.length > 0) {
        brokeManagers.sort((a, b) => a.squad.length - b.squad.length);
        const rescueWinner = brokeManagers[0];

        const boughtItem: BoughtPlayer = {
          playerId: currentRoom.ronda_actual.player.id,
          playerName: currentRoom.ronda_actual.player.name,
          version: currentRoom.ronda_actual.version,
          paidPrice: 0,
          roundNumber: currentRoom.ronda_actual.roundNumber,
        };

        const updatedParticipants = currentRoom.participantes.map((p) => {
          if (p.id === rescueWinner.id) {
            return {
              ...p,
              squad: [...p.squad, boughtItem],
            };
          }
          return p;
        });

        const closedRound: RoomRoundState = {
          ...currentRoom.ronda_actual,
          highestBid: 0,
          highestBidderId: rescueWinner.id,
          isClosed: true,
          isRevealed: true,
          consecutivePasses: newPasses,
        };

        const rescueHistorial = [
          `🚨 ¡RESCATE DE CANTERA! Al no haber ofertas, ${rescueWinner.name} recibe a ${currentRoom.ronda_actual.player.name} como Agente Libre (0 Fichas).`,
          ...newHistorial,
        ];

        await supabase
          .from('salas')
          .update({
            participantes: updatedParticipants,
            ronda_actual: closedRound,
            historial: rescueHistorial,
            updated_at: new Date().toISOString(),
          })
          .eq('codigo', currentRoom.codigo);
        return;
      }

      // Si todos tenían fondos y voluntariamente pasaron -> Ronda Desierta estándar
      const closedRound: RoomRoundState = {
        ...currentRoom.ronda_actual,
        isDesierta: true,
        isClosed: true,
        isRevealed: true,
        consecutivePasses: newPasses,
      };

      await supabase
        .from('salas')
        .update({
          ronda_actual: closedRound,
          historial: ['❌ Ronda desierta. Ningún DT ofertó por la silueta.', ...newHistorial],
          updated_at: new Date().toISOString(),
        })
        .eq('codigo', currentRoom.codigo);
      return;
    }
  } else {
    // Caso 2: Hay un mejor postor y todos los demás pasaron -> Adjudicado
    if (newPasses >= activeBidders.length - 1) {
      const winner = currentRoom.participantes.find(
        (p) => p.id === currentRoom.ronda_actual?.highestBidderId
      );
      if (!winner) return;

      const price = currentRoom.ronda_actual.highestBid;
      const boughtItem: BoughtPlayer = {
        playerId: currentRoom.ronda_actual.player.id,
        playerName: currentRoom.ronda_actual.player.name,
        version: currentRoom.ronda_actual.version,
        paidPrice: price,
        roundNumber: currentRoom.ronda_actual.roundNumber,
      };

      const updatedParticipants = currentRoom.participantes.map((p) => {
        if (p.id === winner.id) {
          return {
            ...p,
            budget: Math.max(0, p.budget - price),
            squad: [...p.squad, boughtItem],
          };
        }
        return p;
      });

      const closedRound: RoomRoundState = {
        ...currentRoom.ronda_actual,
        isClosed: true,
        isRevealed: true,
      };

      const finalHistorial = [
        price === 0
          ? `🎉 ¡ADJUDICADO POR RESCATE! ${winner.name} fichó a ${currentRoom.ronda_actual.player.name} a Coste Cero (0 Fichas).`
          : `🎉 ¡ADJUDICADO! ${winner.name} fichó a ${currentRoom.ronda_actual.player.name} por ${price} Fichas.`,
        ...newHistorial,
      ];

      await supabase
        .from('salas')
        .update({
          participantes: updatedParticipants,
          ronda_actual: closedRound,
          historial: finalHistorial,
          updated_at: new Date().toISOString(),
        })
        .eq('codigo', currentRoom.codigo);
      return;
    }
  }

  // Si no se cerró, avanza el turno al siguiente participante con índice protegido
  const safeNextIdx =
    activeBidders.length > 0
      ? (currentRoom.ronda_actual.currentTurnBuyerIndex + 1) % activeBidders.length
      : 0;

  const updatedRound: RoomRoundState = {
    ...currentRoom.ronda_actual,
    currentTurnBuyerIndex: safeNextIdx,
    consecutivePasses: newPasses,
  };

  await supabase
    .from('salas')
    .update({
      ronda_actual: updatedRound,
      historial: newHistorial,
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', currentRoom.codigo);
}

/**
 * Compra una pista desde el dispositivo
 */
export async function buyClueInRoom(
  room: RoomState,
  participantId: string,
  clueType: 'posicion' | 'continente' | 'decada'
): Promise<void> {
  const currentRoom = (await getRoom(room.codigo)) || room;
  if (!currentRoom.ronda_actual || currentRoom.ronda_actual.isClosed) return;

  const buyer = currentRoom.participantes.find((p) => p.id === participantId);
  if (!buyer) return;

  const clueCost = Math.max(10, Math.round(currentRoom.config.initialBudget * 0.05));
  if (buyer.budget < clueCost) return;

  let clueVal = '';
  if (clueType === 'posicion') {
    clueVal = currentRoom.ronda_actual.version.posicionPista || currentRoom.ronda_actual.version.posicion || 'Campo';
  } else if (clueType === 'continente') {
    clueVal = currentRoom.ronda_actual.version.continentePista || 'Internacional';
  } else {
    clueVal = currentRoom.ronda_actual.version.decadaPista || 'Época Actual';
  }

  const updatedParticipants = currentRoom.participantes.map((p) =>
    p.id === participantId ? { ...p, budget: p.budget - clueCost } : p
  );

  const updatedRound: RoomRoundState = {
    ...currentRoom.ronda_actual,
    purchasedClue: {
      type: clueType,
      label: `${clueType.toUpperCase()}: ${clueVal}`,
      buyerName: buyer.name,
    },
  };

  await supabase
    .from('salas')
    .update({
      participantes: updatedParticipants,
      ronda_actual: updatedRound,
      historial: [
        `💡 ${buyer.name} desbloqueó la pista de ${clueType.toUpperCase()} (-${clueCost} Fichas)`,
        ...currentRoom.historial.slice(0, 15),
      ],
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', currentRoom.codigo);
}

/**
 * Avanza a la siguiente ronda sorteando otro futbolista, o finaliza la subasta
 */
export async function advanceNextRoundInRoom(
  room: RoomState,
  allPlayers: Player[]
): Promise<void> {
  const currentRoom = (await getRoom(room.codigo)) || room;

  // Guarda de idempotencia: Si la ronda actual existe y aún NO está cerrada, se ignora el avance duplicado
  if (currentRoom.ronda_actual && !currentRoom.ronda_actual.isClosed) {
    console.warn('advanceNextRoundInRoom: La ronda actual aún no ha cerrado. Se ignora avance duplicado.');
    return;
  }

  // 1. Chequear si todos los managers completaron sus 11 futbolistas
  const activeBidders = currentRoom.participantes.filter(
    (b) => b.squad.length < currentRoom.config.targetSquadSize
  );

  if (activeBidders.length === 0) {
    await supabase
      .from('salas')
      .update({
        estado: 'finalizado',
        historial: ['🏁 ¡Todos los managers completaron sus 11 fichajes! Partida finalizada.'],
        updated_at: new Date().toISOString(),
      })
      .eq('codigo', currentRoom.codigo);
    return;
  }

  // 🌟 RESCATE DE BANCARROTA TOTAL:
  // Si ningún manager activo tiene fondos para ofertar (< minIncrement),
  // se completan automáticamente los cupos vacíos con canteranos / agentes libres (0 Fichas) y se finaliza!
  const minInc = currentRoom.config.minIncrement || 5;
  const hasAnySolventBidder = activeBidders.some((b) => b.budget >= minInc);

  if (!hasAnySolventBidder) {
    const usedIds: string[] = [];
    currentRoom.participantes.forEach((p) => p.squad.forEach((item) => usedIds.push(item.playerId)));

    let eligiblePool = getEligiblePlayers(allPlayers, usedIds, currentRoom.config.selectedDeck);
    if (eligiblePool.length === 0) eligiblePool = allPlayers;

    let poolIdx = 0;
    const completedParticipants = currentRoom.participantes.map((p) => {
      if (p.squad.length >= currentRoom.config.targetSquadSize) return p;

      const needed = currentRoom.config.targetSquadSize - p.squad.length;
      const emergencySignings: BoughtPlayer[] = [];

      for (let i = 0; i < needed; i++) {
        const freeAgent = eligiblePool[poolIdx % eligiblePool.length];
        poolIdx++;
        const matchingVer =
          currentRoom.config.selectedDeck === 'mixto'
            ? freeAgent.versions
            : freeAgent.versions.filter((v) => v.decks.includes(currentRoom.config.selectedDeck));
        const ver = matchingVer[0] || freeAgent.versions[0];

        emergencySignings.push({
          playerId: freeAgent.id,
          playerName: freeAgent.name,
          version: ver,
          paidPrice: 0,
          roundNumber: (currentRoom.ronda_actual?.roundNumber || 0) + 1 + i,
        });
      }

      return {
        ...p,
        squad: [...p.squad, ...emergencySignings],
      };
    });

    await supabase
      .from('salas')
      .update({
        participantes: completedParticipants,
        estado: 'finalizado',
        historial: [
          '🏁 ¡Partida finalizada! Los cupos restantes se completaron con Fichajes de Emergencia de la Cantera (0 Fichas). ¡El Bot DT ya está evaluando!',
          ...currentRoom.historial.slice(0, 10),
        ],
        updated_at: new Date().toISOString(),
      })
      .eq('codigo', currentRoom.codigo);
    return;
  }

  // 2. Extraer jugadores ya subastados
  const usedIds: string[] = [];
  currentRoom.participantes.forEach((p) => {
    p.squad.forEach((item) => usedIds.push(item.playerId));
  });
  if (currentRoom.ronda_actual) {
    usedIds.push(currentRoom.ronda_actual.player.id);
  }

  const eligible = getEligiblePlayers(allPlayers, usedIds, currentRoom.config.selectedDeck);
  if (eligible.length === 0) {
    await supabase
      .from('salas')
      .update({
        estado: 'finalizado',
        historial: ['🏁 ¡Se agotó el mazo de cartas temático! Partida finalizada.'],
        updated_at: new Date().toISOString(),
      })
      .eq('codigo', currentRoom.codigo);
    return;
  }

  const randomPlayer = eligible[Math.floor(Math.random() * eligible.length)];
  const matchingVersions =
    currentRoom.config.selectedDeck === 'mixto'
      ? randomPlayer.versions
      : randomPlayer.versions.filter((v) => v.decks.includes(currentRoom.config.selectedDeck));
  const chosenVersion = matchingVersions[Math.floor(Math.random() * matchingVersions.length)] || randomPlayer.versions[0];

  const nextRoundNumber = (currentRoom.ronda_actual?.roundNumber || 0) + 1;

  const nextRound: RoomRoundState = {
    roundNumber: nextRoundNumber,
    player: randomPlayer,
    version: chosenVersion,
    highestBid: 0,
    highestBidderId: null,
    currentTurnBuyerIndex: 0,
    consecutivePasses: 0,
    isDesierta: false,
    isClosed: false,
    isRevealed: false,
    purchasedClue: null,
  };

  await supabase
    .from('salas')
    .update({
      ronda_actual: nextRound,
      historial: [
        `⭐ Ronda ${nextRoundNumber}: Nueva silueta en el estrado (Tier ${chosenVersion.tier} • ${chosenVersion.evento}).`,
        ...currentRoom.historial.slice(0, 15),
      ],
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', currentRoom.codigo);
}

/**
 * Permite al Host saltar el turno de un participante que se haya quedado AFK o desconectado
 */
export async function skipTurnByHost(
  codigo: string,
  participantIdToSkip: string
): Promise<void> {
  const room = await getRoom(codigo);
  if (!room || !room.ronda_actual || room.ronda_actual.isClosed) return;
  await passTurnInRoom(room, participantIdToSkip);
}

/**
 * Permite al Host expulsar a un participante de la sala (en lobby o durante la partida)
 */
export async function kickParticipantFromRoom(
  codigo: string,
  participantIdToKick: string
): Promise<void> {
  const cleanCode = codigo.trim().toUpperCase();
  const room = await getRoom(cleanCode);
  if (!room) return;

  const participantToKick = room.participantes.find((p) => p.id === participantIdToKick);
  if (!participantToKick || participantToKick.isHost) {
    return;
  }

  const updatedParticipants = room.participantes.filter((p) => p.id !== participantIdToKick);
  const updatedHistorial = [
    `🚫 El Anfitrión expulsó a ${participantToKick.name} de la sala.`,
    ...room.historial.slice(0, 15),
  ];

  let updatedRound = room.ronda_actual;
  if (updatedRound && !updatedRound.isClosed) {
    const activeBidders = updatedParticipants.filter(
      (b) => b.squad.length < room.config.targetSquadSize
    );
    const newIdx =
      activeBidders.length > 0
        ? updatedRound.currentTurnBuyerIndex % activeBidders.length
        : 0;

    let highestBidderId = updatedRound.highestBidderId;
    let highestBid = updatedRound.highestBid;
    if (highestBidderId === participantIdToKick) {
      highestBidderId = null;
      highestBid = room.config.minIncrement;
    }

    updatedRound = {
      ...updatedRound,
      currentTurnBuyerIndex: newIdx,
      highestBidderId,
      highestBid,
    };
  }

  await supabase
    .from('salas')
    .update({
      participantes: updatedParticipants,
      ronda_actual: updatedRound,
      historial: updatedHistorial,
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', cleanCode);
}

/**
 * Permite a un participante abandonar la sala voluntariamente
 */
export async function leaveRoom(
  codigo: string,
  participantId: string
): Promise<void> {
  const cleanCode = codigo.trim().toUpperCase();
  const room = await getRoom(cleanCode);
  if (!room) return;

  const leaver = room.participantes.find((p) => p.id === participantId);
  if (!leaver) return;

  // Si el host abandona la sala, se finaliza la sala para todos
  if (leaver.isHost) {
    await supabase
      .from('salas')
      .update({
        estado: 'finalizado',
        historial: [
          `🚪 El Anfitrión ${leaver.name} abandonó y cerró la sala.`,
          ...room.historial.slice(0, 15),
        ],
        updated_at: new Date().toISOString(),
      })
      .eq('codigo', cleanCode);
    return;
  }

  // Si un participante común abandona
  const updatedParticipants = room.participantes.filter((p) => p.id !== participantId);
  const updatedHistorial = [
    `🚪 ${leaver.name} abandonó la partida.`,
    ...room.historial.slice(0, 15),
  ];

  let updatedRound = room.ronda_actual;
  if (updatedRound && !updatedRound.isClosed) {
    const activeBidders = updatedParticipants.filter(
      (b) => b.squad.length < room.config.targetSquadSize
    );
    const newIdx =
      activeBidders.length > 0
        ? updatedRound.currentTurnBuyerIndex % activeBidders.length
        : 0;

    let highestBidderId = updatedRound.highestBidderId;
    let highestBid = updatedRound.highestBid;
    if (highestBidderId === participantId) {
      highestBidderId = null;
      highestBid = room.config.minIncrement;
    }

    updatedRound = {
      ...updatedRound,
      currentTurnBuyerIndex: newIdx,
      highestBidderId,
      highestBid,
    };
  }

  await supabase
    .from('salas')
    .update({
      participantes: updatedParticipants,
      ronda_actual: updatedRound,
      historial: updatedHistorial,
      updated_at: new Date().toISOString(),
    })
    .eq('codigo', cleanCode);
}

/**
 * Suscribirse en tiempo real a los cambios de la sala (Postgres Changes + WebSockets)
 */
export function subscribeToRoom(
  codigo: string,
  onStateUpdate: (room: RoomState) => void,
  onBroadcast?: (event: string, payload: any) => void
): () => void {
  const cleanCode = codigo.trim().toUpperCase();

  const channel = supabase.channel(`room_sync_${cleanCode}`, {
    config: { broadcast: { self: true } },
  });

  if (onBroadcast) {
    channel.on('broadcast', { event: '*' }, (msg) => {
      onBroadcast(msg.event, msg.payload);
    });
  }

  channel
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'salas',
        filter: `codigo=eq.${cleanCode}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (row) {
          onStateUpdate({
            id: row.id,
            codigo: row.codigo,
            hostId: row.participantes?.find((p: any) => p.isHost)?.id,
            estado: row.estado,
            config: row.config,
            participantes: row.participantes || [],
            ronda_actual: row.ronda_actual,
            historial: row.historial || [],
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Wrappers para compatibilidad con código legado si fuera necesario
export async function updateRoomState(codigo: string, partial: Partial<RoomState>): Promise<void> {
  await supabase.from('salas').update({ ...partial, updated_at: new Date().toISOString() }).eq('codigo', codigo.trim().toUpperCase());
}

export async function sendMobileBid(codigo: string, participantId: string, amount: number): Promise<void> {
  const room = await getRoom(codigo);
  if (room) await placeBidInRoom(room, participantId, amount);
}

export async function sendMobilePass(codigo: string, participantId: string): Promise<void> {
  const room = await getRoom(codigo);
  if (room) await passTurnInRoom(room, participantId);
}

export async function sendMobileCluePurchase(
  codigo: string,
  participantId: string,
  clueType: 'posicion' | 'continente' | 'decada'
): Promise<void> {
  const room = await getRoom(codigo);
  if (room) await buyClueInRoom(room, participantId, clueType);
}
