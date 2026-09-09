import React, { useState } from 'react';
import { AuctionGameConfig, DeckType, Player } from '../types';
import { DECK_LABELS } from '../utils/tierColors';
import { StarTokenIcon } from './StarTokenIcon';

interface SetupScreenProps {
  players: Player[];
  onStartGame: (config: AuctionGameConfig) => void;
  onGoToManagement: () => void;
  onGoToImport?: () => void;
  onCreateOnlineRoom?: (config: {
    hostName: string;
    initialBudget: number;
    minIncrement: number;
    selectedDeck: DeckType;
  }) => void;
  onJoinOnlineRoom?: (code: string, playerName: string) => void;
  initialJoinCode?: string;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  players,
  onStartGame,
  onGoToManagement,
  onGoToImport,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  initialJoinCode,
}) => {
  // Pestaña de modo: 'create_online' | 'join_online' | 'local'
  const [mode, setMode] = useState<'create_online' | 'join_online' | 'local'>(
    initialJoinCode ? 'join_online' : 'create_online'
  );

  // Estados para Unirse a Sala Online desde el celular
  const [joinCode, setJoinCode] = useState<string>(initialJoinCode || '');
  const [joinPlayerName, setJoinPlayerName] = useState<string>('');
  const [hostName, setHostName] = useState<string>('');

  // Estados para Modo Local
  const [buyers, setBuyers] = useState<Array<{ id: string; name: string }>>([
    { id: 'b1', name: 'Manager 1' },
    { id: 'b2', name: 'Manager 2' },
  ]);

  // REGLA OBLIGATORIA: Siempre 11 fichajes (Once Titular FUT)
  const targetSquadSize = 11;

  // Parámetros de economía y cartas
  const [initialBudget, setInitialBudget] = useState<number>(500);
  const [minIncrement, setMinIncrement] = useState<number>(5);
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('mixto');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availablePlayersInDeck = players.filter((player) => {
    if (selectedDeck === 'mixto') return player.versions.length > 0;
    return player.versions.some((v) => v.decks.includes(selectedDeck));
  });

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

  // Iniciar Partida Local
  const handleStartLocal = () => {
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

    if (availablePlayersInDeck.length === 0) {
      setErrorMsg(`No hay futbolistas registrados en el mazo "${DECK_LABELS[selectedDeck]}".`);
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

  // Crear Sala Online (Host Manager)
  const handleCreateOnline = () => {
    setErrorMsg(null);
    if (!hostName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre de DT / Manager para crear la sala.');
      return;
    }
    if (availablePlayersInDeck.length === 0) {
      setErrorMsg(`No hay futbolistas registrados en el mazo "${DECK_LABELS[selectedDeck]}".`);
      return;
    }

    if (onCreateOnlineRoom) {
      onCreateOnlineRoom({
        hostName: hostName.trim(),
        initialBudget,
        minIncrement,
        selectedDeck,
      });
    }
  };

  // Unirse a Sala Online desde el celular
  const handleJoinOnline = () => {
    setErrorMsg(null);
    if (!joinCode.trim()) {
      setErrorMsg('Por favor ingresa el código de 4 caracteres de la sala.');
      return;
    }
    if (!joinPlayerName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre de manager.');
      return;
    }

    if (onJoinOnlineRoom) {
      onJoinOnlineRoom(joinCode.trim().toUpperCase(), joinPlayerName.trim());
    }
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 select-none">
      {/* Encabezado Broadcast */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black tracking-wider uppercase font-display shadow-xs">
          <span>⚽ MERCADO DE FICHAJES FC MOBILE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight uppercase font-display">
          SUBASTA A CIEGAS
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Pujen por siluetas recortadas en el estrado. Arma tu <strong>Once Titular de 11 fichajes</strong> compitiendo en tiempo real desde tu celular o en la misma pantalla.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <span className="text-base">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PESTAÑAS DE MODO DE JUEGO */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/90 rounded-2xl text-xs font-display font-black shadow-inner">
        <button
          onClick={() => {
            setMode('create_online');
            setErrorMsg(null);
          }}
          className={`py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
            mode === 'create_online'
              ? 'bg-slate-900 text-amber-400 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🌐</span>
          <span>CREAR SALA ONLINE</span>
        </button>

        <button
          onClick={() => {
            setMode('join_online');
            setErrorMsg(null);
          }}
          className={`py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
            mode === 'join_online'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📱</span>
          <span>UNIRME CON CÓDIGO</span>
        </button>

        <button
          onClick={() => {
            setMode('local');
            setErrorMsg(null);
          }}
          className={`py-3 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
            mode === 'local'
              ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🎮</span>
          <span>MODO LOCAL</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA A: UNIRME CON CÓDIGO (OPTIMIZADA PARA MÓVIL) */}
      {/* ========================================================================= */}
      {mode === 'join_online' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 font-mono">
              CONTROLADOR MÓVIL
            </span>
            <h3 className="text-xl font-black text-slate-900 uppercase font-display">
              Unirse a la Partida
            </h3>
            <p className="text-xs text-slate-500">
              Ingresa el código que aparece en la pantalla del Anfitrión (PC/TV) y tu nombre.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase font-display">
                CÓDIGO DE SALA (4 LETRAS/NÚMEROS)
              </label>
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="EJ. FC77"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-300 focus:border-amber-400 focus:bg-white text-2xl font-black tracking-widest text-slate-900 uppercase font-mono text-center sm:text-left transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase font-display">
                TU NOMBRE DE MANAGER
              </label>
              <input
                type="text"
                maxLength={20}
                value={joinPlayerName}
                onChange={(e) => setJoinPlayerName(e.target.value)}
                placeholder="Ej. DT Gallardo, Matador..."
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 focus:border-amber-400 focus:bg-white text-base font-bold text-slate-900 font-display transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleJoinOnline}
            className="w-full py-4.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl uppercase tracking-wider font-display shadow-lg shadow-amber-400/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📱 ENTRAR A LA SALA DESDE ESTE CELULAR ➔</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA B: CREAR SALA ONLINE O MODO LOCAL */}
      {/* ========================================================================= */}
      {(mode === 'create_online' || mode === 'local') && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-7 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          {/* MODO ONLINE: Nombre del DT Creador */}
          {mode === 'create_online' && (
            <div className="space-y-3 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 font-display">
                  TÚ SERÁS UN MANAGER ACTIVO
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                  TU NOMBRE DE DT (ANFITRIÓN)
                </h3>
                <p className="text-xs text-slate-500">
                  Jugarás en tu propio teléfono o PC junto a tus amigos. No se requiere ninguna pantalla de TV externa.
                </p>
              </div>

              <input
                type="text"
                maxLength={20}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Ej. DT Gallardo, Scaloni, Mister..."
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 focus:border-amber-400 focus:bg-white text-base font-bold text-slate-900 font-display transition-all outline-none"
              />
            </div>
          )}

          {/* MODO LOCAL: Lista de Managers en el mismo dispositivo */}
          {mode === 'local' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                    MANAGERS PARTICIPANTES ({buyers.length}/8)
                  </h3>
                  <p className="text-xs text-slate-500">Mismo dispositivo (pasa y juega)</p>
                </div>
                {buyers.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddBuyer}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs uppercase font-display transition-colors"
                  >
                    + AGREGAR MANAGER
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {buyers.map((buyer, idx) => (
                  <div
                    key={buyer.id}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 focus-within:border-amber-400 focus-within:bg-white transition-all shadow-2xs"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center font-display shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={buyer.name}
                      onChange={(e) => handleBuyerNameChange(buyer.id, e.target.value)}
                      placeholder={`Nombre de Manager ${idx + 1}`}
                      className="flex-1 bg-transparent text-xs font-bold text-slate-900 focus:outline-none uppercase font-display"
                    />
                    {buyers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBuyer(buyer.id)}
                        className="text-slate-400 hover:text-rose-600 px-1 text-base font-bold transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODO ONLINE: Banner explicativo de Proyección en Pantalla Grande */}
          {mode === 'create_online' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl shrink-0 font-bold">
                📺
              </div>
              <div className="text-xs">
                <span className="font-display font-black text-amber-300 uppercase block">
                  PANTALLA PRINCIPAL (HOST)
                </span>
                <p className="text-slate-400 mt-0.5">
                  Esta pantalla mostrará el código de sala y proyectará las cartas en grande. Cada jugador pujará en tiempo real desde el navegador de su propio celular.
                </p>
              </div>
            </div>
          )}

          {/* 2. Reglas Económicas y Plantel Objetivo (Fijo en 11 Fichajes) */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
              CONFIGURACIÓN DE LA SUBASTA
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Presupuesto Inicial en Fichas Estelares */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display flex items-center gap-1">
                  <span>PRESUPUESTO INICIAL</span>
                  <StarTokenIcon size={13} />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={initialBudget}
                    onChange={(e) => setInitialBudget(Math.max(10, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-600 text-base font-black focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex gap-1">
                  {[300, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setInitialBudget(preset)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-colors flex items-center justify-center gap-0.5 ${
                        initialBudget === preset
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <StarTokenIcon size={10} />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Plantel Objetivo - FIJO Y BLOQUEADO EN 11 FICHAJES */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display flex items-center gap-1.5">
                  <span>PLANTEL OBJETIVO</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black font-display">
                    REGLA OFICIAL
                  </span>
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-950 text-base font-black font-mono flex items-center justify-between shadow-2xs">
                  <span>11 FUTBOLISTAS</span>
                  <span className="text-xs text-amber-800 font-sans font-bold">Once Titular FUT</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Siempre 11 fichajes por manager para completar su equipo en la cancha.
                </p>
              </div>

              {/* Incremento Mínimo */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider font-display flex items-center gap-1">
                  <span>INCREMENTO MÍNIMO</span>
                  <StarTokenIcon size={13} />
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
                      className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-colors flex items-center justify-center gap-0.5 ${
                        minIncrement === preset
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <span>+{preset}</span>
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
                  deckKey === 'mixto'
                    ? p.versions.length > 0
                    : p.versions.some((v) => v.decks.includes(deckKey))
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
                      <span className="text-xs font-black uppercase font-display block text-slate-900">
                        {details.label}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {details.desc}
                      </span>
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
                <strong className="text-amber-600 font-black font-mono">
                  {availablePlayersInDeck.length}
                </strong>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                (Regla: 11 fichajes por equipo)
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

            {mode === 'create_online' ? (
              <button
                type="button"
                onClick={handleCreateOnline}
                disabled={availablePlayersInDeck.length === 0}
                className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] disabled:opacity-30 text-slate-950 text-sm font-black rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-amber-400/25 font-display cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 CREAR SALA Y JUGAR ➔</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartLocal}
                disabled={availablePlayersInDeck.length === 0}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] disabled:opacity-30 text-slate-950 text-sm font-black rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-amber-400/25 font-display cursor-pointer"
              >
                COMENZAR PARTIDA LOCAL →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
