import React, { useState } from 'react';
import { CardPlayStyle } from '../types';

// Diccionario oficial de traducción y símbolos en español para FC Mobile
export const PLAYSTYLE_SPANISH_INFO: Record<string, { title: string; desc: string; iconEmoji: string }> = {
  PLAYSTYLE_FINESSE_SHOT: {
    title: 'Tiro con Calidad',
    desc: 'Dispara tiros colocados con mayor efecto y precisión quirúrgica.',
    iconEmoji: '🎯',
  },
  PLAYSTYLE_POWER_SHOT: {
    title: 'Tiro Potente',
    desc: 'Ejecuta disparos balísticos a máxima velocidad y fuerza demoledora.',
    iconEmoji: '🚀',
  },
  PLAYSTYLE_CLINICAL_FINISHER: {
    title: 'Definición Clínica',
    desc: 'Efectividad letal dentro del área en situaciones de uno contra uno.',
    iconEmoji: '⚽',
  },
  PLAYSTYLE_CHIP_MASTER: {
    title: 'Vaselina / Cuchara',
    desc: 'Pica el balón sobre el arquero con sutileza y precisión milimétrica.',
    iconEmoji: '🥄',
  },
  PLAYSTYLE_TIKI_TAKA: {
    title: 'Tiki-Taka',
    desc: 'Pases de primera al primer toque con precisión rápida en corto.',
    iconEmoji: '🔄',
  },
  PLAYSTYLE_BULLET_PASS: {
    title: 'Pase Incisivo',
    desc: 'Filtra pases milimétricos que atraviesan las líneas rivales.',
    iconEmoji: '⚡',
  },
  PLAYSTYLE_LONG_PASS_MASTER: {
    title: 'Pase Largo',
    desc: 'Cambios de frente teledirigidos con precisión milimétrica a distancia.',
    iconEmoji: '📡',
  },
  PLAYSTYLE_TRICKSTER: {
    title: 'Fantasista',
    desc: 'Regates acrobáticos y habilidad única para desbordar defensores.',
    iconEmoji: '✨',
  },
  PLAYSTYLE_SPEED_DRIBBLER: {
    title: 'Regate Veloz',
    desc: 'Conducción supersónica del balón pegado al pie en velocidad.',
    iconEmoji: '🐆',
  },
  PLAYSTYLE_ACCELERATOR: {
    title: 'Paso Rápido',
    desc: 'Aceleración explosiva en el primer arranque para dejar atrás la marca.',
    iconEmoji: '⚡',
  },
  PLAYSTYLE_STAND_TACKLE_MASTER: {
    title: 'Anticipación',
    desc: 'Recupera el balón de pie sin cometer falta y con lectura perfecta.',
    iconEmoji: '🛡️',
  },
  PLAYSTYLE_HARD_TACKLE_MASTER: {
    title: 'Barrida Fuerte',
    desc: 'Entradas agresivas por el piso que desarman al delantero.',
    iconEmoji: '🪓',
  },
  PLAYSTYLE_AERIAL_DEFENSE: {
    title: 'Juego Aéreo',
    desc: 'Domina los balones divididos por aire con potencia de salto y testazo.',
    iconEmoji: '🦅',
  },
  PLAYSTYLE_INTIMIDATOR: {
    title: 'Fuerza Imponente',
    desc: 'Gana forcejeos físicos con potencia corporal y protección del balón.',
    iconEmoji: '💪',
  },
  PLAYSTYLE_WHIPPED_CROSSER: {
    title: 'Centrador con Rosca',
    desc: 'Envía centros venenosos con curva letal al corazón del área.',
    iconEmoji: '💫',
  },
  PLAYSTYLE_FAR_REACH: {
    title: 'Reflejos Felinos',
    desc: 'Estiradas espectaculares para desviar disparos a los ángulos.',
    iconEmoji: '🧤',
  },
  PLAYSTYLE_CROSS_CLAIMER: {
    title: 'Dueño del Área',
    desc: 'Intercepta centros aéreos con autoridad y seguridad total.',
    iconEmoji: '🏰',
  },
};

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

  const info = PLAYSTYLE_SPANISH_INFO[playstyle.name] || {
    title: playstyle.title || playstyle.name.replace('PLAYSTYLE_', '').replace(/_/g, ' '),
    desc: playstyle.description || 'Estilo de juego oficial de FC Mobile.',
    iconEmoji: '⚡',
  };

  const isPlus = playstyle.level === 2;

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 group cursor-pointer select-none ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((prev) => !prev)}
      title={`${info.title} (${isPlus ? 'PlayStyle+ Dorado' : 'PlayStyle Normal'}): ${info.desc}`}
    >
      {/* Insignia / Hexágono FC Mobile */}
      <div
        className={`relative ${sizeClasses} flex items-center justify-center rounded-lg font-black transition-transform duration-200 transform group-hover:scale-110 shadow-sm border ${
          isPlus
            ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 border-amber-200 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
            : 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border-slate-100 text-slate-900 shadow-slate-900/10'
        }`}
      >
        {playstyle.iconUrl ? (
          <img
            src={playstyle.iconUrl}
            alt={info.title}
            className="w-[80%] h-[80%] object-contain filter drop-shadow-xs pointer-events-none"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="leading-none">{info.iconEmoji}</span>
        )}

        {/* Plus badge "+" en la esquina superior si es dorado */}
        {isPlus && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-300 text-amber-950 text-[9px] font-black rounded-full flex items-center justify-center border border-amber-600 leading-none shadow-xs">
            +
          </span>
        )}
      </div>

      {showLabel && (
        <span
          className={`text-[11px] font-bold uppercase tracking-tight ${
            isPlus ? 'text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-slate-300'
          }`}
        >
          {info.title}
        </span>
      )}

      {/* Tooltip flotante */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-950/95 text-white text-[11px] rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md z-50 pointer-events-none animate-fade-in text-center">
          <div className="flex items-center justify-center gap-1 font-black text-amber-400 uppercase tracking-wide">
            <span>{info.iconEmoji}</span>
            <span>{info.title}</span>
            {isPlus && <span className="text-amber-300 font-extrabold">(PlayStyle+)</span>}
          </div>
          <p className="text-slate-300 text-[10px] mt-1 leading-snug">{info.desc}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
        </div>
      )}
    </div>
  );
};
