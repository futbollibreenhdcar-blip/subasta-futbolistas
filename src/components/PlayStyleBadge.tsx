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
  const rawId = React.useId();
  const uniqueId = rawId.replace(/[^a-zA-Z0-9]/g, '_');

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

  const badgeBorderGradId = `ps-border-${uniqueId}`;
  const badgeSilverGradId = `ps-silver-${uniqueId}`;
  const iconGradId = `ps-icon-gold-${uniqueId}`;

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
        {/* Fondo del Diamante oficial de FC Mobile */}
        <svg viewBox="0 0 256 256" className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <defs>
            <linearGradient id={badgeBorderGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDE7" />
              <stop offset="25%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="75%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id={badgeSilverGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Rombo exterior con fondo oscuro obsidiana y borde metálico grueso */}
          <path
            d="M128,14L242,128,128,242,14,128Z"
            fill={isPlus ? '#0B0A08' : '#0F172A'}
            stroke={isPlus ? `url(#${badgeBorderGradId})` : `url(#${badgeSilverGradId})`}
            strokeWidth={isPlus ? '18' : '14'}
            strokeLinejoin="round"
          />

          {/* Halo sutil de fondo para el Plus */}
          {isPlus && (
            <path
              d="M128,28L228,128,128,228,28,128Z"
              fill="#78350F"
              fillOpacity="0.3"
            />
          )}
        </svg>

        {/* Vector SVG Oficial del PlayStyle: EN DORADO RESPLANDECIENTE PARA EL PLUS Y BLANCO PARA NORMAL */}
        {officialDef && officialDef.paths.length > 0 ? (
          <svg
            viewBox={officialDef.viewBox}
            className={`relative z-10 ${svgSizes} transition-all pointer-events-none select-none ${
              isPlus
                ? 'drop-shadow-[0_0_4px_rgba(250,204,21,0.9)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]'
                : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
            }`}
          >
            {isPlus && (
              <defs>
                <linearGradient id={iconGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFBEB" />
                  <stop offset="25%" stopColor="#FEF08A" />
                  <stop offset="55%" stopColor="#FACC15" />
                  <stop offset="85%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
            )}
            {officialDef.paths.map((pathD, idx) => (
              <path
                key={idx}
                d={pathD}
                fill={isPlus ? `url(#${iconGradId}) #FACC15` : '#FFFFFF'}
                stroke={isPlus ? '#FDE047' : 'none'}
                strokeWidth={isPlus ? '0.4' : '0'}
                style={{
                  fill: isPlus ? `url(#${iconGradId})` : '#FFFFFF',
                  color: isPlus ? '#FACC15' : '#FFFFFF',
                }}
              />
            ))}
          </svg>
        ) : playstyle.iconUrl ? (
          <img
            src={playstyle.iconUrl}
            alt={title}
            className={`relative z-10 ${svgSizes} object-contain transition-all pointer-events-none select-none`}
            style={
              isPlus
                ? {
                    filter:
                      'brightness(0) saturate(100%) invert(80%) sepia(85%) saturate(1500%) hue-rotate(5deg) brightness(105%) contrast(105%) drop-shadow(0 0 4px rgba(250,204,21,0.9))',
                  }
                : {
                    filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  }
            }
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span
            className={`relative z-10 text-xs font-black select-none ${
              isPlus
                ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.9)]'
                : 'text-slate-100'
            }`}
          >
            ⚡
          </span>
        )}

        {/* Badge "+" oficial de PlayStyle+ en la esquina superior derecha */}
        {isPlus && (
          <span className="absolute -top-1 -right-1 z-20 w-4 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 leading-none shadow-[0_0_8px_rgba(245,158,11,0.95)] select-none">
            +
          </span>
        )}
      </div>

      {showLabel && (
        <span
          className={`text-[11px] font-black uppercase tracking-wider font-display truncate max-w-[130px] ${
            isPlus
              ? 'text-yellow-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]'
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
