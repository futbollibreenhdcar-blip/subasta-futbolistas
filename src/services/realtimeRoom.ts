import { supabase } from './supabase';
import type { DeckType, Player, PlayerVersion, Buyer } from '../types';

export interface RoomParticipant extends Buyer {
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
  estado: 'esperando' | 'subastando' | 'revelando' | 'finalizado';
  config: {
    initialBudget: number;
    minIncrement: number;
    targetSquadSize: number; // Siempre 11 fichajes
    selectedDeck: DeckType;
  };
  participantes: RoomParticipant[];
  ronda_actual: RoomRoundState | null;
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
 * Crea una nueva sala multijugador para el Anfitrión (Host)
 */
export async function createRoom(options?: {
  initialBudget?: number;
  minIncrement?: number;
  selectedDeck?: DeckType;
}): Promise<RoomState> {
  const codigo = generateRoomCode();
  const roomData: RoomState = {
    id: codigo,
    codigo,
    estado: 'esperando',
    config: {
      initialBudget: options?.initialBudget || 500,
      minIncrement: options?.minIncrement || 5,
      targetSquadSize: 11, // Regla fija: siempre 11 futbolistas
      selectedDeck: options?.selectedDeck || 'mixto',
    },
    participantes: [],
    ronda_actual: null,
    historial: ['Sala creada. Esperando conexión de managers desde sus celulares...'],
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

  return roomData;
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
    estado: data.estado,
    config: data.config,
    participantes: data.participantes || [],
    ronda_actual: data.ronda_actual,
    historial: data.historial || [],
  };
}

/**
 * Permite a un jugador unirse desde su celular a la sala
 */
export async function joinRoom(
  codigo: string,
  playerName: string
): Promise<{ participant: RoomParticipant; room: RoomState }> {
  const cleanCode = codigo.trim().toUpperCase();
  const room = await getRoom(cleanCode);

  if (!room) {
    throw new Error(`La sala "${cleanCode}" no existe.`);
  }

  if (room.estado !== 'esperando') {
    // Si la partida ya empezó, verificar si el jugador ya estaba registrado para re-conectarse
    const existing = room.participantes.find(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );
    if (existing) {
      return { participant: existing, room };
    }
    throw new Error('La subasta en esta sala ya ha comenzado.');
  }

  if (room.participantes.length >= 8) {
    throw new Error('La sala está completa (máximo 8 managers).');
  }

  // Verificar que el nombre no esté duplicado
  let finalName = playerName.trim();
  const nameExists = room.participantes.some(
    (p) => p.name.toLowerCase() === finalName.toLowerCase()
  );
  if (nameExists) {
    finalName = `${finalName} #${room.participantes.length + 1}`;
  }

  const newParticipant: RoomParticipant = {
    id: crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random()}`,
    name: finalName,
    budget: room.config.initialBudget,
    initialBudget: room.config.initialBudget,
    squad: [],
    isReady: true,
  };

  const updatedParticipants = [...room.participantes, newParticipant];
  const updatedHistorial = [
    `📱 ${finalName} se unió a la sala.`,
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

  // Emitir evento broadcast para actualización en tiempo real en la pantalla del Host
  const channel = supabase.channel(`room_${cleanCode}`);
  await channel.send({
    type: 'broadcast',
    event: 'PLAYER_JOINED',
    payload: { participant: newParticipant, participants: updatedParticipants },
  });

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
 * Actualiza el estado de la sala (llamado por el Host durante la partida)
 */
export async function updateRoomState(
  codigo: string,
  partial: Partial<RoomState>
): Promise<void> {
  const cleanCode = codigo.trim().toUpperCase();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (partial.estado !== undefined) updatePayload.estado = partial.estado;
  if (partial.config !== undefined) updatePayload.config = partial.config;
  if (partial.participantes !== undefined) updatePayload.participantes = partial.participantes;
  if (partial.ronda_actual !== undefined) updatePayload.ronda_actual = partial.ronda_actual;
  if (partial.historial !== undefined) updatePayload.historial = partial.historial;

  await supabase.from('salas').update(updatePayload).eq('codigo', cleanCode);

  // Notificar por broadcast websocket para respuesta instantánea (<30ms)
  const channel = supabase.channel(`room_${cleanCode}`);
  await channel.send({
    type: 'broadcast',
    event: 'STATE_CHANGED',
    payload: partial,
  });
}

/**
 * Suscribirse a los cambios en tiempo real de una sala
 */
export function subscribeToRoom(
  codigo: string,
  onStateUpdate: (room: RoomState) => void,
  onBroadcast?: (event: string, payload: any) => void
): () => void {
  const cleanCode = codigo.trim().toUpperCase();

  const channel = supabase.channel(`room_${cleanCode}`, {
    config: {
      broadcast: { self: true },
    },
  });

  // 1. Escuchar eventos broadcast ultrarrápidos
  channel.on('broadcast', { event: '*' }, (message) => {
    if (onBroadcast) {
      onBroadcast(message.event, message.payload);
    }
    // Si viene STATE_CHANGED o PLAYER_JOINED, podemos refrescar
    if (message.event === 'STATE_CHANGED' && message.payload) {
      getRoom(cleanCode).then((updated) => {
        if (updated) onStateUpdate(updated);
      });
    }
  });

  // 2. Escuchar cambios directos en la fila de Postgres de la tabla `salas`
  channel.on(
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
          estado: row.estado,
          config: row.config,
          participantes: row.participantes || [],
          ronda_actual: row.ronda_actual,
          historial: row.historial || [],
        });
      }
    }
  );

  channel.subscribe();

  // Función de limpieza para desuscribirse
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Enviar acción de puja desde el celular hacia el canal de la sala
 */
export async function sendMobileBid(
  codigo: string,
  participantId: string,
  amount: number
): Promise<void> {
  const cleanCode = codigo.trim().toUpperCase();
  const channel = supabase.channel(`room_${cleanCode}`);
  await channel.send({
    type: 'broadcast',
    event: 'MOBILE_BID',
    payload: { participantId, amount },
  });
}

/**
 * Enviar acción de pase de turno desde el celular hacia el canal de la sala
 */
export async function sendMobilePass(
  codigo: string,
  participantId: string
): Promise<void> {
  const cleanCode = codigo.trim().toUpperCase();
  const channel = supabase.channel(`room_${cleanCode}`);
  await channel.send({
    type: 'broadcast',
    event: 'MOBILE_PASS',
    payload: { participantId },
  });
}

/**
 * Enviar compra de pista confidencial desde el celular
 */
export async function sendMobileCluePurchase(
  codigo: string,
  participantId: string,
  clueType: 'posicion' | 'continente' | 'decada'
): Promise<void> {
  const cleanCode = codigo.trim().toUpperCase();
  const channel = supabase.channel(`room_${cleanCode}`);
  await channel.send({
    type: 'broadcast',
    event: 'MOBILE_BUY_CLUE',
    payload: { participantId, clueType },
  });
}
