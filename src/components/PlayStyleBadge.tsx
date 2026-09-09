import React, { useState } from 'react';
import { CardPlayStyle } from '../types';
import { getOfficialPlayStyle, PlayStyleVectorDef } from '../data/officialPlayStyleIcons';

interface PlayStyleBadgeProps {
  playstyle: CardPlayStyle;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PlayStyleBadge: React.FC<PlayStyleBadgeProps> = ({
  playstyle,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Buscar definición oficial de EA SPORTS FC / FC Mobile
  const officialDef: PlayStyleVectorDef | null =
    getOfficialPlayStyle(playstyle.name) ||
    (playstyle.title ? getOfficialPlayStyle(playstyle.title) : null);

  const title = officialDef?.title || playstyle.title || playstyle.name.replace(/^PLAYSTYLE_/, '').replace(/_/g, ' ');
  const description = officialDef?.description || playstyle.description || 'Estilo de juego oficial de FC Mobile.';
  const isPlus = playstyle.level === 2;

  const containerSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const svgSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 group cursor-pointer select-none ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((prev) => !prev)}
      title={`${title} (${isPlus ? 'PlayStyle+ Dorado' : 'PlayStyle Normal'}): ${description}`}
    >
      {/* Insignia Oficial FC Mobile (Rombo / Diamante Clásico del Juego) */}
      <div
        className={`relative ${containerSizes} flex items-center justify-center transition-all duration-200 group-hover:scale-110 active:scale-95`}
      >
        {/* Fondo del Pentágono / Diamante oficial de FC Mobile */}
        <svg
          viewBox="0 0 256 256"
          className={`absolute inset-0 w-full h-full drop-shadow-md transition-all ${
            isPlus
              ? 'text-amber-500 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]'
              : 'text-slate-700/90 filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Contorno y relleno del rombo oficial */}
          <path
            d="M128,12.808L243.192,128,128,243.192,12.808,128Z"
            className={isPlus ? 'fill-amber-400 stroke-amber-200' : 'fill-slate-800 stroke-slate-500'}
            strokeWidth="10"
            strokeLinejoin="round"
          />
          {/* Brillo interno si es PlayStyle+ */}
          {isPlus && (
            <path
              d="M128,24L232,128,128,232,24,128Z"
              className="fill-gradient-to-b from-amber-300 via-amber-500 to-amber-600 opacity-90"
            />
          )}
        </svg>

        {/* Vector SVG Oficial del PlayStyle */}
        {officialDef && officialDef.paths.length > 0 ? (
          <svg
            viewBox={officialDef.viewBox}
            className={`relative z-10 ${svgSizes} ${
              isPlus ? 'text-slate-950 drop-shadow-xs' : 'text-slate-100 drop-shadow-xs'
            }`}
            fill="currentColor"
          >
            {officialDef.paths.map((pathD, idx) => (
              <path key={idx} d={pathD} fill="currentColor" />
            ))}
          </svg>
        ) : playstyle.iconUrl ? (
          <img
            src={playstyle.iconUrl}
            alt={title}
            className={`relative z-10 ${svgSizes} object-contain`}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span className={`relative z-10 text-xs font-black ${isPlus ? 'text-slate-950' : 'text-slate-100'}`}>
            ⚡
          </span>
        )}

        {/* Badge "+" oficial de PlayStyle+ en la esquina superior derecha */}
        {isPlus && (
          <span className="absolute -top-1 -right-1 z-20 w-3.5 h-3.5 bg-gradient-to-br from-yellow-300 to-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center border border-amber-200 leading-none shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            +
          </span>
        )}
      </div>

      {showLabel && (
        <span
          className={`text-[11px] font-extrabold uppercase tracking-wider font-display truncate max-w-[130px] ${
            isPlus
              ? 'text-amber-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'text-slate-300 drop-shadow-xs'
          }`}
        >
          {title}
        </span>
      )}

      {/* Tooltip táctil y flotante oficial */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-52 p-3 bg-slate-950/95 text-white text-xs rounded-2xl border-2 border-amber-400/60 shadow-2xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-center">
          <div className="flex items-center justify-center gap-1.5 font-black uppercase tracking-wider font-display">
            <span className={isPlus ? 'text-amber-400' : 'text-slate-200'}>{title}</span>
            {isPlus && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black">
                PLUS+
              </span>
            )}
          </div>
          <p className="text-slate-300 text-[10px] mt-1.5 leading-relaxed font-sans">{description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
        </div>
      )}
    </div>
  );
};

export default PlayStyleBadge;
