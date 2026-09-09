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
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  }[size];

  // Identificador único para los gradientes SVG
  const gradientId = `gold-grad-${playstyle.name.replace(/[^a-zA-Z0-9]/g, '')}-${isPlus ? 'plus' : 'norm'}`;

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
        className={`relative ${containerSizes} flex items-center justify-center transition-all duration-200 group-hover:scale-110 active:scale-95 ${
          isPlus
            ? 'filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]'
            : 'filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]'
        }`}
      >
        {/* Fondo del Pentágono / Diamante oficial de FC Mobile con gradientes reales */}
        <svg viewBox="0 0 256 256" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id={`${gradientId}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id={`${gradientId}-silver`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id={`${gradientId}-icon`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FDE047" />
              <stop offset="80%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Rombo exterior con fondo oscuro obsidiana y borde metálico grueso */}
          <path
            d="M128,14L242,128,128,242,14,128Z"
            fill="#09090B"
            stroke={isPlus ? `url(#${gradientId}-border)` : `url(#${gradientId}-silver)`}
            strokeWidth={isPlus ? "18" : "14"}
            strokeLinejoin="round"
          />

          {/* Halo sutil de fondo para el Plus */}
          {isPlus && (
            <path
              d="M128,28L228,128,128,228,28,128Z"
              fill="#78350F"
              fillOpacity="0.35"
            />
          )}
        </svg>

        {/* Vector SVG Oficial del PlayStyle: EN DORADO RESPLANDECIENTE PARA EL PLUS Y BLANCO PARA NORMAL */}
        {officialDef && officialDef.paths.length > 0 ? (
          <svg
            viewBox={officialDef.viewBox}
            className={`relative z-10 ${svgSizes} filter transition-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}
          >
            {officialDef.paths.map((pathD, idx) => (
              <path
                key={idx}
                d={pathD}
                fill={isPlus ? `url(#${gradientId}-icon)` : '#FFFFFF'}
              />
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
          <span className={`relative z-10 text-xs font-black ${isPlus ? 'text-amber-400' : 'text-slate-100'}`}>
            ⚡
          </span>
        )}

        {/* Badge "+" oficial de PlayStyle+ en la esquina superior derecha */}
        {isPlus && (
          <span className="absolute -top-1 -right-1 z-20 w-4 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 leading-none shadow-[0_0_6px_rgba(245,158,11,0.9)]">
            +
          </span>
        )}
      </div>

      {showLabel && (
        <span
          className={`text-[11px] font-extrabold uppercase tracking-wider font-display truncate max-w-[130px] ${
            isPlus
              ? 'text-amber-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]'
              : 'text-slate-300 drop-shadow-xs'
          }`}
        >
          {title}
        </span>
      )}

      {/* Tooltip táctil y flotante oficial */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-52 p-3 bg-slate-950/95 text-white text-xs rounded-2xl border-2 border-amber-400/80 shadow-2xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-center">
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
