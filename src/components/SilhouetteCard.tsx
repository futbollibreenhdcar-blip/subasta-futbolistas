import React from 'react';
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
  // Campos oficiales FC Mobile (RenderZ)
  cardBgUrl?: string;
  flagUrl?: string;
  clubUrl?: string;
  grl?: number;
  posicion?: string;
  evento?: string;
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
  cardBgUrl,
  flagUrl,
  clubUrl,
  grl = 100,
  posicion = 'ST',
  evento = 'FC Mobile',
}) => {
  // Configuración de estilo por Tier
  const tierConfig = {
    S: {
      label: 'Élite Mundial',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-md',
      glow: 'shadow-[0_0_35px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50',
      textAccent: 'text-amber-400',
    },
    A: {
      label: 'Estrella Top',
      badgeBg: 'bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 font-black shadow-md',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400/40',
      textAccent: 'text-cyan-400',
    },
    B: {
      label: 'Destacado',
      badgeBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black shadow-md',
      glow: 'shadow-[0_0_25px_rgba(59,130,246,0.35)] ring-2 ring-blue-400/30',
      textAccent: 'text-blue-400',
    },
    C: {
      label: 'Promesa',
      badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-md',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/30',
      textAccent: 'text-emerald-400',
    },
    D: {
      label: 'Regular',
      badgeBg: 'bg-slate-600 text-white font-black shadow-md',
      glow: 'shadow-lg ring-1 ring-slate-400/30',
      textAccent: 'text-slate-400',
    },
  }[tier] || {
    label: 'Futbolista',
    badgeBg: 'bg-slate-700 text-white font-black shadow-md',
    glow: 'shadow-lg ring-1 ring-slate-400/30',
    textAccent: 'text-slate-400',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 1. Header de Estado del Estrado */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl backdrop-blur-md shadow-md text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] uppercase tracking-wider font-display ${tierConfig.badgeBg}`}>
            TIER {tier}
          </span>
          <span className="text-slate-300 font-bold hidden sm:inline text-[11px] uppercase tracking-wide">
            {evento}
          </span>
        </div>

        {isRevealed ? (
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider animate-pulse shadow-sm">
            <span>✨</span>
            <span>¡CARTA REVELADA!</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold">SUBASTA A CIEGAS</span>
          </div>
        )}
      </div>

      {/* 2. CARTA AUTÉNTICA FC MOBILE (RENDERZ) */}
      <div
        className={`relative w-[300px] sm:w-[330px] h-[440px] sm:h-[480px] rounded-[32px] overflow-hidden transition-all duration-700 flex flex-col justify-between p-4 ${
          isRevealed
            ? 'ring-4 ring-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.55)] scale-[1.02] animate-trophy-reveal'
            : `${tierConfig.glow} shadow-2xl`
        }`}
      >
        {/* A. ARTE DE FONDO DEL EVENTO FC MOBILE (100% VISIBLE) */}
        {cardBgUrl ? (
          <img
            src={cardBgUrl}
            alt="Fondo de Carta de Evento FC Mobile"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black z-0" />
        )}

        {/* B. RECORTE DE ACCIÓN DEL JUGADOR (SILUETA NEGRA vs COLOR HD) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 p-4">
          <img
            src={imageDataUrl}
            alt={isRevealed ? playerName : 'Silueta del futbolista'}
            className={`max-h-[85%] max-w-[90%] object-contain transition-all duration-700 ${
              isRevealed
                ? 'scale-105 drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)] filter-none'
                : 'brightness-0 contrast-200 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]'
            }`}
          />
        </div>

        {/* C. COLUMNA SUPERIOR IZQUIERDA (GRL, POSICIÓN, BANDERA, CLUB) */}
        <div className="relative z-20 flex flex-col items-start gap-1.5 pt-2 pl-1">
          {/* C.1 GRL (RATING) */}
          {!isRevealed ? (
            <div
              className="bg-slate-950/95 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl flex items-center justify-center gap-1 backdrop-blur-md"
              title="GRL Oculto con Cuadro Negro"
            >
              <span className="text-amber-400 text-sm">🔒</span>
              <span className="text-slate-400 text-xs font-black font-mono tracking-widest">???</span>
            </div>
          ) : (
            <div className="flex flex-col items-start drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] animate-fade-in">
              <span className="text-4xl sm:text-5xl font-black font-display tracking-tighter bg-gradient-to-b from-white via-amber-100 to-amber-300 bg-clip-text text-transparent leading-none">
                {grl}
              </span>
            </div>
          )}

          {/* C.2 POSICIÓN */}
          {!isRevealed ? (
            <div
              className="bg-slate-950/95 border border-slate-700/80 rounded-lg px-2.5 py-1 shadow-xl flex items-center justify-center backdrop-blur-md"
              title="Posición Oculta con Cuadro Negro"
            >
              <span className="text-slate-400 text-[10px] font-black font-mono tracking-wider">POS</span>
            </div>
          ) : (
            <div className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-fade-in">
              <span className="text-sm sm:text-base font-black font-display text-white tracking-wider bg-slate-950/60 px-2 py-0.5 rounded-md border border-white/20">
                {posicion}
              </span>
            </div>
          )}

          {/* C.3 PAÍS (BANDERA) */}
          {!isRevealed ? (
            <div
              className="bg-slate-950/95 border border-slate-700/80 rounded-md w-9 h-6 shadow-xl flex items-center justify-center backdrop-blur-md"
              title="País Oculto con Cuadro Negro"
            >
              <span className="text-slate-500 text-[10px]">🏳️</span>
            </div>
          ) : flagUrl ? (
            <div className="w-9 h-6 rounded-md overflow-hidden border border-white/30 shadow-lg drop-shadow-md bg-slate-900/50 flex items-center justify-center animate-fade-in">
              <img src={flagUrl} alt="Bandera Nacional" className="w-full h-full object-cover" />
            </div>
          ) : null}

          {/* C.4 PROGRAMA / CLUB (ESCUDO) */}
          {!isRevealed ? (
            <div
              className="bg-slate-950/95 border border-slate-700/80 rounded-lg w-8 h-8 shadow-xl flex items-center justify-center backdrop-blur-md"
              title="Club/Programa Oculto con Cuadro Negro"
            >
              <span className="text-slate-500 text-xs">🛡️</span>
            </div>
          ) : clubUrl ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-lg drop-shadow-md bg-slate-900/50 p-0.5 flex items-center justify-center animate-fade-in">
              <img src={clubUrl} alt="Escudo de Club / Programa" className="w-full h-full object-contain" />
            </div>
          ) : null}
        </div>

        {/* D. PLACA INFERIOR DE NOMBRE Y EVENTO */}
        <div className="relative z-20 pb-2">
          {isRevealed ? (
            <div className="bg-slate-950/90 border-2 border-amber-400/80 rounded-2xl p-2.5 text-center shadow-2xl backdrop-blur-md animate-fade-in">
              <h3 className="text-xl sm:text-2xl font-black text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-300 bg-clip-text uppercase tracking-tight font-display drop-shadow-sm">
                {playerName}
              </h3>
              <p className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-widest mt-0.5">
                {versionTag || `${evento} • GRL ${grl} • ${posicion}`}
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl py-2 px-3 text-center shadow-2xl backdrop-blur-md">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest font-display flex items-center justify-center gap-1.5">
                <span>⚡</span>
                <span>¿QUIÉN ES ESTE CRACK?</span>
                <span>⚡</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Diseño de evento {evento} visible en la carta
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. RESUMEN FINANCIERO POST-REVELACIÓN */}
      {isRevealed && (
        <div className="w-full max-w-[330px] mt-4 space-y-3 animate-fade-in">
          {/* Comparación Valor vs Pagado */}
          <div className="grid grid-cols-2 gap-2.5 font-mono">
            <div className="bg-white/95 border border-slate-200 rounded-2xl p-2.5 text-center shadow-sm">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">VALOR REAL</span>
              <span className="text-xl font-black text-slate-900">${value}</span>
            </div>

            {paidPrice !== undefined && (
              <div className="bg-white/95 border border-slate-200 rounded-2xl p-2.5 text-center shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">PRECIO PAGADO</span>
                <span className="text-xl font-black text-amber-600">${paidPrice}</span>
              </div>
            )}
          </div>

          {/* Veredicto de Compra */}
          {paidPrice !== undefined && value !== undefined && (
            <div>
              {paidPrice > value ? (
                <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold text-center shadow-xs">
                  ⚠️ ¡SOBREPAGADO! Pagaste <span className="font-black text-rose-950">${paidPrice}</span> por un jugador de <span className="font-black text-rose-950">${value}</span> (Pérdida: -${paidPrice - value})
                </div>
              ) : paidPrice < value ? (
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center shadow-xs">
                  🎉 ¡GANGA TOTAL! Pagaste <span className="font-black text-emerald-950">${paidPrice}</span> por un jugador de <span className="font-black text-emerald-950">${value}</span> (Ahorro: +${value - paidPrice})
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-center shadow-xs">
                  ⚖️ ¡PRECIO EXACTO! Fichaje por ${paidPrice}
                </div>
              )}

              {winnerName && (
                <p className="text-xs text-slate-600 mt-2 text-center font-medium">
                  Adjudicado a: <strong className="text-amber-600 font-bold">{winnerName}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
