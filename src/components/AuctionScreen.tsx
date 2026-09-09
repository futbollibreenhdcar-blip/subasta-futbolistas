import React, { useState, useEffect } from 'react';
import {
  AuctionGameConfig,
  Buyer,
  BoughtPlayer,
  Player,
  PlayerVersion,
} from '../types';
import { SilhouetteCard } from './SilhouetteCard';
import { DECK_LABELS } from '../utils/tierColors';

interface AuctionScreenProps {
  config: AuctionGameConfig;
  allPlayers: Player[];
  onGameOver: (finalBuyers: Buyer[], endReason: string) => void;
  onAbortGame: () => void;
}

interface ActiveRoundState {
  roundNumber: number;
  player: Player;
  version: PlayerVersion;
  highestBid: number;
  highestBidderId: string | null;
  currentTurnBuyerIndex: number;
  consecutivePasses: number;
  isClosed: boolean;
  isDesierta: boolean;
  isRevealed: boolean;
  purchasedClue?: {
    type: 'posicion' | 'decada' | 'continente';
    label: string;
    buyerName: string;
  } | null;
}

// Precarga asíncrona de imagen para evitar parpadeos
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
}

export const AuctionScreen: React.FC<AuctionScreenProps> = ({
  config,
  allPlayers,
  onGameOver,
  onAbortGame,
}) => {
  // Compradores en memoria
  const [buyers, setBuyers] = useState<Buyer[]>(() =>
    config.buyers.map((b) => ({
      id: b.id,
      name: b.name,
      budget: config.initialBudget,
      initialBudget: config.initialBudget,
      squad: [],
    }))
  );

  const [usedPlayerIds, setUsedPlayerIds] = useState<string[]>([]);
  const [roundState, setRoundState] = useState<ActiveRoundState | null>(null);
  const [stepperBid, setStepperBid] = useState<number>(config.minIncrement);
  const [roundHistory, setRoundHistory] = useState<string[]>([]);

  // Costo fijo de la pista (5% del presupuesto inicial)
  const clueCost = Math.max(10, Math.round(config.initialBudget * 0.05));

  // Filtrar jugadores disponibles del mazo que aún no han sido sorteados
  const getEligiblePlayers = (usedIds: string[]) => {
    return allPlayers.filter((p) => {
      if (usedIds.includes(p.id)) return false;
      if (config.selectedDeck === 'mixto') return p.versions.length > 0;
      return p.versions.some((v) => v.decks.includes(config.selectedDeck));
    });
  };

  const getActiveBidders = (currentBuyers: Buyer[]) => {
    return currentBuyers.filter((b) => b.squad.length < config.targetSquadSize);
  };

  const startNewRound = async (
    roundNum: number,
    currentUsedIds: string[],
    currentBuyersState: Buyer[]
  ) => {
    const activeBidders = getActiveBidders(currentBuyersState);

    if (activeBidders.length === 0) {
      onGameOver(currentBuyersState, '¡Todos los managers han completado sus planteles objetivo!');
      return;
    }

    const eligible = getEligiblePlayers(currentUsedIds);
    if (eligible.length === 0) {
      onGameOver(currentBuyersState, `¡El mazo "${DECK_LABELS[config.selectedDeck]}" se ha agotado!`);
      return;
    }

    const randomPlayerIndex = Math.floor(Math.random() * eligible.length);
    const chosenPlayer = eligible[randomPlayerIndex];

    const matchingVersions =
      config.selectedDeck === 'mixto'
        ? chosenPlayer.versions
        : chosenPlayer.versions.filter((v) => v.decks.includes(config.selectedDeck));

    const randomVersionIndex = Math.floor(Math.random() * matchingVersions.length);
    const chosenVersion = matchingVersions[randomVersionIndex];

    await preloadImage(chosenVersion.imageDataUrl);

    const firstEligibleIdx = currentBuyersState.findIndex(
      (b) => b.squad.length < config.targetSquadSize
    );

    const initialMinBid = config.minIncrement;
    setStepperBid(initialMinBid);
    setUsedPlayerIds([...currentUsedIds, chosenPlayer.id]);
    setRoundHistory([`Ronda ${roundNum} iniciada. Silueta en el estrado.`]);

    setRoundState({
      roundNumber: roundNum,
      player: chosenPlayer,
      version: chosenVersion,
      highestBid: 0,
      highestBidderId: null,
      currentTurnBuyerIndex: firstEligibleIdx >= 0 ? firstEligibleIdx : 0,
      consecutivePasses: 0,
      isClosed: false,
      isDesierta: false,
      isRevealed: false,
      purchasedClue: null,
    });
  };

  useEffect(() => {
    startNewRound(1, [], buyers);
  }, []);

  if (!roundState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando subasta...</p>
        </div>
      </div>
    );
  }

  const activeBidders = getActiveBidders(buyers);
  const activeBuyer = buyers[roundState.currentTurnBuyerIndex];
  const minRequiredBid =
    roundState.highestBid === 0 ? config.minIncrement : roundState.highestBid + config.minIncrement;

  const getNextBuyerIndex = (fromIndex: number): number => {
    let nextIdx = (fromIndex + 1) % buyers.length;
    let attempts = 0;
    while (buyers[nextIdx].squad.length >= config.targetSquadSize && attempts < buyers.length) {
      nextIdx = (nextIdx + 1) % buyers.length;
      attempts++;
    }
    return nextIdx;
  };

  const handleStepperChange = (delta: number) => {
    if (!activeBuyer) return;
    const newBid = stepperBid + delta;
    if (newBid < minRequiredBid) return;
    if (newBid > activeBuyer.budget) return;
    setStepperBid(newBid);
  };

  const handleConfirmBid = () => {
    if (roundState.isClosed || !activeBuyer) return;

    if (stepperBid > activeBuyer.budget) {
      alert(`Presupuesto insuficiente ($${activeBuyer.budget}) para pujar $${stepperBid}.`);
      return;
    }
    if (stepperBid < minRequiredBid) {
      alert(`La puja mínima requerida es de $${minRequiredBid}.`);
      return;
    }

    const prevBid = roundState.highestBid;
    const nextMinForNextTurn = stepperBid + config.minIncrement;

    setRoundHistory((prev) => [
      `💰 ${activeBuyer.name} subió a $${stepperBid} (+${stepperBid - prevBid})`,
      ...prev.slice(0, 8),
    ]);

    if (activeBidders.length <= 1) {
      closeAuction(activeBuyer.id, stepperBid);
      return;
    }

    const nextIdx = getNextBuyerIndex(roundState.currentTurnBuyerIndex);
    setStepperBid(nextMinForNextTurn);

    setRoundState((prev) =>
      prev
        ? {
            ...prev,
            highestBid: stepperBid,
            highestBidderId: activeBuyer.id,
            consecutivePasses: 0,
            currentTurnBuyerIndex: nextIdx,
          }
        : null
    );
  };

  const handlePass = () => {
    if (roundState.isClosed || !activeBuyer) return;

    const newPasses = roundState.consecutivePasses + 1;
    setRoundHistory((prev) => [
      `✋ ${activeBuyer.name} pasó turno.`,
      ...prev.slice(0, 8),
    ]);

    if (roundState.highestBidderId === null) {
      if (newPasses >= activeBidders.length) {
        setRoundHistory((prev) => [
          '❌ Ronda desierta. Ningún manager ofertó. Silueta descartada.',
          ...prev,
        ]);
        setRoundState((prev) =>
          prev
            ? {
                ...prev,
                isDesierta: true,
                isClosed: true,
                isRevealed: true,
                consecutivePasses: newPasses,
              }
            : null
        );
        return;
      }
    } else {
      if (newPasses >= activeBidders.length - 1) {
        closeAuction(roundState.highestBidderId, roundState.highestBid);
        return;
      }
    }

    const nextIdx = getNextBuyerIndex(roundState.currentTurnBuyerIndex);
    setRoundState((prev) =>
      prev
        ? {
            ...prev,
            consecutivePasses: newPasses,
            currentTurnBuyerIndex: nextIdx,
          }
        : null
    );
  };

  const handleBuyClue = () => {
    if (roundState.isClosed || !activeBuyer) return;
    if (roundState.purchasedClue) {
      alert('Ya se pidió una pista en esta ronda.');
      return;
    }
    if (activeBuyer.budget < clueCost) {
      alert(`Presupuesto insuficiente ($${activeBuyer.budget}) para pedir la pista ($${clueCost}).`);
      return;
    }

    const updatedBuyers = buyers.map((b) =>
      b.id === activeBuyer.id ? { ...b, budget: b.budget - clueCost } : b
    );
    setBuyers(updatedBuyers);

    const options: Array<{ type: 'posicion' | 'decada' | 'continente'; label: string }> = [];
    if (roundState.version.posicionPista) {
      options.push({ type: 'posicion', label: `Posición: ${roundState.version.posicionPista}` });
    }
    if (roundState.version.decadaPista) {
      options.push({ type: 'decada', label: `Época: ${roundState.version.decadaPista}` });
    }
    if (roundState.version.continentePista) {
      options.push({ type: 'continente', label: `Procedencia: ${roundState.version.continentePista}` });
    }

    const chosen = options.length > 0
      ? options[Math.floor(Math.random() * options.length)]
      : { type: 'posicion' as const, label: `Posición: ${roundState.version.posicionPista || 'Jugador de Campo'}` };

    const clueData = {
      type: chosen.type,
      label: chosen.label,
      buyerName: activeBuyer.name,
    };

    setRoundHistory((prev) => [
      `💡 [PISTA PÚBLICA] ${activeBuyer.name} pagó $${clueCost}: ${chosen.label}`,
      ...prev,
    ]);

    setRoundState((prev) =>
      prev
        ? {
            ...prev,
            purchasedClue: clueData,
          }
        : null
    );
  };

  const closeAuction = (winnerId: string, finalPrice: number) => {
    const winner = buyers.find((b) => b.id === winnerId);
    if (!winner || !roundState) return;

    const boughtItem: BoughtPlayer = {
      playerId: roundState.player.id,
      playerName: roundState.player.name,
      version: roundState.version,
      paidPrice: finalPrice,
      roundNumber: roundState.roundNumber,
    };

    const updatedBuyers = buyers.map((b) =>
      b.id === winnerId
        ? {
            ...b,
            budget: b.budget - finalPrice,
            squad: [...b.squad, boughtItem],
          }
        : b
    );

    setBuyers(updatedBuyers);
    setRoundHistory((prev) => [
      `🏆 ¡ADJUDICADO! ${winner.name} gana la puja por $${finalPrice}.`,
      ...prev,
    ]);

    setRoundState((prev) =>
      prev
        ? {
            ...prev,
            isClosed: true,
            isRevealed: true,
          }
        : null
    );
  };

  const handleNextRoundOrFinish = () => {
    const updatedActiveBidders = getActiveBidders(buyers);
    if (updatedActiveBidders.length === 0) {
      onGameOver(buyers, '¡Todos los managers han completado sus planteles objetivo!');
      return;
    }

    const eligibleRemaining = getEligiblePlayers(usedPlayerIds);
    if (eligibleRemaining.length === 0) {
      onGameOver(buyers, `¡El mazo "${DECK_LABELS[config.selectedDeck]}" se ha agotado!`);
      return;
    }

    startNewRound(roundState.roundNumber + 1, usedPlayerIds, buyers);
  };

  const highestBidder = buyers.find((b) => b.id === roundState.highestBidderId);
  const remainingInDeck = getEligiblePlayers(usedPlayerIds).length;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-52">
      {/* 1. Marcador Superior Broadcast */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-xs tracking-wider font-display shadow-xs">
            RONDA {roundState.roundNumber}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
            <span className="text-amber-500">🏟️</span>
            <span className="truncate">{DECK_LABELS[config.selectedDeck]}</span>
            <span className="text-slate-500 font-mono text-[11px]">({remainingInDeck} restantes)</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Deseas abandonar la subasta y regresar al menú?')) {
              onAbortGame();
            }
          }}
          className="text-xs text-slate-600 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl transition-all border border-slate-200 hover:border-rose-200 bg-slate-100/70"
        >
          SALIR
        </button>
      </div>

      {/* 2. Banquillo de Managers (HUD de Jugadores) */}
      <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {buyers.map((b, idx) => {
          const isTurn = !roundState.isClosed && idx === roundState.currentTurnBuyerIndex;
          const isHighest = b.id === roundState.highestBidderId;
          const isSquadFull = b.squad.length >= config.targetSquadSize;

          return (
            <div
              key={b.id}
              className={`shrink-0 px-3.5 py-2.5 rounded-2xl border transition-all flex flex-col justify-between min-w-[130px] relative ${
                isTurn
                  ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 text-slate-950 shadow-sm scale-[1.02]'
                  : isHighest
                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30'
                  : 'bg-white/90 border-slate-200 text-slate-800 shadow-xs'
              } ${isSquadFull ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isTurn
                        ? 'bg-amber-400 text-slate-950'
                        : isHighest
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-black truncate uppercase font-display">{b.name}</span>
                </div>

                {isHighest && <span className="text-xs" title="Líder actual">👑</span>}
                {isTurn && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />}
              </div>

              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="text-xs font-black text-amber-600 font-mono tracking-tight">${b.budget}</span>
                <span className="text-[10px] font-bold text-slate-500">
                  {b.squad.length}/{config.targetSquadSize} ⚽
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Panel de Pista Táctica Pública */}
      {roundState.purchasedClue && (
        <div className="w-full max-w-sm sm:max-w-md mx-auto p-3.5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-amber-900 shadow-md backdrop-blur-xs animate-fade-in">
          <div className="flex items-center justify-between text-[10px] text-amber-800 uppercase font-black tracking-wider pb-1.5 border-b border-amber-200">
            <span className="flex items-center gap-1">
              <span>💡</span>
              <span>PISTA TÁCTICA PÚBLICA</span>
            </span>
            <span className="text-amber-700 font-medium">POR {roundState.purchasedClue.buyerName}</span>
          </div>
          <div className="pt-2 text-sm font-black text-slate-900 flex items-center gap-2">
            <span>🔍</span>
            <span>{roundState.purchasedClue.label}</span>
          </div>
        </div>
      )}

      {/* 4. Área Central: Carta con Escenario Blanco Luminoso */}
      <div className="flex flex-col items-center">
        <SilhouetteCard
          key={`round-${roundState.roundNumber}-${roundState.version.id}`}
          imageDataUrl={roundState.version.imageDataUrl}
          tier={roundState.version.tier}
          playerName={roundState.player.name}
          versionTag={roundState.version.versionTag}
          value={roundState.version.value}
          isRevealed={roundState.isRevealed}
          paidPrice={roundState.isClosed && !roundState.isDesierta ? roundState.highestBid : undefined}
          winnerName={highestBidder ? highestBidder.name : undefined}
          className="w-full max-w-sm sm:max-w-md mx-auto"
        />

        {/* Mensaje de Ronda Desierta */}
        {roundState.isDesierta && (
          <div className="w-full max-w-sm sm:max-w-md mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-center shadow-xs">
            <p className="text-rose-900 font-black text-xs uppercase tracking-wider font-display">
              ❌ RONDA DESIERTA
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Todos los managers pasaron turno. La silueta quedó descartada sin costo.
            </p>
          </div>
        )}
      </div>

      {/* 5. Registro Broadcast en Vivo */}
      <div className="bg-white/90 backdrop-blur-xs border border-slate-200 rounded-2xl p-3.5 max-w-sm sm:max-w-md mx-auto shadow-xs">
        <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 pb-1.5 border-b border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>RADAR DE SUBASTA</span>
          </span>
          <span className="text-amber-600 font-mono font-bold">
            {highestBidder ? `LÍDER: ${highestBidder.name} ($${roundState.highestBid})` : 'EN ESPERA DE PUJAS'}
          </span>
        </div>
        <div className="space-y-1.5 max-h-24 overflow-y-auto text-xs font-mono">
          {roundHistory.slice(0, 3).map((msg, i) => (
            <div
              key={i}
              className={`px-2.5 py-1 rounded-lg ${
                i === 0 ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200' : 'text-slate-600'
              }`}
            >
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Barra Fija Inferior (Controles Táctiles y Ergonómicos de Cristal Blanco) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3.5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto space-y-2.5">
          {!roundState.isClosed ? (
            <>
              {/* Turno y Líder */}
              <div className="flex justify-between items-center px-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Turno de:</span>
                  <span className="font-black text-slate-900 uppercase font-display">{activeBuyer?.name}</span>
                  <span className="text-emerald-700 font-bold font-mono">(${activeBuyer?.budget})</span>
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Puja líder:{' '}
                  <strong className="text-amber-600 font-black">
                    {roundState.highestBid > 0 ? `$${roundState.highestBid}` : '$0'}
                  </strong>
                </div>
              </div>

              {/* Botón de Pista Táctica */}
              {!roundState.purchasedClue ? (
                <button
                  type="button"
                  onClick={handleBuyClue}
                  disabled={!activeBuyer || activeBuyer.budget < clueCost}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-[0.99] disabled:opacity-30 border border-amber-300 text-amber-900 text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>💡 PEDIR PISTA TÁCTICA (-${clueCost})</span>
                  <span className="text-[10px] text-amber-700 font-medium">(Pública)</span>
                </button>
              ) : (
                <div className="text-center text-[11px] text-slate-500 py-1 bg-slate-100 rounded-xl border border-slate-200">
                  Pista de esta ronda ya revelada para todos
                </div>
              )}

              {/* CHIPS RÁPIDOS DE PUJA (+5, +10, +25, +50) */}
              <div className="flex items-center justify-center gap-2">
                {[config.minIncrement, 10, 25, 50]
                  .filter((v, idx, arr) => arr.indexOf(v) === idx)
                  .map((delta) => {
                    const targetBid = stepperBid + delta;
                    const canAfford = activeBuyer && targetBid <= activeBuyer.budget;
                    return (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => handleStepperChange(delta)}
                        disabled={!canAfford}
                        className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 font-mono text-[11px] font-black border border-slate-200 transition-colors"
                      >
                        +{delta}
                      </button>
                    );
                  })}
              </div>

              {/* STEPPER TÁCTIL PRINCIPAL */}
              <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded-2xl p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleStepperChange(-config.minIncrement)}
                  disabled={stepperBid <= minRequiredBid}
                  className="w-13 h-12 rounded-xl bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-25 text-slate-900 font-black text-2xl flex items-center justify-center border border-slate-200 shadow-xs transition-all"
                >
                  −
                </button>

                <div className="text-center flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    OFERTA A PUJAR
                  </span>
                  <span className="text-2xl font-black text-amber-600 font-mono">
                    ${stepperBid}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStepperChange(config.minIncrement)}
                  disabled={Boolean(activeBuyer && stepperBid + config.minIncrement > activeBuyer.budget)}
                  className="w-13 h-12 rounded-xl bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-25 text-slate-900 font-black text-2xl flex items-center justify-center border border-slate-200 shadow-xs transition-all"
                >
                  +
                </button>
              </div>

              {/* ACCIONES PRINCIPALES (PASAR / PUJAR) */}
              <div className="flex gap-2.5">
                {/* Botón Pasar */}
                <button
                  type="button"
                  onClick={handlePass}
                  className="flex-1 h-13 py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-[0.98] border border-rose-200 text-rose-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs font-display"
                >
                  <span>PASAR</span>
                  <span className="text-[10px] text-rose-500 font-mono">({roundState.consecutivePasses}p)</span>
                </button>

                {/* Botón Subir Puja */}
                <button
                  type="button"
                  onClick={handleConfirmBid}
                  disabled={!activeBuyer || activeBuyer.budget < stepperBid}
                  className="flex-1 h-13 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all font-display"
                >
                  <span>OFERTAR ${stepperBid}</span>
                </button>
              </div>
            </>
          ) : (
            /* Botón Siguiente Ronda */
            <button
              type="button"
              onClick={handleNextRoundOrFinish}
              className="w-full h-14 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-base uppercase tracking-wider shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all font-display"
            >
              <span>SIGUIENTE RONDA →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
