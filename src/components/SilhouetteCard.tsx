import React from 'react';
import { Tier, CardPlayStyle } from '../types';
import { StarTokenIcon } from './StarTokenIcon';
import { PlayStyleBadge } from './PlayStyleBadge';

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
  playstyles?: CardPlayStyle[];
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
  playstyles = [],
}) => {
  // Estado para fallback de imagen de club
  const [clubImgFailed, setClubImgFailed] = React.useState(false);

  // Configuración de estilo por Tier
  const tierConfig = {
    S: {
      label: 'Élite Mundial',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black shadow-md',
      glow: 'shadow-[0_0_35px_rgba(245,158,11,0.35)]',
    },
    A: {
      label: 'Estrella Top',
      badgeBg: 'bg-gradient-to-r from-cyan-400 to-blue-400 text-slate-950 font-black shadow-md',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    },
    B: {
      label: 'Figura Consolidada',
      badgeBg: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black shadow-md',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    },
    C: {
      label: 'Talento Destacado',
      badgeBg: 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-black shadow-md',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    },
    D: {
      label: 'Regular',
      badgeBg: 'bg-slate-600 text-white font-black shadow-md',
      glow: 'shadow-lg',
    },
  }[tier] || {
    label: 'Futbolista',
    badgeBg: 'bg-slate-700 text-white font-black shadow-md',
    glow: 'shadow-lg',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 1. Header de Estado del Estrado (PROGRAMA SIEMPRE VISIBLE EN MÓVIL Y ESCRITORIO) */}
      <div className="w-full max-w-[360px] flex items-center justify-between px-3 py-1.5 mb-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl backdrop-blur-md shadow-md text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] uppercase tracking-wider font-display ${tierConfig.badgeBg}`}>
            TIER {tier}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black text-amber-300 bg-slate-800 border border-amber-400/30 uppercase tracking-wide">
            {evento}
          </span>
        </div>

        {isRevealed ? (
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider animate-pulse shadow-sm">
            <span>✨</span>
            <span>¡CARTA REVELADA!</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold">SUBASTA A CIEGAS</span>
          </div>
        )}
      </div>

      {/* 2. CARTA CUADRADA AUTÉNTICA FC MOBILE (RENDERZ 256x256 CANVAS) */}
      <div
        className={`relative w-72 h-72 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] aspect-square transition-all duration-700 ${
          isRevealed ? 'scale-105 filter drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]' : tierConfig.glow
        }`}
      >
        {/* A. FONDO DE LA CARTA (LA CARTA SOLA SIN CORTES) */}
        {cardBgUrl && (
          <img
            src={cardBgUrl}
            alt="Carta FC Mobile"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
          />
        )}

        {/* B. RECORTE DE ACCIÓN DEL JUGADOR (MISMO TAMAÑO EXACTO QUE LA CARTA, SIN ACHICAR NI PADDING) */}
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt={isRevealed ? playerName : 'Silueta del futbolista'}
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-10 transition-all duration-500 ${
              isRevealed
                ? 'filter-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]'
                : 'brightness-0 contrast-200 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]'
            }`}
          />
        )}

        {/* C. CENSURA CON RECTÁNGULOS NEGROS DURANTE LA PUJA (!isRevealed) */}
        {!isRevealed ? (
          <>
            {/* C1. RECTÁNGULO NEGRO TAPANDO GRL Y POSICIÓN (ARRIBA A LA IZQUIERDA) */}
            <div
              className="absolute top-[6%] left-[15%] w-[22%] h-[27%] bg-black/95 border border-slate-800/80 rounded-xl shadow-2xl flex flex-col items-center justify-center pointer-events-none z-20 backdrop-blur-xs"
              title="GRL y Posición Ocultos con Cuadro Negro"
            >
              <span className="text-amber-400 text-base">🔒</span>
              <span className="text-[10px] text-slate-400 font-mono font-black tracking-widest mt-0.5">???</span>
            </div>

            {/* C2. RECTÁNGULO NEGRO TAPANDO BANDERA, CLUB, PROGRAMA Y NOMBRE (ZONA INFERIOR) */}
            <div
              className="absolute top-[67%] left-[17%] w-[66%] h-[19%] bg-black/95 border border-slate-800/80 rounded-xl shadow-2xl flex items-center justify-center pointer-events-none z-20 px-2 text-center backdrop-blur-xs"
              title="País, Club, Programa y Nombre Ocultos con Cuadro Negro"
            >
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider font-display">
                  ⚡ ¿QUIÉN ES? ⚡
                </span>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">
                  [ CARTA OCULTA ]
                </span>
              </div>
            </div>
          </>
        ) : (
          /* D. ELEMENTOS REVELADOS EN ALTA DEFINICIÓN EN SUS POSICIONES OFICIALES */
          <>
            {/* D1 & D2. GRL Y POSICIÓN OFICIALES FC MOBILE (TEXTO BLANCO PURO APILADO SIN FONDOS) */}
            <div className="absolute top-[6.5%] left-[16%] w-[20%] flex flex-col items-center justify-center leading-none pointer-events-none z-20 font-fcmobile select-none animate-fade-in">
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {grl}
              </span>
              <span className="text-xs sm:text-sm md:text-base font-bold text-white uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] mt-0.5">
                {posicion}
              </span>
            </div>

            {/* D3. BANDERA NACIONAL (ALTA DEFINICIÓN) */}
            {flagUrl && (
              <div className="absolute top-[74.5%] left-[23%] w-[13%] h-[8%] z-20 pointer-events-none rounded-md overflow-hidden border border-white/40 shadow-lg animate-fade-in bg-slate-900 flex items-center justify-center">
                <img
                  src={flagUrl}
                  alt="Bandera"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* D4. ESCUDO DE CLUB / LOGO DEL PROGRAMA (CON FALLBACK ROBUSTO) */}
            {clubUrl && !clubImgFailed && !clubUrl.includes('renderz.app') ? (
              <div className="absolute top-[74.5%] left-[64%] w-[13%] h-[8%] z-20 pointer-events-none p-0.5 flex items-center justify-center animate-fade-in">
                <img
                  src={clubUrl}
                  alt="Club"
                  className="w-full h-full object-contain drop-shadow-md"
                  onError={() => setClubImgFailed(true)}
                />
              </div>
            ) : (
              <div className="absolute top-[75%] left-[63%] z-20 pointer-events-none px-2 py-0.5 rounded-md bg-black/90 border border-amber-400/50 text-[8px] sm:text-[9px] font-black text-amber-300 uppercase tracking-wider font-display shadow-md animate-fade-in truncate max-w-[90px]">
                {evento}
              </div>
            )}

            {/* D5. NOMBRE DEL JUGADOR ESTILO FC MOBILE */}
            <div className="absolute top-[68%] left-0 right-0 z-20 pointer-events-none text-center px-4 animate-fade-in">
              <span className="inline-block bg-black/85 backdrop-blur-xs px-3.5 py-0.5 rounded-lg border border-white/20 text-xs sm:text-sm font-bold text-white uppercase tracking-wide font-fcmobile drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {playerName}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. RESUMEN FINANCIERO POST-REVELACIÓN */}
      {isRevealed && (
        <div className="w-full max-w-[350px] mt-4 space-y-2.5 animate-fade-in">
          {/* Tag de la Carta */}
          <div className="text-center">
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest font-display">
              {versionTag || `${evento} • GRL ${grl} • ${posicion}`}
            </span>
          </div>

          {/* Rasgos / PlayStyles Oficiales FC Mobile */}
          {playstyles && playstyles.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-inner backdrop-blur-xs">
              <div className="w-full text-center mb-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-display">
                  PLAYSTYLES OFICIALES
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {playstyles.map((ps, idx) => (
                  <PlayStyleBadge key={idx} playstyle={ps} size="md" showLabel={true} />
                ))}
              </div>
            </div>
          )}

          {/* Comparación Valor vs Pagado */}
          <div className="grid grid-cols-2 gap-2.5 font-mono">
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">VALOR REAL</span>
              <span className="text-xl font-black text-slate-900 flex items-center justify-center gap-1">
                <StarTokenIcon size={18} />
                {value}
              </span>
            </div>

            {paidPrice !== undefined && (
              <div className="bg-white border border-slate-200 rounded-2xl p-2.5 text-center shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">PRECIO PAGADO</span>
                <span className="text-xl font-black text-amber-600 flex items-center justify-center gap-1">
                  <StarTokenIcon size={18} />
                  {paidPrice}
                </span>
              </div>
            )}
          </div>

          {/* Veredicto de Compra */}
          {paidPrice !== undefined && value !== undefined && (
            <div>
              {paidPrice > value ? (
                <div className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1">
                  <span>⚠️ ¡SOBREPAGADO! Pagaste</span>
                  <StarTokenIcon size={12} />
                  <span className="font-black text-rose-950">{paidPrice}</span>
                  <span>por un jugador de</span>
                  <StarTokenIcon size={12} />
                  <span className="font-black text-rose-950">{value}</span>
                  <span>(Pérdida: -{paidPrice - value})</span>
                </div>
              ) : paidPrice < value ? (
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1">
                  <span>🎉 ¡GANGA TOTAL! Pagaste</span>
                  <StarTokenIcon size={12} />
                  <span className="font-black text-emerald-950">{paidPrice}</span>
                  <span>por un jugador de</span>
                  <StarTokenIcon size={12} />
                  <span className="font-black text-emerald-950">{value}</span>
                  <span>(Ahorro: +{value - paidPrice})</span>
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1">
                  <span>⚖️ ¡PRECIO EXACTO! Fichaje por</span>
                  <StarTokenIcon size={12} />
                  <span>{paidPrice} Fichas</span>
                </div>
              )}

              {winnerName && (
                <p className="text-xs text-slate-600 mt-1.5 text-center font-medium">
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
