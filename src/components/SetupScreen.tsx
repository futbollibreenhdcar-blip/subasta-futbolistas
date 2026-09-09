import React, { useState } from 'react';
import { AuctionGameConfig, DeckType, Player } from '../types';
import { DECK_LABELS } from '../utils/tierColors';

interface SetupScreenProps {
  players: Player[];
  onStartGame: (config: AuctionGameConfig) => void;
  onGoToManagement: () => void;
  onGoToImport?: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  players,
  onStartGame,
  onGoToManagement,
  onGoToImport,
}) => {
  const [buyers, setBuyers] = useState<Array<{ id: string; name: string }>>([
    { id: 'b1', name: 'Manager 1' },
    { id: 'b2', name: 'Manager 2' },
  ]);
  const [initialBudget, setInitialBudget] = useState<number>(500);
  const [targetSquadSize, setTargetSquadSize] = useState<number>(5);
  const [minIncrement, setMinIncrement] = useState<number>(5);
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('mixto');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availablePlayersInDeck = players.filter((player) => {
    if (selectedDeck === 'mixto') return player.versions.length > 0;
    return player.versions.some((v) => v.decks.includes(selectedDeck));
  });

  const totalRequiredForFullSquads = buyers.length * targetSquadSize;

  const handleAddBuyer = () => {
    if (buyers.length >= 8) return;
    const nextIndex = buyers.length + 1;
    setBuyers([
      ...buyers,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `b_${Date.now()}_${Math.random()}`,
        name: `Manager ${nextIndex}`,
      },
    ]);
  };

  const handleRemoveBuyer = (id: string) => {
    if (buyers.length <= 2) return;
    setBuyers(buyers.filter((b) => b.id !== id));
  };

  const handleBuyerNameChange = (id: string, newName: string) => {
    setBuyers(buyers.map((b) => (b.id === id ? { ...b, name: newName } : b)));
  };

  const handleStart = () => {
    setErrorMsg(null);

    const hasEmptyNames = buyers.some((b) => !b.name.trim());
    if (hasEmptyNames) {
      setErrorMsg('Todos los managers deben tener un nombre.');
      return;
    }

    if (buyers.length < 2 || buyers.length > 8) {
      setErrorMsg('La partida requiere entre 2 y 8 managers.');
      return;
    }

    if (initialBudget <= 0) {
      setErrorMsg('El presupuesto inicial debe ser mayor a 0.');
      return;
    }
    if (targetSquadSize <= 0) {
      setErrorMsg('El tamaño de plantel objetivo debe ser al menos 1.');
      return;
    }

    if (availablePlayersInDeck.length === 0) {
      setErrorMsg(
        `No hay futbolistas registrados en el mazo "${DECK_LABELS[selectedDeck]}".`
      );
      return;
    }

    onStartGame({
      buyers: buyers.map((b) => ({ ...b, name: b.name.trim() })),
      initialBudget,
      targetSquadSize,
      minIncrement,
      selectedDeck,
    });
  };

  const deckOptions: DeckType[] = [
    'leyendas',
    'estrellas_actuales',
    'arqueros',
    'retirados',
    'mixto',
  ];

  const deckDetails: Record<DeckType, { label: string; icon: string; desc: string }> = {
    leyendas: { label: 'Leyendas', icon: '🏆', desc: 'Mitos de la historia del fútbol' },
    estrellas_actuales: { label: 'Estrellas', icon: '⭐', desc: 'Cracks mundiales en activo' },
    arqueros: { label: 'Arqueros', icon: '🧤', desc: 'Especialistas bajo los tres palos' },
    retirados: { label: 'Retirados', icon: '📜', desc: 'Veteranos que dejaron huella' },
    mixto: { label: 'Todo Mixto', icon: '🔀', desc: 'Catálogo completo sin restricciones' },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Encabezado Broadcast */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black tracking-wider uppercase font-display shadow-xs">
          <span>⚽ MERCADO DE FICHAJES A CIEGAS</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase font-display">
          SALA DE SUBASTA
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Pujen por siluetas recortadas en el estrado blanco. Descubran la era y el valor real solo tras adjudicar.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-shake">
          <span className="text-base">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tarjeta Principal de Configuración */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl">
        {/* 1. Managers Participantes */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                MANAGERS PARTICIPANTES ({buyers.length}/8)
              </h3>
              <p className="text-xs text-slate-500">Turnos rotativos de puja durante las rondas.</p>
            </div>

            <button
              type="button"
              onClick={handleAddBuyer}
              disabled={buyers.length >= 8}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-30 rounded-xl text-xs font-black border border-slate-200 transition-all active:scale-95 shadow-xs"
            >
              + AGREGAR
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {buyers.map((buyer, idx) => (
              <div
                key={buyer.id}
                className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 transition-all shadow-xs"
              >
                <span className="w-7 h-7 rounded-xl bg-white text-slate-900 border border-slate-200 text-xs font-black flex items-center justify-center shrink-0 font-display shadow-xs">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={buyer.name}
                  onChange={(e) => handleBuyerNameChange(buyer.id, e.target.value)}
                  placeholder={`Manager ${idx + 1}`}
                  className="flex-1 bg-transparent text-slate-900 text-xs font-bold focus:outline-none uppercase placeholder:text-slate-400"
                />
                {buyers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBuyer(buyer.id)}
                    className="text-slate-400 hover:text-rose-600 text-xs px-2 py-1 rounded-lg transition-colors font-bold"
                    title="Remover manager"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Parámetros de la Partida */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Presupuesto */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display">
                PRESUPUESTO ($)
              </label>
              <input
                type="number"
                min="50"
                step="25"
                value={initialBudget}
                onChange={(e) => setInitialBudget(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-600 text-base font-black focus:border-amber-500 focus:outline-none font-mono"
              />
              <div className="flex gap-1">
                {[300, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInitialBudget(preset)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-colors ${
                      initialBudget === preset
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Plantel Objetivo */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display">
                PLANTEL OBJETIVO
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={targetSquadSize}
                onChange={(e) => setTargetSquadSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-black focus:border-amber-500 focus:outline-none font-mono"
              />
              <div className="flex gap-1">
                {[3, 5, 8].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetSquadSize(preset)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-colors ${
                      targetSquadSize === preset
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {preset} fichajes
                  </button>
                ))}
              </div>
            </div>

            {/* Incremento Mínimo */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display">
                INCREMENTO MÍNIMO ($)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={minIncrement}
                onChange={(e) => setMinIncrement(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-black focus:border-amber-500 focus:outline-none font-mono"
              />
              <div className="flex gap-1">
                {[1, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinIncrement(preset)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-colors ${
                      minIncrement === preset
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    +${preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Selección de Mazo Temático */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display">
            MAZO TEMÁTICO DE JUGADORES
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {deckOptions.map((deckKey) => {
              const isSelected = selectedDeck === deckKey;
              const details = deckDetails[deckKey];
              const count = players.filter((p) =>
                deckKey === 'mixto' ? p.versions.length > 0 : p.versions.some((v) => v.decks.includes(deckKey))
              ).length;

              return (
                <button
                  key={deckKey}
                  type="button"
                  onClick={() => setSelectedDeck(deckKey)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-400 text-slate-950 ring-2 ring-amber-400/30 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="text-xl mb-1">{details.icon}</div>
                  <div>
                    <span className="text-xs font-black uppercase font-display block text-slate-900">{details.label}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{details.desc}</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-mono mt-2 block font-black">
                    {count} cartas
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700">
                Disponibles en <strong>{deckDetails[selectedDeck].label}</strong>:
              </span>
              <strong className="text-amber-600 font-black font-mono">{availablePlayersInDeck.length}</strong>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">
              (Necesarias para la partida: {totalRequiredForFullSquads})
            </span>
          </div>
        </div>

        {/* 4. Botones de Acción */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onGoToManagement}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              [ GESTOR MANUAL ]
            </button>
            {onGoToImport && (
              <button
                type="button"
                onClick={onGoToImport}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                [ IMPORTAR API ]
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={availablePlayersInDeck.length === 0}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] disabled:opacity-30 text-slate-950 text-sm font-black rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-amber-400/25 font-display"
          >
            COMENZAR PARTIDA →
          </button>
        </div>
      </div>
    </div>
  );
};
