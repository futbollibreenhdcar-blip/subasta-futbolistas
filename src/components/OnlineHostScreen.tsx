import React, { useState, useEffect, useRef } from 'react';
import type { Player, BoughtPlayer } from '../types';
import {
  RoomState,
  RoomParticipant,
  subscribeToRoom,
  updateRoomState,
} from '../services/realtimeRoom';
import { SilhouetteCard } from './SilhouetteCard';
import { StarTokenIcon } from './StarTokenIcon';
import { GameOverScreen } from './GameOverScreen';
import { DECK_LABELS } from '../utils/tierColors';

interface OnlineHostScreenProps {
  initialRoom: RoomState;
  allPlayers: Player[];
  onExitRoom: () => void;
}

export const OnlineHostScreen: React.FC<OnlineHostScreenProps> = ({
  initialRoom,
  allPlayers,
  onExitRoom,
}) => {
  const [room, setRoom] = useState<RoomState>(initialRoom);
  const [usedPlayerIds, setUsedPlayerIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Ref para tener siempre la última versión de room en listeners de broadcast
  const roomRef = useRef<RoomState>(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const joinUrl = `${window.location.origin}${window.location.pathname}?sala=${room.codigo}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    joinUrl
  )}`;

  // Suscribirse a eventos de la sala en tiempo real
  useEffect(() => {
    const unsubscribe = subscribeToRoom(
      room.codigo,
      (updatedRoom) => {
        setRoom(updatedRoom);
      },
      (event, payload) => {
        handleBroadcastEvent(event, payload);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [room.codigo]);

  // Manejador de eventos entrantes desde los celulares de los jugadores
  const handleBroadcastEvent = async (event: string, payload: any) => {
    const current = roomRef.current;
    if (event === 'MOBILE_BID' && current.ronda_actual && !current.ronda_actual.isClosed) {
      const { participantId, amount } = payload;
      const buyer = current.participantes.find((p) => p.id === participantId);
      if (!buyer) return;

      const activeBidders = current.participantes.filter(
        (b) => b.squad.length < current.config.targetSquadSize
      );

      // Validar turno y presupuesto
      const currentTurnBuyer = activeBidders[current.ronda_actual.currentTurnBuyerIndex];
      if (currentTurnBuyer && currentTurnBuyer.id !== participantId) {
        // En subasta abierta o por turnos: si es su turno o es puja superior válida
      }

      if (amount <= current.ronda_actual.highestBid) return;
      if (amount > buyer.budget) return;

      const prevBid = current.ronda_actual.highestBid;
      const nextIdx =
        activeBidders.length > 0
          ? (current.ronda_actual.currentTurnBuyerIndex + 1) % activeBidders.length
          : 0;

      const newHistory = [
        `💰 ${buyer.name} ofertó ${amount} Fichas (+${amount - prevBid}) desde su celular`,
        ...current.historial.slice(0, 10),
      ];

      const updatedRound = {
        ...current.ronda_actual,
        highestBid: amount,
        highestBidderId: buyer.id,
        currentTurnBuyerIndex: nextIdx,
        consecutivePasses: 0,
      };

      await updateRoomState(current.codigo, {
        ronda_actual: updatedRound,
        historial: newHistory,
      });
    } else if (event === 'MOBILE_PASS' && current.ronda_actual && !current.ronda_actual.isClosed) {
      const { participantId } = payload;
      const buyer = current.participantes.find((p) => p.id === participantId);
      if (!buyer) return;

      const activeBidders = current.participantes.filter(
        (b) => b.squad.length < current.config.targetSquadSize
      );

      const newPasses = current.ronda_actual.consecutivePasses + 1;
      const newHistory = [
        `✋ ${buyer.name} pasó turno.`,
        ...current.historial.slice(0, 10),
      ];

      // Verificar si se cierra la ronda
      if (current.ronda_actual.highestBidderId === null) {
        // Nadie ofertó y todos pasaron -> Ronda desierta
        if (newPasses >= activeBidders.length) {
          const closedRound = {
            ...current.ronda_actual,
            isDesierta: true,
            isClosed: true,
            isRevealed: true,
            consecutivePasses: newPasses,
          };
          await updateRoomState(current.codigo, {
            ronda_actual: closedRound,
            historial: ['❌ Ronda desierta. Silueta descartada.', ...newHistory],
          });
          return;
        }
      } else {
        // Hay un mejor postor y los demás pasaron
        if (newPasses >= activeBidders.length - 1) {
          await resolveRoundWinner(current);
          return;
        }
      }

      const nextIdx =
        activeBidders.length > 0
          ? (current.ronda_actual.currentTurnBuyerIndex + 1) % activeBidders.length
          : 0;

      await updateRoomState(current.codigo, {
        ronda_actual: {
          ...current.ronda_actual,
          currentTurnBuyerIndex: nextIdx,
          consecutivePasses: newPasses,
        },
        historial: newHistory,
      });
    } else if (event === 'MOBILE_BUY_CLUE' && current.ronda_actual) {
      const { participantId, clueType } = payload;
      const buyer = current.participantes.find((p) => p.id === participantId);
      if (!buyer) return;

      const clueCost = Math.max(10, Math.round(current.config.initialBudget * 0.05));
      if (buyer.budget < clueCost) return;

      let clueVal = '';
      if (clueType === 'posicion') {
        clueVal = current.ronda_actual.version.posicionPista || current.ronda_actual.version.posicion || 'N/A';
      } else if (clueType === 'continente') {
        clueVal = current.ronda_actual.version.continentePista || 'Internacional';
      } else {
        clueVal = current.ronda_actual.version.decadaPista || 'Época Actual';
      }

      const updatedParticipants = current.participantes.map((p) =>
        p.id === participantId ? { ...p, budget: p.budget - clueCost } : p
      );

      const updatedRound = {
        ...current.ronda_actual,
        purchasedClue: {
          type: clueType,
          label: `${clueType.toUpperCase()}: ${clueVal}`,
          buyerName: buyer.name,
        },
      };

      await updateRoomState(current.codigo, {
        participantes: updatedParticipants,
        ronda_actual: updatedRound,
        historial: [
          `💡 ${buyer.name} desbloqueó la pista de ${clueType.toUpperCase()} (-${clueCost} Fichas)`,
          ...current.historial.slice(0, 10),
        ],
      });
    }
  };

  // Resuelve el ganador cuando los demás pasaron
  const resolveRoundWinner = async (current: RoomState) => {
    if (!current.ronda_actual || !current.ronda_actual.highestBidderId) return;

    const winner = current.participantes.find(
      (p) => p.id === current.ronda_actual?.highestBidderId
    );
    if (!winner) return;

    const price = current.ronda_actual.highestBid;
    const boughtItem: BoughtPlayer = {
      playerId: current.ronda_actual.player.id,
      playerName: current.ronda_actual.player.name,
      version: current.ronda_actual.version,
      paidPrice: price,
      roundNumber: current.ronda_actual.roundNumber,
    };

    const updatedParticipants = current.participantes.map((p) => {
      if (p.id === winner.id) {
        return {
          ...p,
          budget: p.budget - price,
          squad: [...p.squad, boughtItem],
        };
      }
      return p;
    });

    const closedRound = {
      ...current.ronda_actual,
      isClosed: true,
      isRevealed: true,
    };

    const newHistory = [
      `🎉 ¡ADJUDICADO! ${winner.name} fichó a ${current.ronda_actual.player.name} por ${price} Fichas.`,
      ...current.historial.slice(0, 10),
    ];

    await updateRoomState(current.codigo, {
      participantes: updatedParticipants,
      ronda_actual: closedRound,
      historial: newHistory,
    });
  };

  // Iniciar la subasta desde el lobby
  const handleStartAuction = async () => {
    if (room.participantes.length < 2) {
      alert('Se necesitan al menos 2 managers conectados desde sus celulares para empezar.');
      return;
    }

    await startNewRound(1, [], room.participantes);
  };

  // Inicia una nueva ronda sorteando un futbolista elegible
  const startNewRound = async (
    roundNum: number,
    currentUsed: string[],
    currentParticipants: RoomParticipant[]
  ) => {
    // Verificar si todos los managers completaron sus 11 fichajes
    const activeBidders = currentParticipants.filter(
      (b) => b.squad.length < room.config.targetSquadSize
    );

    if (activeBidders.length === 0) {
      await updateRoomState(room.codigo, {
        estado: 'finalizado',
        historial: ['🏁 ¡Todos los managers completaron sus 11 fichajes! Partida finalizada.'],
      });
      return;
    }

    // Filtrar jugadores del mazo no utilizados
    const eligible = allPlayers.filter((p) => {
      if (currentUsed.includes(p.id)) return false;
      if (room.config.selectedDeck === 'mixto') return p.versions.length > 0;
      return p.versions.some((v) => v.decks.includes(room.config.selectedDeck));
    });

    if (eligible.length === 0) {
      await updateRoomState(room.codigo, {
        estado: 'finalizado',
        historial: ['🏁 ¡Se agotó el mazo de cartas! Partida finalizada.'],
      });
      return;
    }

    const randomIdx = Math.floor(Math.random() * eligible.length);
    const chosenPlayer = eligible[randomIdx];

    const matchingVersions =
      room.config.selectedDeck === 'mixto'
        ? chosenPlayer.versions
        : chosenPlayer.versions.filter((v) => v.decks.includes(room.config.selectedDeck));

    const chosenVersion =
      matchingVersions[Math.floor(Math.random() * matchingVersions.length)];

    const updatedUsed = [...currentUsed, chosenPlayer.id];
    setUsedPlayerIds(updatedUsed);

    const firstEligibleIdx = currentParticipants.findIndex(
      (b) => b.squad.length < room.config.targetSquadSize
    );

    const newRoundState = {
      roundNumber: roundNum,
      player: chosenPlayer,
      version: chosenVersion,
      highestBid: 0,
      highestBidderId: null,
      currentTurnBuyerIndex: firstEligibleIdx >= 0 ? firstEligibleIdx : 0,
      consecutivePasses: 0,
      isDesierta: false,
      isClosed: false,
      isRevealed: false,
      purchasedClue: null,
    };

    await updateRoomState(room.codigo, {
      estado: 'subastando',
      ronda_actual: newRoundState,
      historial: [
        `Ronda ${roundNum} iniciada. Silueta en el estrado.`,
        ...room.historial.slice(0, 10),
      ],
    });
  };

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // RENDER 1: PANTALLA DE RESULTADOS / FIN DE PARTIDA
  if (room.estado === 'finalizado') {
    return (
      <GameOverScreen
        buyers={room.participantes}
        endReason="¡Mercado cerrado! Todos los managers completaron su escuadrón de 11 futbolistas."
        onPlayAgain={onExitRoom}
        onGoToManagement={onExitRoom}
      />
    );
  }

  // RENDER 2: LOBBY DE ESPERA CON CÓDIGO Y QR
  if (room.estado === 'esperando') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 select-none">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-500 text-xs font-black tracking-wider uppercase font-display">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            SALA MULTIJUGADOR EN VIVO
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight font-display">
            SALA DE SUBASTA
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Cada jugador debe ingresar a la web desde su celular e introducir el código o escanear el QR.
          </p>
        </div>

        {/* Tarjeta Gigante de Código de Sala & QR */}
        <div className="bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
          <div className="space-y-4 flex-1 text-center md:text-left">
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
              CÓDIGO DE SALA
            </span>
            <div className="text-6xl sm:text-8xl font-black tracking-widest text-amber-400 font-display drop-shadow-[0_4px_12px_rgba(251,191,36,0.3)]">
              {room.codigo}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 justify-center md:justify-start">
              <button
                onClick={copyJoinLink}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-xs active:scale-95"
              >
                <span>{copiedLink ? '✓ ¡ENLACE COPIADO!' : '📋 COPIAR ENLACE'}</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">
                Mazo: <strong className="text-white">{DECK_LABELS[room.config.selectedDeck]}</strong>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Plantel: <strong className="text-yellow-400">11 Fichajes</strong>
              </span>
            </div>
          </div>

          {/* Código QR */}
          <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center shrink-0">
            <img
              src={qrUrl}
              alt={`QR Sala ${room.codigo}`}
              className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
            />
            <span className="text-[10px] font-mono text-slate-800 font-black mt-1.5 uppercase">
              Escanea para Unirte
            </span>
          </div>
        </div>

        {/* Lista de Participantes Conectados en Tiempo Real */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>MANAGERS CONECTADOS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-black">
                {room.participantes.length}/8
              </span>
            </h3>
            <span className="text-xs text-slate-500">
              Mínimo 2 managers para iniciar
            </span>
          </div>

          {room.participantes.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-2xl animate-pulse">
                📱
              </div>
              <p className="text-slate-500 text-sm font-medium">
                Esperando a que los jugadores se unan desde sus celulares...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {room.participantes.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-sm font-display flex items-center justify-center shadow-xs">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-display font-black text-xs text-slate-900 uppercase truncate">
                      {p.name}
                    </h5>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 font-bold">
                      <StarTokenIcon size={12} />
                      <span>{p.budget}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de Inicio */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={handleStartAuction}
            disabled={room.participantes.length < 2}
            className={`w-full sm:w-auto px-10 py-4.5 rounded-2xl font-black text-sm uppercase tracking-wider font-display transition-all shadow-lg ${
              room.participantes.length >= 2
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 shadow-amber-400/25 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            🚀 INICIAR SUBASTA ({room.participantes.length} MANAGERS)
          </button>

          <button
            onClick={onExitRoom}
            className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold text-xs rounded-2xl uppercase font-display"
          >
            CANCELAR SALA
          </button>
        </div>
      </div>
    );
  }

  // RENDER 3: PANTALLA PRINCIPAL DE SUBASTA EN VIVO (HOST / PANTALLA GRANDE)
  const round = room.ronda_actual;
  if (!round) return null;

  const activeBidders = room.participantes.filter(
    (b) => b.squad.length < room.config.targetSquadSize
  );
  const currentTurnBuyer = activeBidders[round.currentTurnBuyerIndex];
  const highestBidder = room.participantes.find((p) => p.id === round.highestBidderId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 select-none">
      {/* Barra de Estado Superior del Host */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black font-display text-xs uppercase">
            RONDA {round.roundNumber}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            SALA: <strong className="text-amber-400">{room.codigo}</strong>
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            OBJETIVO: <strong className="text-yellow-400">11 Fichajes por Manager</strong>
          </span>
        </div>

        {/* Indicador de Turno Actual */}
        <div className="flex items-center gap-2 font-display text-sm font-black">
          {!round.isClosed ? (
            currentTurnBuyer ? (
              <span className="flex items-center gap-2 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                TURNO DE: <span className="text-white uppercase">{currentTurnBuyer.name}</span>
              </span>
            ) : null
          ) : (
            <span className="text-emerald-400 font-mono">
              {round.isDesierta ? '❌ RONDA FINALIZADA (DESIERTA)' : '🎉 RONDA CONCLUIDA'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Silueta en el Estrado */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <SilhouetteCard
            imageDataUrl={round.version.imageDataUrl}
            tier={round.version.tier}
            playerName={round.player.name}
            versionTag={round.version.versionTag}
            value={round.version.value}
            isRevealed={round.isRevealed}
            paidPrice={round.highestBid > 0 ? round.highestBid : undefined}
            winnerName={highestBidder?.name}
            cardBgUrl={round.version.cardBgUrl}
            grl={round.version.grl}
            posicion={round.version.posicion}
            evento={round.version.evento}
          />

          {/* Botón Siguiente Ronda (visible para el Host cuando se revela la carta) */}
          {round.isClosed && (
            <button
              onClick={() => startNewRound(round.roundNumber + 1, usedPlayerIds, room.participantes)}
              className="mt-6 px-10 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl transition-all uppercase tracking-wider font-display shadow-lg shadow-amber-400/25 cursor-pointer"
            >
              SIGUIENTE RONDA →
            </button>
          )}
        </div>

        {/* Columna Derecha: Tablero de Pujas en Vivo & Managers */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tarjeta de Mejor Puja Actual */}
          <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-5 text-white shadow-xl space-y-3 text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              MEJOR OFERTA EN LA SALA
            </span>
            <div className="flex items-center justify-center gap-2 text-4xl font-black text-yellow-300 font-display">
              <StarTokenIcon size={32} />
              <span>{round.highestBid}</span>
            </div>
            <p className="text-xs text-slate-300">
              {highestBidder ? (
                <>Líder: <strong className="text-amber-400 font-sans">{highestBidder.name}</strong></>
              ) : (
                'Sin ofertas aún en esta ronda'
              )}
            </p>
          </div>

          {/* Lista de Managers y su progreso hacia los 11 Fichajes */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between">
              <span>MANAGERS EN LA SALA</span>
              <span className="text-[10px] text-slate-400">Plantel / 11</span>
            </h4>

            <div className="space-y-2">
              {room.participantes.map((p) => {
                const isTurn = currentTurnBuyer?.id === p.id && !round.isClosed;
                const isLeader = highestBidder?.id === p.id;
                const isComplete = p.squad.length >= room.config.targetSquadSize;

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                      isTurn
                        ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                        : isLeader
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-black text-slate-900 uppercase truncate">
                          {p.name}
                        </span>
                        {isLeader && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black uppercase font-display">
                            LÍDER
                          </span>
                        )}
                        {isComplete && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-yellow-300 font-black uppercase font-display">
                            COMPLETO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-amber-600 font-bold mt-0.5">
                        <StarTokenIcon size={12} />
                        <span>{p.budget} Fichas</span>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0 pl-2">
                      <span className={`font-black text-xs ${isComplete ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {p.squad.length}/11
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historial en Vivo */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">
              Registro en Vivo
            </span>
            {room.historial.slice(0, 5).map((line, idx) => (
              <p key={idx} className="truncate text-slate-400">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
