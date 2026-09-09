import React, { useState, useEffect } from 'react';
import { Player, AppView, AuctionGameConfig, Buyer } from './types';
import { fetchPlayersFromSupabase } from './services/supabasePlayers';
import { Navbar } from './components/Navbar';
import { SetupScreen } from './components/SetupScreen';
import { ManagementScreen } from './components/ManagementScreen';
import { ImportScreen } from './components/ImportScreen';
import { AdminScreen } from './components/AdminScreen';
import { AuctionScreen } from './components/AuctionScreen';
import { GameOverScreen } from './components/GameOverScreen';

export const App: React.FC = () => {
  // Si la URL es /admin, entrar directamente a la vista de administración
  const [currentView, setCurrentView] = useState<AppView>(() => {
    return window.location.pathname === '/admin' ? 'admin' : 'setup';
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<AuctionGameConfig | null>(null);
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [gameOverData, setGameOverData] = useState<{
    buyers: Buyer[];
    endReason: string;
  } | null>(null);

  // Cargar jugadores desde Supabase mediante SELECT público (sin IndexedDB)
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
  }, []);

  // Al iniciar partida, filtrar por el mazo elegido desde Supabase y cachear en memoria
  const handleStartGame = async (config: AuctionGameConfig) => {
    try {
      const deckPlayers = await fetchPlayersFromSupabase(config.selectedDeck);
      setGameConfig(config);
      setGamePlayers(deckPlayers);
      setCurrentView('auction');
    } catch (err: any) {
      alert('Error al cargar jugadores desde Supabase: ' + err.message);
    }
  };

  const handleGameOver = (finalBuyers: Buyer[], endReason: string) => {
    setGameOverData({ buyers: finalBuyers, endReason });
    setCurrentView('gameover');
  };

  const handlePlayAgain = () => {
    setGameOverData(null);
    setCurrentView('setup');
  };

  const handleAbortGame = () => {
    setGameOverData(null);
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

      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin') {
            window.history.pushState({}, '', '/admin');
          } else if (window.location.pathname === '/admin') {
            window.history.pushState({}, '', '/');
          }
          setCurrentView(view);
        }}
        totalPlayersCount={players.length}
      />

      <main className="flex-1 relative z-10">
        {currentView === 'setup' && (
          <SetupScreen
            players={players}
            onStartGame={handleStartGame}
            onGoToManagement={() => setCurrentView('management')}
            onGoToImport={() => setCurrentView('import')}
          />
        )}

        {currentView === 'admin' && (
          <AdminScreen
            onBackToGame={() => {
              window.history.pushState({}, '', '/');
              setCurrentView('setup');
            }}
            onPlayersUpdated={fetchPlayers}
          />
        )}

        {currentView === 'import' && (
          <ImportScreen
            onBack={() => setCurrentView('setup')}
            onGoToAuction={() => setCurrentView('setup')}
            onPlayersUpdated={fetchPlayers}
          />
        )}

        {currentView === 'management' && (
          <ManagementScreen
            onBackToSetup={() => setCurrentView('setup')}
            onPlayersUpdated={fetchPlayers}
            onGoToImport={() => setCurrentView('import')}
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
            onGoToManagement={() => setCurrentView('management')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
