import React, { useState, useEffect } from 'react';
import {
  RoomState,
  RoomParticipant,
  subscribeToRoom,
  sendMobileBid,
  sendMobilePass,
  sendMobileCluePurchase,
} from '../services/realtimeRoom';
import { StarTokenIcon } from './StarTokenIcon';
import { SquadPitchView } from './SquadPitchView';

interface OnlinePlayerScreenProps {
  initialRoom: RoomState;
  participant: RoomParticipant;
  onExit: () => void;
}

export const OnlinePlayerScreen: React.FC<OnlinePlayerScreenProps> = ({
  initialRoom,
  participant,
  onExit,
}) => {
  const [room, setRoom] = useState<RoomState>(initialRoom);
  const [activeTab, setActiveTab] = useState<'bidding' | 'squad'>('bidding');
  const [biddingError, setBiddingError] = useState<string | null>(null);

  // Suscribirse a actualizaciones de la sala en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToRoom(room.codigo, (updatedRoom) => {
      setRoom(updatedRoom);
    });

    return () => {
      unsubscribe();
    };
  }, [room.codigo]);

  // Obtener la versión más reciente del participante desde el estado de la sala
  const currentParticipant =
    room.participantes.find((p) => p.id === participant.id) || participant;

  const round = room.ronda_actual;
  const activeBidders = room.participantes.filter(
    (b) => b.squad.length < room.config.targetSquadSize
  );

  const currentTurnBuyer =
    round && !round.isClosed ? activeBidders[round.currentTurnBuyerIndex] : null;

  const isMyTurn = currentTurnBuyer?.id === currentParticipant.id;
  const isLeader = round?.highestBidderId === currentParticipant.id;
  const isSquadFull = currentParticipant.squad.length >= room.config.targetSquadSize;

  const minIncrement = room.config.minIncrement || 5;
  const minRequiredBid = round
    ? round.highestBid === 0
      ? minIncrement
      : round.highestBid + minIncrement
    : minIncrement;

  // Haptic Feedback en celulares
  const triggerHaptic = (ms: number = 35) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (e) {}
  };

  const handlePlaceBid = async (amount: number) => {
    setBiddingError(null);
    triggerHaptic(50);

    if (amount > currentParticipant.budget) {
      setBiddingError('No tienes suficientes Fichas Estelares.');
      return;
    }

    if (amount < minRequiredBid) {
      setBiddingError(`La puja mínima requerida es ${minRequiredBid} Fichas.`);
      return;
    }

    try {
      await sendMobileBid(room.codigo, currentParticipant.id, amount);
    } catch (e: any) {
      setBiddingError(e.message);
    }
  };

  const handlePass = async () => {
    setBiddingError(null);
    triggerHaptic(25);
    try {
      await sendMobilePass(room.codigo, currentParticipant.id);
    } catch (e: any) {
      setBiddingError(e.message);
    }
  };

  const handleBuyClue = async (clueType: 'posicion' | 'continente' | 'decada') => {
    const clueCost = Math.max(10, Math.round(room.config.initialBudget * 0.05));
    if (currentParticipant.budget < clueCost) {
      setBiddingError('Presupuesto insuficiente para la pista.');
      return;
    }
    triggerHaptic(40);
    await sendMobileCluePurchase(room.codigo, currentParticipant.id, clueType);
  };

  // RENDER 1: FIN DE PARTIDA - VER MI ONCE TITULAR
  if (room.estado === 'finalizado') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 select-none">
        <div className="text-center space-y-2">
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black uppercase font-display">
            🏁 SUBASTA FINALIZADA
          </span>
          <h2 className="text-2xl font-black text-slate-900 uppercase font-display">
            Tu Once Titular FUT 11
          </h2>
          <p className="text-xs text-slate-500">
            {currentParticipant.name} • {currentParticipant.squad.length}/11 Fichajes
          </p>
        </div>

        <SquadPitchView manager={currentParticipant} />

        <button
          onClick={onExit}
          className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider font-display shadow-lg"
        >
          SALIR DE LA SALA
        </button>
      </div>
    );
  }

  // RENDER 2: LOBBY DE ESPERA EN EL CELULAR
  if (room.estado === 'esperando') {
    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-8 select-none text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl font-display flex items-center justify-center mx-auto shadow-lg shadow-amber-400/20">
            {currentParticipant.name.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase font-display">
            ¡Estás Conectado!
          </h2>
          <p className="text-xs text-slate-500">
            Manager: <strong className="text-slate-900">{currentParticipant.name}</strong>
          </p>
        </div>

        {/* Tarjeta de Sala */}
        <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-6 text-white space-y-3 shadow-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            CÓDIGO DE SALA
          </span>
          <div className="text-5xl font-black tracking-widest text-amber-400 font-display">
            {room.codigo}
          </div>
          <div className="pt-2 flex items-center justify-center gap-1 font-mono text-xs text-yellow-300">
            <span>Presupuesto Inicial:</span>
            <StarTokenIcon size={14} />
            <span className="font-bold">{room.config.initialBudget}</span>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            El juego comenzará cuando el anfitrión lo indique en la pantalla principal.
          </p>
        </div>

        {/* Lista de rivales conectados */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-xs space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
            Managers en la Sala ({room.participantes.length}/8)
          </span>
          <div className="flex flex-wrap gap-2">
            {room.participantes.map((p) => (
              <span
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-xl font-display font-bold uppercase ${
                  p.id === currentParticipant.id
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onExit}
          className="text-xs text-rose-600 font-bold uppercase tracking-wider hover:underline"
        >
          Desconectarme de la sala
        </button>
      </div>
    );
  }

  // RENDER 3: CONTROLADOR TÁCTIL EN VIVO DE SUBASTA
  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4 select-none flex flex-col min-h-[92vh] justify-between">
      {/* Barra de Estado del Jugador (Sticky Header) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs font-display flex items-center justify-center">
            {currentParticipant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-display font-black text-xs text-white uppercase truncate max-w-[120px]">
              {currentParticipant.name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Sala {room.codigo}
            </span>
          </div>
        </div>

        {/* Saldo de Fichas Estelares */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase block font-sans">
              Plantel
            </span>
            <span className="font-black text-slate-200">
              {currentParticipant.squad.length}/11
            </span>
          </div>
          <div className="bg-slate-800/90 border border-amber-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1 text-yellow-300 font-black">
            <StarTokenIcon size={14} />
            <span>{currentParticipant.budget}</span>
          </div>
        </div>
      </div>

      {/* Pestañas: Pujar vs Ver Mi Plantel */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl text-xs font-display font-black">
        <button
          onClick={() => {
            setActiveTab('bidding');
            triggerHaptic(20);
          }}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'bidding'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          🎮 CONTROL DE PUJA
        </button>
        <button
          onClick={() => {
            setActiveTab('squad');
            triggerHaptic(20);
          }}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'squad'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          ⚽ MI ONCE ({currentParticipant.squad.length}/11)
        </button>
      </div>

      {/* CONTENIDO DE LA PESTAÑA */}
      {activeTab === 'squad' ? (
        <div className="space-y-4 flex-1">
          <SquadPitchView manager={currentParticipant} />
        </div>
      ) : (
        /* PESTAÑA DE PUJA EN VIVO */
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Tarjeta de Estado de la Ronda Actual */}
          {round && (
            <div
              className={`rounded-3xl p-5 border-2 text-center transition-all shadow-md space-y-2 ${
                isSquadFull
                  ? 'bg-slate-100 border-slate-300 text-slate-600'
                  : isMyTurn
                  ? 'bg-amber-50 border-amber-400 text-slate-900 animate-pulse'
                  : isLeader
                  ? 'bg-emerald-50 border-emerald-400 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase tracking-widest font-display font-black block">
                {isSquadFull
                  ? '🏆 TU PLANTEL ESTÁ COMPLETO (11/11)'
                  : isMyTurn
                  ? '🔥 ¡ES TU TURNO DE OFERTAR!'
                  : isLeader
                  ? '👑 ¡TIENES LA MEJOR OFERTA!'
                  : `TURNO DE: ${currentTurnBuyer?.name || 'OTRO MANAGER'}`}
              </span>

              {/* Oferta Más Alta */}
              <div className="flex items-center justify-center gap-1.5 text-3xl font-black text-amber-600 font-display">
                <StarTokenIcon size={24} />
                <span>{round.highestBid} Fichas</span>
              </div>

              <p className="text-xs text-slate-500 font-mono">
                {round.highestBidderId
                  ? `Postor: ${
                      room.participantes.find((p) => p.id === round.highestBidderId)?.name ||
                      'Rival'
                    }`
                  : 'Sin ofertas aún en esta ronda'}
              </p>

              {/* Pista revelada si la hay */}
              {round.purchasedClue && (
                <div className="mt-2 p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold font-mono">
                  💡 {round.purchasedClue.label}
                </div>
              )}
            </div>
          )}

          {biddingError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
              ⚠️ {biddingError}
            </div>
          )}

          {/* Botonera Táctil Móvil */}
          {!isSquadFull && round && !round.isClosed ? (
            <div className="space-y-3">
              {/* Botones de incremento rápido */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePlaceBid(minRequiredBid)}
                  disabled={minRequiredBid > currentParticipant.budget}
                  className="py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm uppercase font-display shadow-md flex flex-col items-center justify-center gap-0.5 disabled:opacity-40"
                >
                  <span className="text-[10px] opacity-80">MÍNIMA</span>
                  <div className="flex items-center gap-1">
                    <StarTokenIcon size={14} />
                    <span>{minRequiredBid}</span>
                  </div>
                </button>

                <button
                  onClick={() => handlePlaceBid(minRequiredBid + 5)}
                  disabled={minRequiredBid + 5 > currentParticipant.budget}
                  className="py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-yellow-300 font-black text-sm uppercase font-display shadow-md flex flex-col items-center justify-center gap-0.5 disabled:opacity-40"
                >
                  <span className="text-[10px] text-slate-400">+5 FICHAS</span>
                  <div className="flex items-center gap-1">
                    <StarTokenIcon size={14} />
                    <span>{minRequiredBid + 5}</span>
                  </div>
                </button>

                <button
                  onClick={() => handlePlaceBid(minRequiredBid + 10)}
                  disabled={minRequiredBid + 10 > currentParticipant.budget}
                  className="py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-yellow-300 font-black text-sm uppercase font-display shadow-md flex flex-col items-center justify-center gap-0.5 disabled:opacity-40"
                >
                  <span className="text-[10px] text-slate-400">+10 FICHAS</span>
                  <div className="flex items-center gap-1">
                    <StarTokenIcon size={14} />
                    <span>{minRequiredBid + 10}</span>
                  </div>
                </button>
              </div>

              {/* Botón Pasar Turno */}
              <button
                onClick={handlePass}
                className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-black text-xs uppercase tracking-wider font-display border border-slate-300 transition-all shadow-xs"
              >
                ✋ PASAR TURNO
              </button>

              {/* Acciones Secundarias (Pistas) */}
              <div className="pt-2 border-t border-slate-200 flex justify-between gap-2 text-[11px] font-mono">
                <button
                  onClick={() => handleBuyClue('posicion')}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  💡 Pista Posición
                </button>
                <button
                  onClick={() => handleBuyClue('continente')}
                  className="flex-1 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  🌍 Pista País
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs italic font-medium">
              {isSquadFull
                ? '¡Ya completaste tus 11 futbolistas! Espera a que los demás managers terminen sus planteles.'
                : 'Ronda cerrada en la pantalla principal. Preparando siguiente futbolista...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
