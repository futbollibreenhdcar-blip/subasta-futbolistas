import React, { useState, useEffect, useRef } from 'react';
import { Player, PlayerVersion, Tier, DeckType } from '../types';
import { processImageBackgroundRemoval } from '../services/backgroundRemoval';
import {
  getAllPlayers,
  addOrUpdatePlayerVersion,
  deletePlayer,
  deleteVersion,
  exportDatabaseJSON,
  importDatabaseJSON,
} from '../services/db';
import { getTierStyle, DECK_LABELS } from '../utils/tierColors';

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progressMsg: string;
  progressRatio: number;
  resultDataUrl?: string;
  errorMessage?: string;
  formData: {
    playerName: string;
    versionTag: string;
    tier: Tier;
    value: number;
    decks: DeckType[];
  };
}

interface ManagementScreenProps {
  onBackToSetup: () => void;
  onPlayersUpdated: () => void;
  onGoToImport?: () => void;
}

export const ManagementScreen: React.FC<ManagementScreenProps> = ({
  onBackToSetup,
  onPlayersUpdated,
  onGoToImport,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMode, setPreviewMode] = useState<Record<string, 'cutout' | 'silhouette'>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadPlayers = async () => {
    try {
      const data = await getAllPlayers();
      setPlayers(data);
      onPlayersUpdated();
    } catch (err) {
      console.error('Error cargando jugadores:', err);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Manejador de subida de archivos
  const handleFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Por favor sube solo archivos de imagen.', 'error');
      return;
    }

    const newItems: QueueItem[] = validFiles.map((file) => {
      // Intentar adivinar un nombre preliminar a partir del nombre del archivo
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `q_${Date.now()}_${Math.random()}`,
        file,
        status: 'pending',
        progressMsg: 'En cola...',
        progressRatio: 0,
        formData: {
          playerName: rawName,
          versionTag: 'Prime',
          tier: 'A',
          value: 75,
          decks: ['estrellas_actuales'],
        },
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
    // Procesar de forma secuencial
    processNextInQueue([...queue, ...newItems]);
  };

  // Procesador de la cola de recorte con @imgly/background-removal
  const processNextInQueue = async (currentQueue: QueueItem[]) => {
    const nextItem = currentQueue.find((item) => item.status === 'pending');
    if (!nextItem) return;

    // Actualizar estado a procesando
    setQueue((prev) =>
      prev.map((it) =>
        it.id === nextItem.id
          ? { ...it, status: 'processing', progressMsg: 'Iniciando IA local...', progressRatio: 0.1 }
          : it
      )
    );

    try {
      const dataUrl = await processImageBackgroundRemoval(nextItem.file, (msg, ratio) => {
        setQueue((prev) =>
          prev.map((it) => (it.id === nextItem.id ? { ...it, progressMsg: msg, progressRatio: ratio } : it))
        );
      });

      setQueue((prev) =>
        prev.map((it) =>
          it.id === nextItem.id
            ? { ...it, status: 'done', resultDataUrl: dataUrl, progressMsg: 'Recorte completado con éxito' }
            : it
        )
      );
    } catch (err: any) {
      console.error('Error recortando fondo:', err);
      setQueue((prev) =>
        prev.map((it) =>
          it.id === nextItem.id
            ? { ...it, status: 'error', errorMessage: err.message || 'Error al recortar fondo' }
            : it
        )
      );
    }

    // Continuar con el siguiente
    setQueue((updatedQueue) => {
      processNextInQueue(updatedQueue);
      return updatedQueue;
    });
  };

  // Guardar versión en IndexedDB
  const handleSaveItem = async (item: QueueItem) => {
    if (!item.resultDataUrl) return;
    const { playerName, versionTag, tier, value, decks } = item.formData;

    if (!playerName.trim()) {
      showToast('Ingresa el nombre real del futbolista.', 'error');
      return;
    }
    if (!versionTag.trim()) {
      showToast('Ingresa la etiqueta de la versión (ej. Prime 2016).', 'error');
      return;
    }
    if (decks.length === 0) {
      showToast('Selecciona al menos un mazo temático.', 'error');
      return;
    }

    try {
      const version: PlayerVersion = {
        id: crypto.randomUUID ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        versionTag: versionTag.trim(),
        tier,
        value: Number(value) || 50,
        decks,
        imageDataUrl: item.resultDataUrl,
        createdAt: Date.now(),
      };

      await addOrUpdatePlayerVersion(playerName.trim(), version);
      // Remover de la cola
      setQueue((prev) => prev.filter((it) => it.id !== item.id));
      await loadPlayers();
      showToast(`¡Versión "${versionTag}" de ${playerName} guardada en IndexedDB!`);
    } catch (err: any) {
      console.error('Error al guardar:', err);
      showToast('Error al guardar en IndexedDB: ' + err.message, 'error');
    }
  };

  // Eliminar elemento de la cola
  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((it) => it.id !== id));
  };

  // Eliminar versión de la base de datos
  const handleDeleteVersion = async (playerId: string, versionId: string) => {
    if (confirm('¿Eliminar esta versión del jugador?')) {
      await deleteVersion(playerId, versionId);
      await loadPlayers();
      showToast('Versión eliminada.');
    }
  };

  // Eliminar jugador completo
  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('¿Eliminar este futbolista y todas sus versiones?')) {
      await deletePlayer(playerId);
      await loadPlayers();
      showToast('Futbolista eliminado.');
    }
  };

  // Exportar / Importar
  const handleExport = async () => {
    const json = await exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `futbolistas_subasta_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Base de datos exportada en JSON.');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importDatabaseJSON(text);
      await loadPlayers();
      showToast(`¡Se importaron ${count} futbolistas correctamente!`);
    } catch (err: any) {
      showToast('Error al importar archivo: ' + err.message, 'error');
    }
    if (e.target) e.target.value = '';
  };

  const existingPlayerNames = Array.from(new Set(players.map((p) => p.name)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-900 border-rose-300 shadow-rose-500/10'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Cabecera y Barra de Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>⚽</span>
            <span>Administración de Futbolistas</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Sube fotos normales: la IA quitará el fondo automáticamente en tu navegador y guardará la silueta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onGoToImport && (
            <button
              onClick={onGoToImport}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>🌐</span>
              <span>Importar Masivo (API)</span>
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={players.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Importar JSON</span>
          </button>
          <input
            type="file"
            ref={importInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={onBackToSetup}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Ir a Jugar Subasta &rarr;
          </button>
        </div>
      </div>

      {/* Zona de Arrastre / Drag & Drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-500 bg-amber-50 scale-[1.01]'
            : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-amber-400 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          multiple
          accept="image/*"
          className="hidden"
        />
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-1">
          Arrastra aquí una o varias fotos con fondo
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          O haz clic para seleccionar archivos. La IA (@imgly/background-removal) quitará el fondo automáticamente en tu equipo sin subirlo a ningún servidor.
        </p>
      </div>

      {/* Cola de Procesamiento y Formularios de Jugadores */}
      {queue.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span>Fotos en Proceso / Pendientes de Guardar ({queue.length})</span>
            </h3>
            <span className="text-xs text-slate-500">
              Revisa la vista previa y completa los datos antes de guardar en IndexedDB.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {queue.map((item) => {
              const currentTierStyle = getTierStyle(item.formData.tier);
              const isSilhMode = previewMode[item.id] === 'silhouette';

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start"
                >
                  {/* Vista Previa de la Imagen */}
                  <div className="w-full lg:w-72 shrink-0 flex flex-col items-center">
                    <div
                      className={`relative w-full h-72 rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all ${
                        item.status === 'done' ? currentTierStyle.borderColor : 'border-slate-200'
                      } ${isSilhMode ? 'bg-slate-950' : 'bg-checkerboard'}`}
                    >
                      {item.status === 'done' && item.resultDataUrl ? (
                        <img
                          src={item.resultDataUrl}
                          alt="Recorte vista previa"
                          className={`max-h-full max-w-full object-contain p-3 transition-all ${
                            isSilhMode ? 'brightness-0 contrast-200' : 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]'
                          }`}
                        />
                      ) : item.status === 'processing' ? (
                        <div className="flex flex-col items-center p-4 text-center">
                          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                          <p className="text-xs text-amber-700 font-bold">{item.progressMsg}</p>
                          <div className="w-36 bg-slate-100 rounded-full h-2 mt-3 overflow-hidden border border-slate-200">
                            <div
                              className="bg-amber-500 h-2 transition-all duration-300"
                              style={{ width: `${Math.round(item.progressRatio * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : item.status === 'error' ? (
                        <div className="p-4 text-center text-rose-600 text-xs">
                          <p className="font-bold mb-1">Error al procesar</p>
                          <p className="text-slate-500">{item.errorMessage}</p>
                        </div>
                      ) : (
                        <div className="text-center p-4 text-slate-400 text-xs">
                          Esperando turno de procesamiento...
                        </div>
                      )}
                    </div>

                    {/* Botón para alternar preview entre transparencia y silueta */}
                    {item.status === 'done' && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewMode((prev) => ({
                              ...prev,
                              [item.id]: prev[item.id] === 'silhouette' ? 'cutout' : 'silhouette',
                            }))
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{isSilhMode ? '👁️ Ver Foto a Color' : '👤 Ver Silueta Negra'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Formulario de Metadatos */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-slate-400 font-mono">
                        Archivo: {item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)
                      </div>
                      <button
                        onClick={() => handleRemoveQueueItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs transition-colors"
                      >
                        ✕ Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nombre Real */}
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                          Nombre Real del Futbolista
                        </label>
                        <input
                          type="text"
                          list={`names-list-${item.id}`}
                          value={item.formData.playerName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, formData: { ...it.formData, playerName: val } }
                                  : it
                              )
                            );
                          }}
                          placeholder="ej. Lionel Messi, Zinedine Zidane"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                        {/* Autocompletado de jugadores existentes */}
                        <datalist id={`names-list-${item.id}`}>
                          {existingPlayerNames.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Si ya existe, se agregará esta versión a su perfil.
                        </span>
                      </div>

                      {/* Etiqueta de la Versión */}
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                          Etiqueta de la Versión / Era
                        </label>
                        <input
                          type="text"
                          value={item.formData.versionTag}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQueue((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, formData: { ...it.formData, versionTag: val } }
                                  : it
                              )
                            );
                          }}
                          placeholder="ej. Prime 2016 - Juventus"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Tier (S/A/B/C/D) */}
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                          Tier (Marco de la Silueta)
                        </label>
                        <div className="flex gap-2">
                          {(['S', 'A', 'B', 'C', 'D'] as Tier[]).map((t) => {
                            const isSelected = item.formData.tier === t;
                            const tStyle = getTierStyle(t);
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  setQueue((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id
                                        ? { ...it, formData: { ...it.formData, tier: t } }
                                        : it
                                    )
                                  )
                                }
                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                                  isSelected
                                    ? `${tStyle.badgeBg} ${tStyle.badgeText} ${tStyle.borderColor} shadow-md scale-105`
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          S = Dorado | A/B = Plata | C/D = Bronce
                        </span>
                      </div>

                      {/* Valor Numérico */}
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                          Valor Numérico ($)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={item.formData.value}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setQueue((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, formData: { ...it.formData, value: val } }
                                  : it
                              )
                            );
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Valor real contra el que se comparará el precio pagado.
                        </span>
                      </div>
                    </div>

                    {/* Mazos Temáticos */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Mazos Temáticos (puede pertenecer a varios)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            'leyendas',
                            'estrellas_actuales',
                            'arqueros',
                            'retirados',
                          ] as DeckType[]
                        ).map((deckKey) => {
                          const isChecked = item.formData.decks.includes(deckKey);
                          return (
                            <button
                              key={deckKey}
                              type="button"
                              onClick={() => {
                                const newDecks = isChecked
                                  ? item.formData.decks.filter((d) => d !== deckKey)
                                  : [...item.formData.decks, deckKey];
                                setQueue((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? { ...it, formData: { ...it.formData, decks: newDecks } }
                                      : it
                                  )
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                isChecked
                                  ? 'bg-amber-50 border-amber-400 text-amber-900 font-black'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {isChecked ? '✓ ' : '+ '} {DECK_LABELS[deckKey]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón de Guardado */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleSaveItem(item)}
                        disabled={item.status !== 'done'}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Guardar Futbolista en IndexedDB</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listado de Futbolistas Guardados en IndexedDB */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Futbolistas en Base de Datos ({players.length})
            </h3>
            <p className="text-slate-500 text-sm">
              Estos futbolistas se sortearán durante las rondas de subasta según el mazo temático elegido.
            </p>
          </div>

          <span className="text-xs px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600 font-semibold">
            {players.reduce((acc, p) => acc + p.versions.length, 0)} versiones totales registradas
          </span>
        </div>

        {players.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-slate-500 font-medium text-sm">
              Tu base de datos está vacía. Sube tus primeras fotos arriba para comenzar a poblar el mazo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-black text-slate-900">{player.name}</h4>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 text-xs transition-colors cursor-pointer"
                      title="Eliminar futbolista completo"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="space-y-3">
                    {player.versions.map((ver) => {
                      const tStyle = getTierStyle(ver.tier);
                      return (
                        <div
                          key={ver.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          {/* Miniatura */}
                          <div className="w-12 h-14 bg-checkerboard rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                            <img
                              src={ver.imageDataUrl}
                              alt={ver.versionTag}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-black ${tStyle.badgeBg} ${tStyle.badgeText}`}
                              >
                                {ver.tier}
                              </span>
                              <span className="text-xs font-black text-slate-900 truncate">
                                {ver.versionTag}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                              <span className="font-semibold text-slate-700">Valor: ${ver.value}</span>
                              <div className="flex gap-1">
                                {ver.decks.map((d) => (
                                  <span
                                    key={d}
                                    className="text-[9px] px-1.5 py-0.5 bg-slate-200/80 rounded text-slate-700 font-medium"
                                  >
                                    {d === 'estrellas_actuales' ? 'estrellas' : d}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteVersion(player.id, ver.id)}
                            className="text-slate-400 hover:text-rose-500 text-xs p-1 transition-colors cursor-pointer"
                            title="Eliminar versión"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>{player.versions.length} {player.versions.length === 1 ? 'versión' : 'versiones'}</span>
                  <span className="font-semibold text-slate-500">Registrado</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
