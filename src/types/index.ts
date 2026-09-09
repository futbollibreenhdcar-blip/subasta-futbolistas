export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export type DeckType = 'leyendas' | 'estrellas_actuales' | 'arqueros' | 'retirados' | 'mixto';

export interface CardPlayStyle {
  id?: number;
  name: string;          // ej. "PLAYSTYLE_FINESSE_SHOT"
  title: string;         // ej. "Tiro con Calidad"
  description?: string;  // ej. "Realiza tiros colocados con mayor efecto y precisión."
  iconUrl?: string;      // URL del icono de RenderZ o SVG
  level: 1 | 2;          // 1: Estándar (plata), 2: PlayStyle+ (dorado)
}

export interface PlayerVersion {
  id: string;             // UUID único de la versión
  versionTag: string;     // ej. "TOTS 26 - Real Madrid"
  tier: Tier;             // S, A, B, C, D
  value: number;          // Valor numérico estimado (ej. 95)
  decks: DeckType[];      // Mazos a los que pertenece (puede ser más de uno)
  imageDataUrl: string;   // Recorte de acción del jugador (FC Mobile PNG)
  cardBgUrl?: string;     // Arte de fondo del evento de FC Mobile
  flagUrl?: string;       // Bandera del país
  clubUrl?: string;       // Escudo de club o programa
  grl?: number;           // Media oficial FC Mobile (ej. 120)
  posicion?: string;      // Posición (ST, CB, RW, etc.)
  evento?: string;        // Nombre del evento (TOTS, Icons, Heroes, etc.)
  playstyles?: CardPlayStyle[]; // Rasgos / Estilos de juego oficiales
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

export type AppView =
  | 'setup'
  | 'auction'
  | 'gameover'
  | 'management'
  | 'import'
  | 'admin'
  | 'host_online'
  | 'player_online';

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
