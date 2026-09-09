import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RoomState,
  RoomParticipant,
  subscribeToRoom,
  startOnlineAuction,
  placeBidInRoom,
  passTurnInRoom,
  buyClueInRoom,
  advanceNextRoundInRoom,
  skipTurnByHost,
  kickParticipantFromRoom,
} from '../services/realtimeRoom';
import { Player } from '../types';
import { SilhouetteCard } from './SilhouetteCard';
import { SquadPitchView } from './SquadPitchView';
import { GameOverScreen } from './GameOverScreen';
import { StarTokenIcon } from './StarTokenIcon';
import { DECK_LABELS } from '../utils/tierColors';

interface OnlineRoomScreenProps {
  initialRoom: RoomState;
  participant: RoomParticipant;
  allPlayers: Player[];
  onExit: () => void;
}

export const OnlineRoomScreen: React.FC<OnlineRoomScreenProps> = ({
  initialRoom,
  participant,
  allPlayers,
  onExit,
}) => {
  const [room, setRoom] = useState<RoomState>(initialRoom);
  const [activeTab, setActiveTab] = useState<'auction' | 'pitch' | 'rivals' | 'history'>('auction');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);
  const autoAdvanceIntervalRef = useRef<any>(null);

  // Mantener al participante actualizado con la versión más reciente de la sala
  const currentParticipant = useMemo(() => {
    return room.participantes.find((p) => p.id === participant.id) || participant;
  }, [room.participantes, participant]);

  const isHost = Boolean(currentParticipant.isHost);

  // 1. Suscripción en tiempo real a Supabase (WebSockets + Postgres Changes)
  useEffect(() => {
    const unsubscribe = subscribeToRoom(room.codigo, (updatedRoom) => {
      setRoom(updatedRoom);
    });
    return () => unsubscribe();
  }, [room.codigo]);

  // Detectar si este participante fue expulsado de la sala por el Host
  useEffect(() => {
    if (room && room.participantes && room.participantes.length > 0) {
      const stillInRoom = room.participantes.some((p) => p.id === participant.id);
      if (!stillInRoom) {
        alert('Has sido retirado de la sala por el anfitrión.');
        onExit();
      }
    }
  }, [room?.participantes, participant.id, onExit]);

  // Vibración háptica en teléfonos móviles
  const triggerHaptic = (ms = 30) => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };

  // 2. Lógica de cuenta regresiva automática para avanzar de ronda cuando se revela una carta
  useEffect(() => {
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }

    if (room.estado === 'subastando' && room.ronda_actual?.isClosed && isHost) {
      setAutoAdvanceTimer(5);
      autoAdvanceIntervalRef.current = setInterval(() => {
        setAutoAdvanceTimer((prev) => {
          if (prev === null) return null; // Cancelado manualmente: no avanzar
          if (prev <= 1) {
            if (autoAdvanceIntervalRef.current) {
              clearInterval(autoAdvanceIntervalRef.current);
              autoAdvanceIntervalRef.current = null;
            }
            // Avanzar automáticamente
            advanceNextRoundInRoom(room, allPlayers).catch(console.error);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoAdvanceTimer(null);
    }

    return () => {
      if (autoAdvanceIntervalRef.current) {
        clearInterval(autoAdvanceIntervalRef.current);
        autoAdvanceIntervalRef.current = null;
      }
    };
  }, [room.ronda_actual?.isClosed, room.estado, isHost]);

  // Copiar link de invitación
  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}?sala=${room.codigo}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Compartir en WhatsApp
  const handleShareWhatsApp = () => {
    const origin = window.location.origin;
    const url = `${origin}?sala=${room.codigo}`;
    const text = `¡Únete a mi Subasta a Ciegas de Futbolistas FC Mobile! Entra con el código *${room.codigo}* aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Iniciar la subasta (Host)
  const handleStartAuction = async () => {
    if (room.participantes.length < 2) {
      alert('Se necesitan al menos 2 managers conectados para comenzar.');
      return;
    }
    setIsProcessing(true);
    try {
      await startOnlineAuction(room, allPlayers);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ofertar
  const handlePlaceBid = async (amount: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic(40);
    try {
      await placeBidInRoom(room, currentParticipant.id, amount);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pasar turno
  const handlePass = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic(20);
    try {
      await passTurnInRoom(room, currentParticipant.id);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Comprar pista
  const handleBuyClue = async (clueType: 'posicion' | 'continente' | 'decada') => {
    if (isProcessing) return;
    const clueCost = Math.max(10, Math.round(room.config.initialBudget * 0.05));
    if (currentParticipant.budget < clueCost) {
      alert(`Presupuesto insuficiente (${currentParticipant.budget} Fichas) para pedir la pista (${clueCost} Fichas).`);
      return;
    }
    setIsProcessing(true);
    triggerHaptic(30);
    try {
      await buyClueInRoom(room, currentParticipant.id, clueType);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Avanzar a la siguiente ronda manualmente (Host)
  const handleNextRoundManual = async () => {
    if (isProcessing) return;
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }
    setAutoAdvanceTimer(null);
    setIsProcessing(true);
    try {
      await advanceNextRoundInRoom(room, allPlayers);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Saltar turno de un participante (Host Override)
  const handleSkipTurnHost = async (participantId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerHaptic(30);
    try {
      await skipTurnByHost(room.codigo, participantId);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Expulsar a un participante de la sala (Host Override)
  const handleKickParticipant = async (participantId: string, participantName: string) => {
    if (!isHost || isProcessing) return;
    if (!window.confirm(`¿Seguro que deseas expulsar a "${participantName}" de la sala?`)) {
      return;
    }
    setIsProcessing(true);
    triggerHaptic(40);
    try {
      await kickParticipantFromRoom(room.codigo, participantId);
    } catch (e: any) {
      alert('Error al expulsar participante: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // RENDER 1: PANTALLA FINAL (TODOS TERMINARON)
  // ==========================================
  if (room.estado === 'finalizado') {
    return (
      <GameOverScreen
        buyers={room.participantes}
        endReason="¡Subasta Online finalizada con éxito! Todos los managers completaron sus planteles."
        onPlayAgain={onExit}
        onGoToManagement={onExit}
      />
    );
  }

  // ==========================================
  // RENDER 2: LOBBY DE ESPERA (CÓDIGO Y AMIGOS)
  // ==========================================
  if (room.estado === 'esperando') {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `${window.location.origin}?sala=${room.codigo}`
    )}`;

    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6 select-none">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-500 text-xs font-black tracking-wider uppercase font-display">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>SALA MULTIJUGADOR EN VIVO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase font-display">
            Lobby de Subasta
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Comparte el código o enlace con tus amigos para jugar todos en sus propios teléfonos.
          </p>
        </div>

        {/* Tarjeta de Código de Sala & Enlace */}
        <div className="bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl text-white space-y-5 text-center relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              CÓDIGO DE LA SALA
            </span>
            <div className="text-5xl sm:text-7xl font-black tracking-widest text-amber-400 font-display drop-shadow-[0_4px_12px_rgba(251,191,36,0.3)]">
              {room.codigo}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <span>{copiedLink ? '✓ ¡COPIADO!' : '📋 COPIAR ENLACE'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <span>📲 WHATSAPP</span>
            </button>
          </div>

          {/* Código QR para escanear directamente con el móvil */}
          <div className="flex flex-col items-center justify-center pt-2 pb-1">
            <div className="bg-white p-2.5 rounded-2xl shadow-md inline-block">
              <img
                src={qrUrl}
                alt={`QR Sala ${room.codigo}`}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-2">
              Escanea con la cámara de tu celular para unirte
            </span>
          </div>

          {/* Información del Torneo */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
            <div>
              <span className="block text-[9px] uppercase">Presupuesto</span>
              <strong className="text-yellow-400">{room.config.initialBudget} Fichas</strong>
            </div>
            <div>
              <span className="block text-[9px] uppercase">Mazo</span>
              <strong className="text-slate-200">{DECK_LABELS[room.config.selectedDeck]}</strong>
            </div>
            <div>
              <span className="block text-[9px] uppercase">Formación</span>
              <strong className="text-amber-400">11 Fichajes</strong>
            </div>
          </div>
        </div>

        {/* Lista de Participantes Conectados */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>MANAGERS EN LA SALA</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-black">
                {room.participantes.length}/8
              </span>
            </h3>
            <span className="text-xs text-slate-500">Mínimo 2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {room.participantes.map((p) => {
              const isMe = p.id === currentParticipant.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-amber-50/90 border-amber-300 text-slate-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-yellow-400 font-display font-black text-xs flex items-center justify-center">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black uppercase font-display truncate max-w-[120px]">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black uppercase">
                            HOST
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-600 text-white font-black uppercase">
                            TÚ
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Conectado
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHost && !p.isHost && (
                      <button
                        onClick={() => handleKickParticipant(p.id, p.name)}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        title={`Expulsar a ${p.name} de la sala`}
                      >
                        <span>✕</span>
                        <span>Expulsar</span>
                      </button>
                    )}
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Acciones del Lobby */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {isHost ? (
              <button
                onClick={handleStartAuction}
                disabled={room.participantes.length < 2 || isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-98 disabled:opacity-40 text-slate-950 font-black text-sm uppercase tracking-wider font-display shadow-lg shadow-amber-400/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 ¡COMENZAR SUBASTA ONLINE! ➔</span>
              </button>
            ) : (
              <div className="text-center py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-medium">
                Esperando a que el anfitrión ({room.participantes.find((p) => p.isHost)?.name || 'Host'}) comience la partida...
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-rose-600 font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Salir de la sala
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // RENDER 3: SUBASTA EN VIVO EN CADA DISPOSITIVO (CELULAR)
  // =======================================================
  const round = room.ronda_actual;
  if (!round) return null;

  const activeBidders = room.participantes.filter(
    (b) => b.squad.length < room.config.targetSquadSize
  );

  const safeTurnIndex =
    activeBidders.length > 0 ? round.currentTurnBuyerIndex % activeBidders.length : 0;
  const currentTurnBuyer = activeBidders[safeTurnIndex];
  const isMyTurn = currentTurnBuyer?.id === currentParticipant.id && !round.isClosed;
  const isLeader = round.highestBidderId === currentParticipant.id;
  const highestBidder = room.participantes.find((p) => p.id === round.highestBidderId);
  const isSquadFull = currentParticipant.squad.length >= room.config.targetSquadSize;

  const clueCost = Math.max(10, Math.round(room.config.initialBudget * 0.05));
  const minRequiredBid =
    round.highestBidderId === null
      ? room.config.minIncrement
      : round.highestBid + room.config.minIncrement;

  return (
    <div className="max-w-xl mx-auto px-3 py-3 space-y-3 select-none flex flex-col min-h-[92vh] justify-between">
      {/* 1. Header Fijo con Saldo en Fichas Estelares y Progreso */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs font-display flex items-center justify-center shadow-xs">
            {currentParticipant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-display font-black text-xs text-white uppercase truncate max-w-[120px]">
                {currentParticipant.name}
              </h4>
              {isHost && (
                <span className="text-[8px] px-1 rounded bg-amber-400 text-slate-950 font-bold uppercase">
                  HOST
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Ronda {round.roundNumber} • Sala {room.codigo}
            </span>
          </div>
        </div>

        {/* Billetera de Fichas Estelares & Progreso de Fichajes */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-right">
            <span className="text-[9px] text-slate-400 uppercase block font-sans">
              Plantel
            </span>
            <span className={`font-black ${isSquadFull ? 'text-emerald-400' : 'text-slate-200'}`}>
              {currentParticipant.squad.length}/11
            </span>
          </div>
          <div className="bg-slate-800/90 border border-amber-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1 text-yellow-300 font-black">
            <StarTokenIcon size={14} />
            <span>{currentParticipant.budget}</span>
          </div>
        </div>
      </div>

      {/* 2. Pestañas de Navegación Móvil (Subasta | Mi Once | Rivales | Historial) */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/90 rounded-2xl text-[11px] font-display font-black text-center">
        <button
          onClick={() => setActiveTab('auction')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'auction'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🔨 SUBASTA
        </button>
        <button
          onClick={() => setActiveTab('pitch')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'pitch'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⚽ MI ONCE
        </button>
        <button
          onClick={() => setActiveTab('rivals')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'rivals'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👥 RIVALES
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📜 REGISTRO
        </button>
      </div>

      {/* 3. CONTENIDO DE LA PESTAÑA ACTIVA */}
      {activeTab === 'pitch' && (
        <div className="flex-1 space-y-3">
          <SquadPitchView manager={currentParticipant} />
        </div>
      )}

      {activeTab === 'rivals' && (
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-xs">
          <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>ESTADO DE LOS RIVALES</span>
            <span className="font-mono text-slate-500 text-[10px]">11 Fichajes Necesarios</span>
          </h3>
          <div className="space-y-2">
            {room.participantes.map((p) => {
              const full = p.squad.length >= room.config.targetSquadSize;
              const isMe = p.id === currentParticipant.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    isMe ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-black text-slate-900 uppercase">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[8px] px-1 bg-emerald-600 text-white font-bold rounded">
                          TÚ
                        </span>
                      )}
                      {full && (
                        <span className="text-[8px] px-1 bg-slate-900 text-yellow-300 font-bold rounded">
                          COMPLETO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-amber-600 font-bold mt-0.5">
                      <StarTokenIcon size={12} />
                      <span>{p.budget} Fichas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-black text-sm ${full ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {p.squad.length}/11
                    </span>
                    {isHost && !p.isHost && (
                      <button
                        onClick={() => handleKickParticipant(p.id, p.name)}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                        title={`Expulsar a ${p.name}`}
                      >
                        ✕ Expulsar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl p-4 text-xs font-mono text-slate-300 space-y-2 max-h-96 overflow-y-auto">
          <span className="text-[10px] text-slate-500 uppercase block font-bold border-b border-slate-800 pb-1">
            Registro en Vivo de Subasta
          </span>
          {room.historial.map((line, idx) => (
            <p key={idx} className="text-slate-300 leading-snug">
              {line}
            </p>
          ))}
        </div>
      )}

      {activeTab === 'auction' && (
        <div className="flex-1 space-y-3 flex flex-col justify-between">
          {/* A. CARTA CISTERIOSA EN EL CENTRO DEL DISPOSITIVO */}
          <div className="flex flex-col items-center">
            <SilhouetteCard
              key={`round-${round.roundNumber}-${round.version.id}`}
              imageDataUrl={round.version.imageDataUrl}
              cardBgUrl={round.version.cardBgUrl}
              flagUrl={round.version.flagUrl}
              clubUrl={round.version.clubUrl}
              grl={round.version.grl}
              posicion={round.version.posicion}
              evento={round.version.evento}
              tier={round.version.tier}
              playstyles={round.version.playstyles}
              playerName={round.player.name}
              versionTag={round.version.versionTag}
              value={round.version.value}
              isRevealed={round.isRevealed}
              paidPrice={round.isClosed && !round.isDesierta ? round.highestBid : undefined}
              winnerName={highestBidder?.name}
              className="w-full max-w-[340px] sm:max-w-sm mx-auto"
            />

            {/* Pista Pública Comprada */}
            {round.purchasedClue && (
              <div className="w-full max-w-[340px] sm:max-w-sm mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-2xl text-center shadow-xs">
                <span className="text-[10px] font-black text-amber-900 uppercase font-display block">
                  💡 PISTA DESBLOQUEADA POR {round.purchasedClue.buyerName}:
                </span>
                <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">
                  {round.purchasedClue.label}
                </span>
              </div>
            )}
          </div>

          {/* B. ESTADO DE PUJA Y OFERTA LÍDER */}
          <div
            className={`rounded-2xl p-3 border text-center transition-all shadow-xs ${
              round.isClosed
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : isMyTurn
                ? 'bg-amber-50 border-amber-400 text-slate-900 ring-2 ring-amber-400/40 animate-pulse'
                : isLeader
                ? 'bg-emerald-50 border-emerald-400 text-slate-900'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-display font-black uppercase">
              <span>
                {round.isClosed
                  ? '🏁 RONDA FINALIZADA'
                  : isMyTurn
                  ? '⚡ ¡ES TU TURNO DE PUJAR!'
                  : isLeader
                  ? '👑 ¡TIENES LA MEJOR OFERTA!'
                  : `TURNO DE: ${
                      currentTurnBuyer?.name ||
                      (activeBidders.find((b) => b.id !== currentParticipant.id)?.name ?? 'OTRO DT')
                    }`}
              </span>

              <div className="flex items-center gap-1 text-sm font-mono text-amber-600 font-black">
                <StarTokenIcon size={14} />
                <span>{round.highestBid}</span>
              </div>
            </div>

            {highestBidder && !round.isClosed && (
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Mejor postor: <strong className="text-slate-900">{highestBidder.name}</strong>
              </p>
            )}
          </div>

          {/* C. BOTONERA DE ACCIÓN MÓVIL */}
          {round.isClosed ? (
            /* SI LA RONDA TERMINÓ: BOTÓN SIGUIENTE JUGADOR */
            <div className="space-y-2">
              {isHost ? (
                <button
                  onClick={handleNextRoundManual}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-98 text-slate-950 font-black text-sm uppercase tracking-wider font-display shadow-lg shadow-amber-400/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    SIGUIENTE FUTBOLISTA {autoAdvanceTimer !== null ? `(${autoAdvanceTimer}s)` : '➔'}
                  </span>
                </button>
              ) : (
                <div className="text-center py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-medium">
                  {autoAdvanceTimer !== null
                    ? `Siguiente carta en ${autoAdvanceTimer}s...`
                    : 'Esperando a que el anfitrión pase al siguiente futbolista...'}
                </div>
              )}
            </div>
          ) : isSquadFull ? (
            /* SI EL JUGADOR YA TIENE 11 FICHAJES */
            <div className="text-center py-3.5 px-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold">
              🏆 ¡Completaste tu Once Titular (11/11)! Espera a que los demás managers terminen de fichar.
            </div>
          ) : isMyTurn ? (
            /* SI ES MI TURNO DE PUJAR */
            <div className="space-y-2.5 animate-fade-in">
              {/* Si el manager no tiene saldo para la puja mínima normal pero nadie ha ofertado aún */}
              {currentParticipant.budget < minRequiredBid && round.highestBid === 0 ? (
                <div className="space-y-2">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-black text-amber-500 uppercase tracking-wide">
                      ⚠️ Presupuesto insuficiente ({currentParticipant.budget} Fichas)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Puedes solicitar este futbolista a coste cero como Fichaje de Cantera / Agente Libre. Si ningún otro manager oferta fichas por él, te lo llevarás gratis.
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlaceBid(0)}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 active:scale-98 text-white font-black text-xs uppercase tracking-wider font-display shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🚨 SOLICITAR RESCATE DE CANTERA (0 FICHAS)</span>
                  </button>
                </div>
              ) : (
                /* Botones de incremento táctil regulares */
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePlaceBid(minRequiredBid)}
                    disabled={minRequiredBid > currentParticipant.budget || isProcessing}
                    className="py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs uppercase font-display shadow-md flex flex-col items-center justify-center gap-0.5 disabled:opacity-30 cursor-pointer"
                  >
                    <span className="text-[9px] opacity-80">MÍNIMA</span>
                    <div className="flex items-center gap-1">
                      <StarTokenIcon size={12} />
                      <span>{minRequiredBid}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePlaceBid(minRequiredBid + 5)}
                    disabled={minRequiredBid + 5 > currentParticipant.budget || isProcessing}
                    className="py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-yellow-300 font-black text-xs uppercase font-display shadow-md flex flex-col items-center justify-center gap-0.5 disabled:opacity-30 cursor-pointer"
                  >
                    <span className="text-[9px] text-slate-400">+5 FICHAS</span>
                    <div className="flex items-center gap-1">
                      <StarTokenIcon size={12} />
                      <span>{minRequiredBid + 5}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePlaceBid(minRequiredBid + 15)}
                    disabled={minRequiredBid + 15 > currentParticipant.budget || isProcessing}
                    className="py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-yellow-300 font-black text-xs uppercase font-display shadow-md flex flex-col items-center justify-center gap-0.5 disabled:opacity-30 cursor-pointer"
                  >
                    <span className="text-[9px] text-slate-400">+15 FICHAS</span>
                    <div className="flex items-center gap-1">
                      <StarTokenIcon size={12} />
                      <span>{minRequiredBid + 15}</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Botón Pasar Turno */}
              <button
                onClick={handlePass}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-black text-xs uppercase tracking-wider font-display border border-slate-300 transition-all shadow-xs cursor-pointer"
              >
                ✋ PASAR TURNO
              </button>

              {/* Pistas */}
              {!round.purchasedClue && (
                <div className="pt-1.5 border-t border-slate-200 flex justify-between gap-2 text-[11px] font-mono">
                  <button
                    onClick={() => handleBuyClue('posicion')}
                    disabled={currentParticipant.budget < clueCost || isProcessing}
                    className="flex-1 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 cursor-pointer text-[10px]"
                  >
                    💡 Posición (-{clueCost})
                  </button>
                  <button
                    onClick={() => handleBuyClue('continente')}
                    disabled={currentParticipant.budget < clueCost || isProcessing}
                    className="flex-1 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 cursor-pointer text-[10px]"
                  >
                    🌍 País (-{clueCost})
                  </button>
                  <button
                    onClick={() => handleBuyClue('decada')}
                    disabled={currentParticipant.budget < clueCost || isProcessing}
                    className="flex-1 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 cursor-pointer text-[10px]"
                  >
                    ⏳ Época (-{clueCost})
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* SI NO ES MI TURNO */
            <div className="space-y-2.5">
              <div className="text-center py-4 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic">
                Turno de <strong className="text-slate-800">{currentTurnBuyer?.name || (activeBidders.find((b) => b.id !== currentParticipant.id)?.name ?? 'OTRO DT')}</strong>. Tus botones se activarán cuando te toque ofertar.
              </div>
              {/* Botón de anfitrión para saltar turno o expulsar si alguien se desconecta o tarda */}
              {isHost && currentTurnBuyer && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleSkipTurnHost(currentTurnBuyer.id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    title="Salta el turno del jugador actual si está inactivo o desconectado"
                  >
                    <span>⏭️ Saltar Turno de {currentTurnBuyer.name}</span>
                  </button>
                  {!currentTurnBuyer.isHost && (
                    <button
                      onClick={() => handleKickParticipant(currentTurnBuyer.id, currentTurnBuyer.name)}
                      disabled={isProcessing}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-700 border border-rose-200 text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      title="Expulsar a este manager de la sala"
                    >
                      <span>✕ Expulsar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
