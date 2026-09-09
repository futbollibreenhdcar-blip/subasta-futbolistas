import React from 'react';
import { isSignedCard } from '../utils/cardUtils';

interface FCMobileThumbnailProps {
  cardBgUrl?: string;
  imageDataUrl?: string;
  grl?: number;
  posicion?: string;
  playerName?: string;
  className?: string;
  sizeClassName?: string;
}

export const FCMobileThumbnail: React.FC<FCMobileThumbnailProps> = ({
  cardBgUrl,
  imageDataUrl,
  grl,
  posicion,
  playerName,
  className = '',
  sizeClassName = 'w-14 h-14 sm:w-16 sm:h-16',
}) => {
  const isSigned = isSignedCard(cardBgUrl);

  return (
    <div
      className={`relative ${sizeClassName} aspect-square shrink-0 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-xs select-none ${className}`}
      title={playerName ? `${playerName} (GRL ${grl || '?'})` : undefined}
    >
      {/* 1. Fondo Oficial del Evento / Club (Marco Completo 1:1) */}
      {cardBgUrl && (
        <img
          src={cardBgUrl}
          alt="Card Background"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
          loading="lazy"
        />
      )}

      {/* 2. Recorte de Acción del Jugador (solo si no es carta firmada con arte integrado) */}
      {imageDataUrl && !isSigned && (
        <img
          src={imageDataUrl}
          alt={playerName || 'Futbolista'}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      )}

      {/* 3. GRL y Posición Oficiales de FC Mobile en la esquina superior izquierda */}
      {grl !== undefined && (
        <div className="absolute top-[6.5%] left-[16%] w-[20%] flex flex-col items-center justify-center leading-none z-20 pointer-events-none font-fcmobile">
          <span className="text-[11px] sm:text-xs font-bold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
            {grl}
          </span>
          {posicion && (
            <span className="text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] mt-0.5">
              {posicion}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
