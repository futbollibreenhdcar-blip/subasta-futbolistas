import React, { useState } from 'react';
import { Tier } from '../types';

interface SilhouetteCardProps {
  imageDataUrl: string;
  tier: Tier;
  playerName?: string;
  versionTag?: string;
  value?: number;
  isRevealed: boolean;
  paidPrice?: number;
  winnerName?: string;
  className?: string;
}

export const SilhouetteCard: React.FC<SilhouetteCardProps> = ({
  imageDataUrl,
  tier,
  playerName,
  versionTag,
  value,
  isRevealed,
  paidPrice,
  winnerName,
  className = '',
}) => {
  // Modo de iluminación del fondo de silueta para que el usuario elija su contraste favorito
  const [stageLight, setStageLight] = useState<'pure-white' | 'stadium-spot' | 'warm-light'>('pure-white');

  // Configuración de estilo por Tier
  const tierConfig = {
    S: {
      label: 'Élite Mundial',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950',
      borderClass: 'border-amber-400/90 shadow-[0_12px_35px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/25',
      accentColor: 'text-amber-600',
    },
    A: {
      label: 'Estrella Top',
      badgeBg: 'bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950',
      borderClass: 'border-cyan-500/80 shadow-[0_12px_30px_rgba(6,182,212,0.2)] ring-2 ring-cyan-400/25',
      accentColor: 'text-cyan-700',
    },
    B: {
      label: 'Destacado',
      badgeBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      borderClass: 'border-blue-500/80 shadow-[0_10px_25px_rgba(59,130,246,0.15)] ring-2 ring-blue-400/20',
      accentColor: 'text-blue-700',
    },
    C: {
      label: 'Promesa / Regular',
      badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
      borderClass: 'border-emerald-500/80 shadow-[0_10px_25px_rgba(16,185,129,0.15)] ring-2 ring-emerald-400/20',
      accentColor: 'text-emerald-700',
    },
    D: {
      label: 'Regular',
      badgeBg: 'bg-slate-600 text-white',
      borderClass: 'border-slate-300 shadow-md',
      accentColor: 'text-slate-600',
    },
  }[tier] || {
    label: 'Futbolista',
    badgeBg: 'bg-slate-700 text-white',
    borderClass: 'border-slate-300 shadow-md',
    accentColor: 'text-slate-600',
  };

  // Fondo dinámico del estrado según el selector
  const stageBackground = {
    'pure-white': 'bg-white',
    'stadium-spot': 'bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_#f8fafc_55%,_#e2e8f0_100%)]',
    'warm-light': 'bg-[radial-gradient(ellipse_at_center,_#ffffff_0%,_#fefce8_65%,_#fef08a_100%)]',
  }[stageLight];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white border-2 transition-all duration-500 flex flex-col ${
        isRevealed
          ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-[0_14px_45px_rgba(251,191,36,0.35)] animate-trophy-reveal'
          : tierConfig.borderClass
      } ${className}`}
    >
      {/* 1. Cabecera de la Carta */}
      <div className="pt-3 px-4 pb-2.5 flex justify-between items-center bg-slate-50/95 border-b border-slate-200/80 z-10">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase font-display shadow-xs ${tierConfig.badgeBg}`}>
            TIER {tier}
          </span>
          <span className="text-xs font-black text-slate-700 uppercase tracking-wide hidden sm:inline font-display">
            {tierConfig.label}
          </span>
        </div>

        {/* Selector de luz de fondo durante la silueta */}
        {!isRevealed ? (
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg border border-slate-300/60 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setStageLight('pure-white')}
              className={`px-2 py-0.5 rounded transition-all ${
                stageLight === 'pure-white' ? 'bg-white text-slate-950 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fondo Blanco Puro 100%"
            >
              Blanco Puro
            </button>
            <button
              type="button"
              onClick={() => setStageLight('stadium-spot')}
              className={`px-2 py-0.5 rounded transition-all ${
                stageLight === 'stadium-spot' ? 'bg-white text-slate-950 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Foco Estadio Claro"
            >
              Foco Claro
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider animate-pulse font-display">
            <span>✨</span>
            <span>¡REVELADO!</span>
          </div>
        )}
      </div>

      {/* 2. Escenario de la Silueta: FONDO BLANCO LUMINOSO PARA MÁXIMA VISIBILIDAD */}
      <div 
        className={`relative w-full h-80 sm:h-96 md:h-104 flex items-center justify-center p-6 z-10 select-none overflow-hidden transition-colors duration-300 ${stageBackground}`}
      >
        {/* Marcador sutil de cancha en el fondo blanco */}
        <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
          <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full border-4 border-slate-200" />
          <div className="absolute w-full h-[1px] bg-slate-200" />
        </div>

        {/* Marca de agua de incógnito */}
        {!isRevealed && (
          <div className="absolute bottom-3 right-4 pointer-events-none select-none text-[11px] font-black uppercase tracking-widest text-slate-400 font-mono">
            SILUETA EN EL ESTRADO
          </div>
        )}

        {/* Capa 1: SILUETA 100% NEGRA SOBRE EL FONDO BLANCO */}
        <img
          src={imageDataUrl}
          alt="Silueta misteriosa del futbolista"
          className="max-h-full max-w-full object-contain brightness-0 drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)] transition-transform duration-300"
        />

        {/* Capa 2: FOTO A COLOR REVELADA */}
        <div
          className={`absolute inset-0 flex items-center justify-center p-6 transition-all duration-700 pointer-events-none ${
            isRevealed ? 'opacity-100 scale-105' : 'opacity-0'
          }`}
        >
          {isRevealed && (
            <img
              src={imageDataUrl}
              alt={playerName || 'Futbolista'}
              className="max-h-full max-w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]"
            />
          )}
        </div>
      </div>

      {/* 3. Pie de la Carta */}
      <div className="bg-white p-4 sm:p-5 border-t border-slate-100 z-10 text-center">
        {isRevealed ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight font-display">
                {playerName}
              </h3>
              <p className="text-xs font-black text-amber-600 uppercase tracking-widest mt-0.5">
                {versionTag}
              </p>
            </div>

            {/* Comparación de Valor Real vs Precio Pagado */}
            <div className="flex items-center justify-center gap-3 font-mono">
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-wider">VALOR REAL</span>
                <span className="text-lg font-black text-slate-900">${value}</span>
              </div>

              {paidPrice !== undefined && (
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-wider">PRECIO PAGADO</span>
                  <span className="text-lg font-black text-amber-600">${paidPrice}</span>
                </div>
              )}
            </div>

            {/* Veredicto de la Compra */}
            {paidPrice !== undefined && value !== undefined && (
              <div className="pt-1">
                {paidPrice > value ? (
                  <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold shadow-xs">
                    ⚠️ ¡SOBREPAGADO! Pagaste <span className="font-black text-rose-950">${paidPrice}</span> por un jugador de <span className="font-black text-rose-950">${value}</span> (Pérdida: -${paidPrice - value})
                  </div>
                ) : paidPrice < value ? (
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs">
                    🎉 ¡GANGA TOTAL! Pagaste <span className="font-black text-emerald-950">${paidPrice}</span> por un jugador de <span className="font-black text-emerald-950">${value}</span> (Ahorro: +${value - paidPrice})
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold">
                    ⚖️ PRECIO EXACTO: ${paidPrice}
                  </div>
                )}
                {winnerName && (
                  <p className="text-xs text-slate-600 mt-2 font-medium">
                    Adjudicado a: <strong className="text-amber-600 font-bold">{winnerName}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-1">
            <p className="text-xs uppercase tracking-widest text-slate-800 font-black font-display">
              ¿QUIÉN ES ESTE FUTBOLISTA?
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Observa el peinado, físico y postura de remate en el fondo blanco.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

