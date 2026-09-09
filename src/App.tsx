import React, { useState, useEffect } from 'react';
import { Player, AppView, AuctionGameConfig, Buyer, DeckType } from './types';
import { fetchPlayersFromSupabase } from './services/supabasePlayers';
import {
  createRoom,
  joinRoom,
  RoomState,
  RoomParticipant,
} from './services/realtimeRoom';
import { Navbar } from './components/Navbar';
import { SetupScreen } from './components/SetupScreen';
import { AuctionScreen } from './components/AuctionScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { OnlineRoomScreen } from './components/OnlineRoomScreen';

export const App: React.FC = () => {
  // Detectar si la URL contiene código de sala (?sala=XXXX o ?code=XXXX)
  const urlParams = new URLSearchParams(window.location.search);
  const initialJoinCode = urlParams.get('sala') || urlParams.get('code') || undefined;

  const [currentView, setCurrentView] = useState<AppView>('setup');

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<AuctionGameConfig | null>(null);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [gameOverData, setGameOverData] = useState<{
    buyers: Buyer[];
    endReason: string;
  } | null>(null);

  // Estados de Partida Online en Tiempo Real
  const [onlineRoom, setOnlineRoom] = useState<RoomState | null>(null);
  const [onlineParticipant, setOnlineParticipant] = useState<RoomParticipant | null>(null);

  // Cargar jugadores desde Supabase
  const fetchPlayers = async () => {
    try {
      const data = await fetchPlayersFromSupabase();
      setPlayers(data);
    } catch (err) {
      console.error('Error al obtener jugadores de Supabase:', err);
    }
  };

  useEffect(() => {
    fetchPlayers();

    // Intentar reconectar si se recargó la página en el celular
    const savedCode = sessionStorage.getItem('subasta_room_code');
    const savedName = sessionStorage.getItem('subasta_participant_name');
    if (savedCode && savedName) {
      joinRoom(savedCode, savedName)
        .then(({ participant, room }) => {
          setOnlineRoom(room);
          setOnlineParticipant(participant);
          setCurrentView('online_room');
        })
        .catch(() => {
          sessionStorage.removeItem('subasta_room_code');
          sessionStorage.removeItem('subasta_participant_name');
        });
    }
  }, []);

  // Al iniciar partida local tradicional
  const handleStartLocalGame = async (config: AuctionGameConfig) => {
    try {
      const deckPlayers = await fetchPlayersFromSupabase(config.selectedDeck);
      setGameConfig(config);
      setGamePlayers(deckPlayers);
      setCurrentView('auction');
    } catch (err: any) {
      alert('Error al cargar jugadores desde Supabase: ' + err.message);
    }
  };

  // Crear sala online donde el Host TAMBIÉN juega en su propio dispositivo
  const handleCreateOnlineRoom = async (config: {
    hostName: string;
    initialBudget: number;
    minIncrement: number;
    selectedDeck: DeckType;
  }) => {
    try {
      const { room, hostParticipant } = await createRoom(config);
      setOnlineRoom(room);
      setOnlineParticipant(hostParticipant);
      sessionStorage.setItem('subasta_room_code', room.codigo);
      sessionStorage.setItem('subasta_participant_name', hostParticipant.name);
      setCurrentView('online_room');
    } catch (err: any) {
      alert('Error al crear sala online: ' + err.message);
    }
  };

  // Unirse a una sala online desde el celular o navegador
  const handleJoinOnlineRoom = async (code: string, playerName: string) => {
    try {
      const { participant, room } = await joinRoom(code, playerName);
      setOnlineRoom(room);
      setOnlineParticipant(participant);
      sessionStorage.setItem('subasta_room_code', room.codigo);
      sessionStorage.setItem('subasta_participant_name', participant.name);
      setCurrentView('online_room');
    } catch (err: any) {
      alert('No se pudo conectar a la sala: ' + err.message);
    }
  };

  const handleGameOver = (finalBuyers: Buyer[], endReason: string) => {
    setGameOverData({ buyers: finalBuyers, endReason });
    setCurrentView('gameover');
  };

  const handlePlayAgain = () => {
    setGameOverData(null);
    setOnlineRoom(null);
    setOnlineParticipant(null);
    setCurrentView('setup');
  };

  const handleAbortGame = () => {
    setGameOverData(null);
    setOnlineRoom(null);
    setOnlineParticipant(null);
    setCurrentView('setup');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900 selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden font-sans">
      {/* Luces de estadio ambiental de fondo diurno */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl" />
      </div>

      {/* No mostrar Navbar en la pantalla de juego online para maximizar espacio táctil en celular */}
      {currentView !== 'online_room' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          totalPlayersCount={players.length}
        />
      )}

      <main className="flex-1 relative z-10">
        {currentView === 'setup' && (
          <SetupScreen
            players={players}
            onStartGame={handleStartLocalGame}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            initialJoinCode={initialJoinCode}
          />
        )}

        {/* Pantalla Unificada Online (Cada jugador en su propio Celular o PC) */}
        {currentView === 'online_room' && onlineRoom && onlineParticipant && (
          <OnlineRoomScreen
            initialRoom={onlineRoom}
            participant={onlineParticipant}
            allPlayers={players}
            onExit={() => {
              sessionStorage.removeItem('subasta_room_code');
              sessionStorage.removeItem('subasta_participant_name');
              setOnlineRoom(null);
              setOnlineParticipant(null);
              setCurrentView('setup');
            }}
          />
        )}

        {currentView === 'auction' && gameConfig && (
          <AuctionScreen
            config={gameConfig}
            allPlayers={gamePlayers.length > 0 ? gamePlayers : players}
            onGameOver={handleGameOver}
            onAbortGame={handleAbortGame}
          />
        )}

        {currentView === 'gameover' && gameOverData && (
          <GameOverScreen
            buyers={gameOverData.buyers}
            endReason={gameOverData.endReason}
            onPlayAgain={handlePlayAgain}
            onGoToManagement={handlePlayAgain}
          />
        )}
      </main>
    </div>
  );
};

export default App;
