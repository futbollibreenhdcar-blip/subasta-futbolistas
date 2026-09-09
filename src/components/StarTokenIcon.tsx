import React from 'react';

interface StarTokenIconProps {
  className?: string;
  size?: number | string;
}

/**
 * Ficha Estelar oficial de FC Mobile (Star Pass Token).
 * Moneda metálica dorada con bisel facetado, núcleo azul radiante y estrella dorada 3D en relieve.
 */
export const StarTokenIcon: React.FC<StarTokenIconProps> = ({
  className = 'inline-block align-middle',
  size = 18,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: '-0.15em' }}
    >
      <defs>
        {/* Bisel dorado exterior */}
        <linearGradient id="tokenGoldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2A3" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#AA7A1E" />
          <stop offset="100%" stopColor="#5E3F05" />
        </linearGradient>

        {/* Núcleo de energía azul radiante */}
        <radialGradient id="tokenCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4DEEEA" />
          <stop offset="45%" stopColor="#0EA5E9" />
          <stop offset="85%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#082F49" />
        </radialGradient>

        {/* Estrella facetada en relieve 3D */}
        <linearGradient id="starGoldHighlight" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="60%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        {/* Sombra de la moneda */}
        <filter id="tokenShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Sombra y Aro Exterior */}
      <g filter="url(#tokenShadow)">
        <circle cx="24" cy="24" r="22" fill="url(#tokenGoldBorder)" stroke="#FFE885" strokeWidth="1" />
        {/* Aro interior biselado */}
        <circle cx="24" cy="24" r="19" fill="#2E1C02" stroke="#AA7A1E" strokeWidth="0.8" />
        {/* Disco interior radiante */}
        <circle cx="24" cy="24" r="17" fill="url(#tokenCoreGlow)" />
        {/* Anillo de cristal translúcido */}
        <circle cx="24" cy="24" r="17" stroke="#A5F3FC" strokeWidth="0.75" strokeOpacity="0.6" fill="none" />
      </g>

      {/* Muescas decorativas en el borde de la moneda */}
      <circle cx="24" cy="4" r="1" fill="#FFF2A3" />
      <circle cx="44" cy="24" r="1" fill="#FFF2A3" />
      <circle cx="24" cy="44" r="1" fill="#AA7A1E" />
      <circle cx="4" cy="24" r="1" fill="#FFE885" />

      {/* Estrella 3D Facetada en el centro */}
      {/* Faceta Iluminada (Izquierda / Arriba) */}
      <polygon
        points="24,10 27,21 39,21 29.5,28 33,39 24,32 15,39 18.5,28 9,21 21,21"
        fill="url(#starGoldHighlight)"
        stroke="#FFFBEB"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Sombra de relieve interior para aspecto 3D */}
      <polygon
        points="24,10 24,32 33,39 29.5,28 39,21 27,21"
        fill="#000000"
        fillOpacity="0.18"
      />
      {/* Punto de destello central */}
      <circle cx="24" cy="23" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
    </svg>
  );
};
