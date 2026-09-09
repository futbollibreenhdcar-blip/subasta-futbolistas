import React, { useState, useEffect } from 'react';
import { SportsApiPlayer, PlayerVersion, DeckType, Tier } from '../types';
import {
  searchPlayersByName,
  searchPlayersByTeam,
  getTeamsInLeague,
  POPULAR_LEAGUES,
  POPULAR_TEAMS,
  fetchPlayerImageBlob,
} from '../services/sportsApi';
import { processImageBackgroundRemoval } from '../services/backgroundRemoval';
import { addOrUpdatePlayerVersion } from '../services/db';

interface ImportScreenProps {
  onBack: () => void;
  onGoToAuction: () => void;
  onPlayersUpdated: () => void;
}

export const ImportScreen: React.FC<ImportScreenProps> = ({
  onBack,
  onGoToAuction,
  onPlayersUpdated,
}) => {
  const [searchMode, setSearchMode] = useState<'name' | 'team' | 'league'>('team');
  const [query, setQuery] = useState('Real Madrid');
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id);
  const [teamsInLeague, setTeamsInLeague] = useState<Array<{ idTeam: string; strTeam: string }>>([]);

  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SportsApiPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());

  // Estado de importación masiva en progreso
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    currentIndex: number;
    total: number;
    currentPlayerName: string;
    stageMessage: string;
    subRatio: number;
  } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const executeSearch = async (searchQuery: string, mode: 'name' | 'team' | 'league') => {
    setIsLoadingResults(true);
    setSearchResults([]);
    setSelectedPlayerIds(new Set());

    try {
      let results: SportsApiPlayer[] = [];
      if (mode === 'name') {
        results = await searchPlayersByName(searchQuery);
      } else if (mode === 'team') {
        results = await searchPlayersByTeam(searchQuery);
      } else if (mode === 'league') {
        const teams = await getTeamsInLeague(selectedLeague);
        setTeamsInLeague(teams);
        if (teams.length > 0) {
          results = await searchPlayersByTeam(teams[0].strTeam);
        }
      }

      // Filtrar los que tengan imagen válida (thumb o cutout)
      const withPhotos = results.filter((p) => p.strThumb || p.strCutout);
      setSearchResults(withPhotos);

      if (withPhotos.length === 0) {
        showToast(`No se encontraron jugadores con foto para "${searchQuery}".`, 'error');
      } else {
        const allIds = new Set(withPhotos.map((p) => p.idPlayer));
        setSelectedPlayerIds(allIds);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error al conectar con la API deportiva: ' + err.message, 'error');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(query, searchMode);
  };

  // Carga inicial automática de Real Madrid al entrar a la pantalla
  useEffect(() => {
    executeSearch('Real Madrid', 'team');
  }, []);

  // Cargar jugadores al cambiar de equipo dentro de una liga
  const handleSelectTeamFromLeague = async (teamName: string) => {
    setIsLoadingResults(true);
    try {
      const results = await searchPlayersByTeam(teamName);
      const withPhotos = results.filter((p) => p.strThumb || p.strCutout);
      setSearchResults(withPhotos);
      setSelectedPlayerIds(new Set(withPhotos.map((p) => p.idPlayer)));
    } catch (err: any) {
      showToast('Error al buscar plantel: ' + err.message, 'error');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPlayerIds.size === searchResults.length) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(searchResults.map((p) => p.idPlayer)));
    }
  };

  const togglePlayerSelect = (id: string) => {
    const updated = new Set(selectedPlayerIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedPlayerIds(updated);
  };

  // Importar seleccionados en bloque
  const handleImportSelected = async () => {
    const playersToImport = searchResults.filter((p) => selectedPlayerIds.has(p.idPlayer));
    if (playersToImport.length === 0) {
      showToast('Selecciona al menos un jugador para importar.', 'error');
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    for (let i = 0; i < playersToImport.length; i++) {
      const p = playersToImport[i];
      const photoUrl = p.strThumb || p.strCutout;
      if (!photoUrl) continue;

      setImportProgress({
        currentIndex: i + 1,
        total: playersToImport.length,
        currentPlayerName: p.strPlayer,
        stageMessage: 'Descargando fotografía oficial...',
        subRatio: 0.1,
      });

      try {
        // 1. Descargar imagen como Blob
        const imgBlob = await fetchPlayerImageBlob(photoUrl);

        // 2. Procesar con @imgly/background-removal para generar PNG transparente
        setImportProgress({
          currentIndex: i + 1,
          total: playersToImport.length,
          currentPlayerName: p.strPlayer,
          stageMessage: 'Recortando silueta con IA (@imgly/background-removal)...',
          subRatio: 0.3,
        });

        const transparentDataUrl = await processImageBackgroundRemoval(imgBlob, (msg, ratio) => {
          setImportProgress((prev) =>
            prev ? { ...prev, stageMessage: msg, subRatio: 0.3 + ratio * 0.6 } : null
          );
        });

        // 3. Crear versión con defaults razonables (Tier B, valor 50)
        const isGoalkeeper = (p.strPosition || '').toLowerCase().includes('goal');
        const assignedDecks: DeckType[] = isGoalkeeper
          ? ['arqueros', 'estrellas_actuales']
          : ['estrellas_actuales'];

        const version: PlayerVersion = {
          id: crypto.randomUUID ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          versionTag: `${p.strTeam || 'Actual'} ${new Date().getFullYear()}`,
          tier: 'B' as Tier,
          value: 50,
          decks: assignedDecks,
          imageDataUrl: transparentDataUrl,
          createdAt: Date.now(),
        };

        // 4. Guardar en IndexedDB
        await addOrUpdatePlayerVersion(p.strPlayer, version);
        successCount++;
      } catch (err: any) {
        console.error(`Error importando a ${p.strPlayer}:`, err);
      }
    }

    setIsImporting(false);
    setImportProgress(null);
    onPlayersUpdated();
    showToast(`¡Se importaron ${successCount} futbolistas en IndexedDB con éxito!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-900 border-rose-300 shadow-rose-500/10'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modal / Overlay de Procesamiento Masivo */}
      {isImporting && importProgress && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-amber-600 font-black">
                Importación Masiva en Curso
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1 truncate">
                {importProgress.currentPlayerName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Procesando jugador {importProgress.currentIndex} de {importProgress.total}
              </p>
            </div>

            {/* Barra de progreso global */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Progreso total</span>
                <span>{Math.round((importProgress.currentIndex / importProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.round((importProgress.currentIndex / importProgress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200 truncate">
              {importProgress.stageMessage}
            </p>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <span>🌐</span>
            <span>Importar Jugadores Reales (API)</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Busca planteles completos desde TheSportsDB y recorta sus siluetas automáticamente con IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            ← Volver
          </button>
          <button
            onClick={onGoToAuction}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Ir a Jugar &rarr;
          </button>
        </div>
      </div>

      {/* Selector de Modo de Búsqueda y Barra de Búsqueda */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        {/* Pestañas de modo */}
        <div className="flex gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => {
              setSearchMode('team');
              setQuery('Real Madrid');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              searchMode === 'team'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ Por Equipo / Club
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchMode('name');
              setQuery('Messi');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              searchMode === 'name'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 Por Nombre
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('league')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              searchMode === 'league'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            🏆 Por Liga
          </button>
        </div>

        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          {searchMode === 'league' ? (
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                {POPULAR_LEAGUES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              {teamsInLeague.length > 0 && (
                <select
                  onChange={(e) => handleSelectTeamFromLeague(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Elige un Club --</option>
                  {teamsInLeague.map((t) => (
                    <option key={t.idTeam} value={t.strTeam}>
                      {t.strTeam}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchMode === 'team'
                  ? 'Nombre del club (ej. Barcelona, Arsenal, Boca Juniors)'
                  : 'Nombre del futbolista (ej. Mbappe, Bellingham, Haaland)'
              }
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
            />
          )}

          <button
            type="submit"
            disabled={isLoadingResults}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isLoadingResults ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>🔍 Buscar</span>
            )}
          </button>
        </form>

        {/* Chips de clubes populares para búsqueda con un solo toque */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-500 font-bold shrink-0 text-[11px]">Sugerencias:</span>
          {POPULAR_TEAMS.map((teamName) => (
            <button
              key={teamName}
              type="button"
              onClick={() => {
                setSearchMode('team');
                setQuery(teamName);
                executeSearch(teamName, 'team');
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-950 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {teamName}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados de la Búsqueda */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
              >
                {selectedPlayerIds.size === searchResults.length
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
              <span className="text-xs text-slate-500">
                ({selectedPlayerIds.size} de {searchResults.length} seleccionados)
              </span>
            </div>

            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedPlayerIds.size === 0 || isImporting}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-white font-black rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡</span>
              <span>Importar Seleccionados ({selectedPlayerIds.size})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((player) => {
              const isSelected = selectedPlayerIds.has(player.idPlayer);
              const imgUrl = player.strThumb || player.strCutout;

              return (
                <div
                  key={player.idPlayer}
                  onClick={() => togglePlayerSelect(player.idPlayer)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 select-none ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Manejado en el contenedor padre
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 focus:outline-none shrink-0 pointer-events-none"
                  />

                  {/* Foto oficial */}
                  <div className="w-12 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={player.strPlayer}
                        className="max-h-full max-w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Sin foto</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-slate-900 truncate">
                      {player.strPlayer}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {player.strTeam || 'Club desconocido'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                      <span>{player.strNationality || '—'}</span>
                      {player.strPosition && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-semibold">{player.strPosition}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
