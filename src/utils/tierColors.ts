import { Tier } from '../types';

export interface TierStyle {
  tier: Tier;
  name: string;
  category: 'Dorado' | 'Plata' | 'Bronce';
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  shadowClass: string;
  glowColor: string;
  cardBg: string;
}

export function getTierStyle(tier: Tier): TierStyle {
  switch (tier) {
    case 'S':
      return {
        tier: 'S',
        name: 'Tier S (Élite Mundial)',
        category: 'Dorado',
        borderColor: 'border-amber-400',
        badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-300',
        badgeText: 'text-slate-950 font-black',
        shadowClass: 'shadow-[0_0_35px_rgba(251,191,36,0.5)] border-amber-400',
        glowColor: 'rgba(251, 191, 36, 0.4)',
        cardBg: 'from-amber-950/40 via-slate-900/90 to-slate-950',
      };
    case 'A':
    case 'B':
      return {
        tier,
        name: `Tier ${tier} (Estrella)`,
        category: 'Plata',
        borderColor: 'border-slate-300',
        badgeBg: 'bg-gradient-to-r from-slate-200 to-slate-400',
        badgeText: 'text-slate-900 font-bold',
        shadowClass: 'shadow-[0_0_30px_rgba(226,232,240,0.45)] border-slate-300',
        glowColor: 'rgba(226, 232, 240, 0.35)',
        cardBg: 'from-slate-800/40 via-slate-900/90 to-slate-950',
      };
    case 'C':
    case 'D':
    default:
      return {
        tier,
        name: `Tier ${tier} (Promesa / Regular)`,
        category: 'Bronce',
        borderColor: 'border-amber-700',
        badgeBg: 'bg-gradient-to-r from-amber-700 to-orange-600',
        badgeText: 'text-amber-100 font-bold',
        shadowClass: 'shadow-[0_0_25px_rgba(180,83,9,0.4)] border-amber-700',
        glowColor: 'rgba(180, 83, 9, 0.3)',
        cardBg: 'from-amber-950/30 via-slate-900/90 to-slate-950',
      };
  }
}

export const DECK_LABELS: Record<string, string> = {
  leyendas: 'Leyendas',
  estrellas_actuales: 'Estrellas actuales',
  arqueros: 'Arqueros',
  retirados: 'Retirados',
  mixto: 'Mixto (Todos)',
};
