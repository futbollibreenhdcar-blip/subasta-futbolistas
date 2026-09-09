import React, { useState, useEffect } from 'react';
import { SportsApiPlayer, Tier, DeckType, Player } from '../types';
import { processImageBackgroundRemoval } from '../services/backgroundRemoval';
import { fetchPlayerImageBlob } from '../services/sportsApi';
import { fetchPlayersFromSupabase } from '../services/supabasePlayers';
import { getTierStyle, DECK_LABELS } from '../utils/tierColors';

interface AdminScreenProps {
  onBackToGame: () => void;
  onPlayersUpdated: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onBackToGame,
  onPlayersUpdated,
}) => {
  const [adminSecret, setAdminSecret] = useState(() => {
    return localStorage.getItem('subasta_admin_secret') || 'subasta_secret_2026_x7a9';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SportsApiPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<SportsApiPlayer | null>(null);

  // Recorte en navegador
  const [isProcessingCutout, setIsProcessingCutout] = useState(false);
  const [cutoutProgressMsg, setCutoutProgressMsg] = useState('');
  const [cutoutDataUrl, setCutoutDataUrl] = useState<string | null>(null);

  // Formulario de edición
  const [formData, setFormData] = useState<{
    nombre_real: string;
    etiqueta: string;
    tier: Tier;
    valor: number;
    mazos: DeckType[];
  }>({
    nombre_real: '',
    etiqueta: 'Prime',
    tier: 'A',
    valor: 70,
    mazos: ['estrellas_actuales'],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Catálogo actual en Supabase
  const [supabasePlayers, setSupabasePlayers] = useState<Player[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSupabaseCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const data = await fetchPlayersFromSupabase();
      setSupabasePlayers(data);
      onPlayersUpdated();
    } catch (err: any) {
      console.error('Error cargando catálogo Supabase:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadSupabaseCatalog();
  }, []);

  const handleSaveSecret = (secret: string) => {
    setAdminSecret(secret);
    localStorage.setItem('subasta_admin_secret', secret);
  };

  // Buscar en TheSportsDB usando la clave de prueba "123" requerida
  const handleSearchTheSportsDB = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedPlayer(null);
    setCutoutDataUrl(null);

    try {
      const url = `https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(
        searchQuery.trim()
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || !text.trim()) {
        showToast('No se encontraron resultados en TheSportsDB.', 'error');
        setIsSearching(false);
        return;
      }
      const data = JSON.parse(text);
      const players = (data.player || []).filter((p: any) => p.strPlayer && (p.strThumb || p.strCutout));
      setSearchResults(players);
      if (players.length === 0) {
        showToast('Sin resultados con imagen oficial.', 'error');
      }
    } catch (err: any) {
      showToast('Error al consultar TheSportsDB: ' + err.message, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Seleccionar jugador y procesar recorte automático con @imgly/background-removal en el navegador
  const handleSelectAndProcess = async (player: SportsApiPlayer) => {
    setSelectedPlayer(player);
    const photoUrl = player.strThumb || player.strCutout;
    if (!photoUrl) {
      showToast('Este jugador no tiene foto oficial.', 'error');
      return;
    }

    const isGK = (player.strPosition || '').toLowerCase().includes('goal');
    setFormData({
      nombre_real: player.strPlayer,
      etiqueta: `${player.strTeam || 'Versión'} ${new Date().getFullYear()}`,
      tier: 'A',
      valor: 70,
      mazos: isGK ? ['arqueros', 'estrellas_actuales'] : ['estrellas_actuales'],
    });

    setIsProcessingCutout(true);
    setCutoutProgressMsg('Descargando foto oficial...');
    try {
      const imgBlob = await fetchPlayerImageBlob(photoUrl);
      setCutoutProgressMsg('Recortando fondo con IA local...');
      const dataUrl = await processImageBackgroundRemoval(imgBlob, (msg) => {
        setCutoutProgressMsg(msg);
      });
      setCutoutDataUrl(dataUrl);
      showToast(`¡Silueta de ${player.strPlayer} recortada con éxito!`);
    } catch (err: any) {
      console.error(err);
      showToast('Error al recortar imagen: ' + err.message, 'error');
    } finally {
      setIsProcessingCutout(false);
    }
  };

  // Guardar en Supabase llamando al endpoint protegido /api/agregar-jugador
  const handleSaveToSupabase = async () => {
    if (!formData.nombre_real.trim()) {
      showToast('Ingresa el nombre real del jugador.', 'error');
      return;
    }
    if (!cutoutDataUrl) {
      showToast('Debes recortar la foto antes de guardar.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/agregar-jugador', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          nombre_real: formData.nombre_real,
          etiqueta: formData.etiqueta,
          tier: formData.tier,
          valor: formData.valor,
          mazos: formData.mazos,
          foto_base64: cutoutDataUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      showToast(`¡${formData.nombre_real} guardado exitosamente en Supabase!`);
      // Limpiar selección y recargar catálogo
      setSelectedPlayer(null);
      setCutoutDataUrl(null);
      await loadSupabaseCatalog();
    } catch (err: any) {
      console.error(err);
      showToast('Error al guardar en Supabase: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-32">
      {/* Toast de Notificaciones */}
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

      {/* Cabecera de Administración */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-2">
            Panel de Administración (/admin)
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>🛡️</span>
            <span>Gestión en la Nube (Supabase)</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Busca en TheSportsDB (API key 123), recorta con IA y guarda en Supabase mediante /api/agregar-jugador.
          </p>
        </div>

        <button
          onClick={onBackToGame}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
        >
          Ir a Jugar Subasta &rarr;
        </button>
      </div>

      {/* Barra de Configuración de Seguridad (x-admin-secret) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔐</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Clave de Administración (x-admin-secret)
            </h4>
            <p className="text-[11px] text-slate-500">
              Header requerido por la Vercel Function /api/agregar-jugador para autorizar escrituras.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => handleSaveSecret(e.target.value)}
            placeholder="ADMIN_SECRET"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 1. BUSCADOR EN THESPORTSDB (Key 123) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <span>🔍</span>
          <span>Buscar Jugador en TheSportsDB (Clave "123")</span>
        </h3>

        <form onSubmit={handleSearchTheSportsDB} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Escribe el nombre de un futbolista (ej. Zidane, Vinicius, Mbappe, Buffon...)"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            {isSearching ? <span className="animate-spin">⏳</span> : <span>Buscar</span>}
          </button>
        </form>

        {/* Resultados de TheSportsDB */}
        {searchResults.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs text-slate-500 font-semibold block">
              Resultados encontrados ({searchResults.length}): Elige uno para recortar y configurar
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((p) => {
                const photo = p.strThumb || p.strCutout;
                const isSelected = selectedPlayer?.idPlayer === p.idPlayer;
                return (
                  <div
                    key={p.idPlayer}
                    onClick={() => handleSelectAndProcess(p)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-slate-50/70 border-slate-200 hover:border-amber-300 hover:bg-white'
                    }`}
                  >
                    <div className="w-12 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt={p.strPlayer} className="max-h-full max-w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-black text-slate-900 truncate">{p.strPlayer}</h5>
                      <p className="text-[11px] text-slate-500 truncate">{p.strTeam || 'Sin club'}</p>
                      <p className="text-[10px] text-slate-400">{p.strNationality || ''} • {p.strPosition || ''}</p>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-lg text-xs font-bold shrink-0 transition-colors"
                    >
                      Elegir
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. RECORTE CON IA Y FORMULARIO DE VERSIÓN */}
      {selectedPlayer && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>✂️</span>
              <span>Configuración y Recorte: {selectedPlayer.strPlayer}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Club: {selectedPlayer.strTeam || '—'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Vista Previa del Recorte */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-3">
              <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-checkerboard border-2 border-slate-200 flex items-center justify-center p-4">
                {isProcessingCutout ? (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs text-amber-700 font-bold">{cutoutProgressMsg}</p>
                  </div>
                ) : cutoutDataUrl ? (
                  <img
                    src={cutoutDataUrl}
                    alt="Recorte vista previa"
                    className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Foto no procesada</span>
                )}
              </div>

              {cutoutDataUrl && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Recorte transparente generado con IA en el navegador</span>
                </div>
              )}
            </div>

            {/* Campos de Versión / Metadata */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Nombre Real
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_real}
                    onChange={(e) => setFormData({ ...formData, nombre_real: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Etiqueta de la Versión
                  </label>
                  <input
                    type="text"
                    value={formData.etiqueta}
                    onChange={(e) => setFormData({ ...formData, etiqueta: e.target.value })}
                    placeholder="ej. Prime 2016 - Juventus"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Selector de Tier */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Tier (Marco de Silueta)
                </label>
                <div className="flex gap-2">
                  {(['S', 'A', 'B', 'C', 'D'] as Tier[]).map((t) => {
                    const isSelected = formData.tier === t;
                    const style = getTierStyle(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const defValues: Record<Tier, number> = { S: 100, A: 70, B: 45, C: 25, D: 15 };
                          setFormData({ ...formData, tier: t, valor: defValues[t] });
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                          isSelected
                            ? `${style.badgeBg} ${style.badgeText} ${style.borderColor} shadow-md scale-105`
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  S (Dorado, $100) • A/B (Plata, $70/$45) • C/D (Bronce, $25/$15)
                </span>
              </div>

              {/* Valor numérico */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Valor Numérico ($)
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Mazos Temáticos */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Mazos Temáticos
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['leyendas', 'estrellas_actuales', 'arqueros', 'retirados'] as DeckType[]).map((d) => {
                    const checked = formData.mazos.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const updated = checked
                            ? formData.mazos.filter((x) => x !== d)
                            : [...formData.mazos, d];
                          setFormData({ ...formData, mazos: updated });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          checked
                            ? 'bg-amber-50 border-amber-400 text-amber-900 font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '} {DECK_LABELS[d]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Guardar en Supabase */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveToSupabase}
                  disabled={isSaving || !cutoutDataUrl || isProcessingCutout}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <span>Subiendo a Supabase y Storage...</span>
                  ) : (
                    <span>💾 Guardar Jugador en Supabase (/api/agregar-jugador)</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CATÁLOGO EN TIEMPO REAL DESDE SUPABASE */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>☁️</span>
              <span>Futbolistas Almacenados en Supabase ({supabasePlayers.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Leídos en vivo mediante SELECT público con RLS. Disponibles al instante en cualquier partida.
            </p>
          </div>

          <button
            onClick={loadSupabaseCatalog}
            disabled={isLoadingCatalog}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs text-slate-700 font-bold rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isLoadingCatalog ? <span className="animate-spin">🔄</span> : <span>🔄 Actualizar</span>}
          </button>
        </div>

        {supabasePlayers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
            Aún no hay futbolistas cargados en Supabase. Utiliza el buscador arriba o ejecuta la importación masiva.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {supabasePlayers.map((p) => {
              const mainVer = p.versions[0];
              const tStyle = mainVer ? getTierStyle(mainVer.tier) : null;
              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  {/* Foto de Supabase Storage */}
                  <div className="w-12 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    {mainVer?.imageDataUrl ? (
                      <img src={mainVer.imageDataUrl} alt={p.name} className="max-h-full max-w-full object-contain" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {tStyle && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${tStyle.badgeBg} ${tStyle.badgeText}`}>
                          {mainVer.tier}
                        </span>
                      )}
                      <h5 className="text-xs font-black text-slate-900 truncate">{p.name}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{mainVer?.versionTag || '—'}</p>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Valor: ${mainVer?.value || 0}</span>
                      <span>{p.versions.length} {p.versions.length === 1 ? 'versión' : 'versiones'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
