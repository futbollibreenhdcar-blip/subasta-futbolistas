export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export type DeckType = 'leyendas' | 'estrellas_actuales' | 'arqueros' | 'retirados' | 'mixto';

export interface PlayerVersion {
  id: string;             // UUID único de la versión
  versionTag: string;     // ej. "Prime 2016 - Juventus"
  tier: Tier;             // S, A, B, C, D
  value: number;          // Valor numérico estimado (ej. 95)
  decks: DeckType[];      // Mazos a los que pertenece (puede ser más de uno)
  imageDataUrl: string;   // PNG transparente base64
  posicionPista?: string;
  continentePista?: string;
  decadaPista?: string;
  revisar?: boolean;
  createdAt: number;
}

export interface Player {
  id: string;             // UUID único del jugador
  name: string;           // Nombre real (ej. "Gianluigi Buffon")
  createdAt: number;
  versions: PlayerVersion[];
}

export interface Buyer {
  id: string;
  name: string;
  budget: number;
  initialBudget: number;
  squad: BoughtPlayer[];
}

export interface BoughtPlayer {
  playerId: string;
  playerName: string;
  version: PlayerVersion;
  paidPrice: number;
  roundNumber: number;
}

export interface AuctionGameConfig {
  buyers: Array<{ id: string; name: string }>;
  initialBudget: number;
  targetSquadSize: number;
  minIncrement: number;
  selectedDeck: DeckType;
}

export type AppView = 'setup' | 'auction' | 'gameover' | 'management' | 'import' | 'admin';

export interface SportsApiPlayer {
  idPlayer: string;
  strPlayer: string;
  strTeam?: string;
  strNationality?: string;
  strPosition?: string;
  strThumb?: string | null;
  strCutout?: string | null;
}

export interface CurrentRoundState {
  roundNumber: number;
  player: Player;
  version: PlayerVersion;
  currentBid: number;
  highestBidderId: string | null;
  currentTurnBuyerIndex: number;
  consecutivePasses: number;
  isDesierta: boolean;
  isClosed: boolean;
  isRevealed: boolean;
  purchasedClue?: {
    type: 'posicion' | 'continente' | 'decada';
    label: string;
    buyerName: string;
  } | null;
}
