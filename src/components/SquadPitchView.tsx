import React, { useState } from 'react';
import type { BoughtPlayer, Buyer } from '../types';
import { FCMobileThumbnail } from './FCMobileThumbnail';
import { StarTokenIcon } from './StarTokenIcon';

interface SquadPitchViewProps {
  manager: Buyer;
}

// Clasificación de posiciones tácticas FUT
type SlotRole = 'GK' | 'LB' | 'CB1' | 'CB2' | 'RB' | 'LM' | 'CM' | 'RM' | 'LW' | 'ST' | 'RW';

interface PitchSlot {
  role: SlotRole;
  label: string;
  top: string;   // Porcentaje vertical
  left: string;  // Porcentaje horizontal
}

// Formación 4-3-3 Clásica estilo FIFA Ultimate Team
const PITCH_SLOTS: PitchSlot[] = [
  // Delantera (Ataque)
  { role: 'LW', label: 'EI', top: '15%', left: '20%' },
  { role: 'ST', label: 'DC', top: '12%', left: '50%' },
  { role: 'RW', label: 'ED', top: '15%', left: '80%' },

  // Mediocampo
  { role: 'LM', label: 'MI/MC', top: '40%', left: '25%' },
  { role: 'CM', label: 'MCD/MC', top: '44%', left: '50%' },
  { role: 'RM', label: 'MD/MCO', top: '40%', left: '75%' },

  // Defensa
  { role: 'LB', label: 'LI', top: '68%', left: '16%' },
  { role: 'CB1', label: 'DFC', top: '70%', left: '38%' },
  { role: 'CB2', label: 'DFC', top: '70%', left: '62%' },
  { role: 'RB', label: 'LD', top: '68%', left: '84%' },

  // Portería
  { role: 'GK', label: 'POR', top: '88%', left: '50%' },
];

function categorizePlayer(pos?: string): 'GK' | 'DEF' | 'MID' | 'ATT' {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'POR') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DFC', 'LI', 'LD'].includes(p)) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'MC', 'MCD', 'MCO', 'MI', 'MD'].includes(p)) return 'MID';
  return 'ATT'; // ST, CF, LW, RW, DC, EI, ED, etc.
}

export const SquadPitchView: React.FC<SquadPitchViewProps> = ({ manager }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<BoughtPlayer | null>(null);

  // Distribuir jugadores del manager en los 11 puestos del campo
  const squad = manager.squad || [];
  const assigned = new Map<SlotRole, BoughtPlayer>();
  const unassigned: BoughtPlayer[] = [...squad];

  // 1. Asignar Portero (GK)
  const gkIdx = unassigned.findIndex(p => categorizePlayer(p.version.posicion) === 'GK');
  if (gkIdx !== -1) {
    assigned.set('GK', unassigned.splice(gkIdx, 1)[0]);
  }

  // 2. Asignar Defensas
  const defSlots: SlotRole[] = ['LB', 'CB1', 'CB2', 'RB'];
  for (const slot of defSlots) {
    const idx = unassigned.findIndex(p => categorizePlayer(p.version.posicion) === 'DEF');
    if (idx !== -1) {
      assigned.set(slot, unassigned.splice(idx, 1)[0]);
    }
  }

  // 3. Asignar Mediocampistas
  const midSlots: SlotRole[] = ['LM', 'CM', 'RM'];
  for (const slot of midSlots) {
    const idx = unassigned.findIndex(p => categorizePlayer(p.version.posicion) === 'MID');
    if (idx !== -1) {
      assigned.set(slot, unassigned.splice(idx, 1)[0]);
    }
  }

  // 4. Asignar Delanteros
  const attSlots: SlotRole[] = ['LW', 'ST', 'RW'];
  for (const slot of attSlots) {
    const idx = unassigned.findIndex(p => categorizePlayer(p.version.posicion) === 'ATT');
    if (idx !== -1) {
      assigned.set(slot, unassigned.splice(idx, 1)[0]);
    }
  }

  // 5. Rellenar huecos vacíos con cualquier jugador sobrante
  for (const slot of PITCH_SLOTS) {
    if (!assigned.has(slot.role) && unassigned.length > 0) {
      assigned.set(slot.role, unassigned.shift()!);
    }
  }

  // Los que queden después de los 11 titulares van al banquillo
  const bench = unassigned;

  // Estadísticas del once
  const startingXI = Array.from(assigned.values());
  const averageGrl = startingXI.length > 0
    ? Math.round(startingXI.reduce((acc: number, p: BoughtPlayer) => acc + (p.version.grl || 100), 0) / startingXI.length)
    : 0;

  return (
    <div className="w-full flex flex-col items-center gap-6 select-none">
      {/* Barra de Química y Valoración del Escuadrón FUT */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 font-display text-xl shadow-md shadow-amber-400/20">
            {manager.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-lg text-amber-300 uppercase tracking-wide">
                {manager.name}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                FORMACIÓN 4-3-3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Escuadrón Oficial • {startingXI.length}/11 Titulares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 font-mono text-xs">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
              GRL PROMEDIO
            </span>
            <span className="text-xl font-black text-amber-400 font-display">
              {averageGrl || '--'}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
              INVERSIÓN TOTAL
            </span>
            <div className="flex items-center justify-center gap-1 font-black text-sm text-yellow-300">
              <StarTokenIcon size={14} />
              <span>{squad.reduce((acc: number, p: BoughtPlayer) => acc + p.paidPrice, 0)}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
              VALOR PLANTEL
            </span>
            <div className="flex items-center justify-center gap-1 font-black text-sm text-emerald-400">
              <StarTokenIcon size={14} />
              <span>{squad.reduce((acc: number, p: BoughtPlayer) => acc + p.version.value, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancha de Fútbol FUT 11 */}
      <div className="w-full max-w-4xl relative aspect-[3/4] sm:aspect-[4/5] md:aspect-[16/13] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-emerald-900">
        {/* Césped a rayas profesionales */}
        <div
          className="absolute inset-0 opacity-95 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)',
          }}
        />

        {/* Gradiente de viñeta para profundidad tipo estadio nocturno */}
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />

        {/* Líneas de marcación reglamentaria de la cancha (Blanco translúcido) */}
        <div className="absolute inset-4 sm:inset-6 border-2 border-white/40 rounded-xl pointer-events-none">
          {/* Línea de medio campo */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 -translate-y-1/2" />
          {/* Círculo central */}
          <div className="absolute top-1/2 left-1/2 w-28 h-28 sm:w-36 sm:h-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />

          {/* Área Grande Superior (Rival) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-20 sm:h-24 border-b-2 border-x-2 border-white/40 rounded-b-lg" />
          {/* Área Chica Superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-10 sm:h-12 border-b-2 border-x-2 border-white/40 rounded-b-sm" />

          {/* Área Grande Inferior (Propia) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-20 sm:h-24 border-t-2 border-x-2 border-white/40 rounded-t-lg" />
          {/* Área Chica Inferior */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-10 sm:h-12 border-t-2 border-x-2 border-white/40 rounded-t-sm" />
          {/* Punto de penalti inferior */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
        </div>

        {/* Renderizado de las 11 Posiciones en la Cancha */}
        {PITCH_SLOTS.map((slot) => {
          const player = assigned.get(slot.role);

          return (
            <div
              key={slot.role}
              style={{ top: slot.top, left: slot.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform hover:scale-110 z-10"
              onClick={() => player && setSelectedPlayer(player)}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  {/* Carta FC Mobile del Jugador */}
                  <div className="relative drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]">
                    <FCMobileThumbnail
                      cardBgUrl={player.version.cardBgUrl}
                      imageDataUrl={player.version.imageDataUrl}
                      grl={player.version.grl}
                      posicion={player.version.posicion}
                      playerName={player.playerName}
                      sizeClassName="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                    />
                  </div>

                  {/* Placa con Nombre y Posición en el Campo */}
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-black/85 border border-amber-400/40 shadow-lg text-center backdrop-blur-xs flex items-center gap-1">
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-400 font-display">
                      {player.version.posicion || slot.role}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase truncate max-w-[65px] sm:max-w-[90px] font-display">
                      {player.playerName}
                    </span>
                  </div>

                  {/* Badge de Compra con Ficha Estelar */}
                  <div className="mt-0.5 flex items-center gap-0.5 text-[8px] sm:text-[9px] font-mono font-black text-yellow-300 bg-slate-900/90 px-1.5 py-0.2 rounded-full border border-yellow-500/30 shadow-xs">
                    <StarTokenIcon size={10} />
                    <span>{player.paidPrice}</span>
                  </div>
                </div>
              ) : (
                /* Slot Vacío (Sin fichaje en esta posición) */
                <div className="flex flex-col items-center justify-center w-14 h-18 sm:w-16 sm:h-22 rounded-xl border-2 border-dashed border-white/35 bg-white/5 backdrop-blur-2xs text-white/60 transition-colors hover:border-amber-400/60 hover:text-amber-300">
                  <span className="text-xs sm:text-sm font-black font-display tracking-wider">
                    {slot.label}
                  </span>
                  <span className="text-[9px] text-white/40 uppercase mt-0.5">
                    Vacío
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Banquillo / Suplentes si el manager fichó más de 11 jugadores */}
      {bench.length > 0 && (
        <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h5 className="font-display font-black text-xs text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>BANQUILLO / SUPLENTES</span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-slate-800 text-slate-400 rounded-full">
                {bench.length} Fichajes
              </span>
            </h5>
            <span className="text-[10px] text-slate-500">
              Rotación disponible
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {bench.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPlayer(item)}
                className="flex-shrink-0 flex flex-col items-center p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-all hover:scale-105"
              >
                <FCMobileThumbnail
                  cardBgUrl={item.version.cardBgUrl}
                  imageDataUrl={item.version.imageDataUrl}
                  grl={item.version.grl}
                  posicion={item.version.posicion}
                  playerName={item.playerName}
                  sizeClassName="w-14 h-14"
                />
                <span className="text-[10px] font-black text-white uppercase truncate max-w-[70px] mt-1 font-display">
                  {item.playerName}
                </span>
                <div className="flex items-center gap-0.5 text-[9px] font-mono text-yellow-300 font-bold">
                  <StarTokenIcon size={10} />
                  <span>{item.paidPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Detalle de Jugador Seleccionado */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-slate-900 border border-amber-400/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 text-white relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center transition-all"
            >
              ✕
            </button>

            <h4 className="font-display font-black text-lg text-amber-300 uppercase tracking-wide text-center">
              Detalles del Fichaje
            </h4>

            <FCMobileThumbnail
              cardBgUrl={selectedPlayer.version.cardBgUrl}
              imageDataUrl={selectedPlayer.version.imageDataUrl}
              grl={selectedPlayer.version.grl}
              posicion={selectedPlayer.version.posicion}
              playerName={selectedPlayer.playerName}
              sizeClassName="w-32 h-32"
            />

            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Futbolista:</span>
                <strong className="text-white uppercase font-sans">{selectedPlayer.playerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Versión / Evento:</span>
                <span className="text-amber-400">{selectedPlayer.version.versionTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GRL Oficial:</span>
                <span className="text-yellow-400 font-bold">{selectedPlayer.version.grl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Posición:</span>
                <span className="text-cyan-400 font-bold">{selectedPlayer.version.posicion}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Precio Pagado:</span>
                <div className="flex items-center gap-1 font-black text-yellow-300">
                  <StarTokenIcon size={12} />
                  <span>{selectedPlayer.paidPrice} Fichas</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor de Mercado:</span>
                <div className="flex items-center gap-1 font-black text-emerald-400">
                  <StarTokenIcon size={12} />
                  <span>{selectedPlayer.version.value} Fichas</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 text-slate-950 font-black text-xs uppercase tracking-wider font-display transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
