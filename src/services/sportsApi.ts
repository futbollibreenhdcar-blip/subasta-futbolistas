import { SportsApiPlayer } from '../types';

const API_KEY = import.meta.env.VITE_SPORTS_API_KEY || '3';
// TheSportsDB soporta CORS nativo directo con Access-Control-Allow-Origin: *
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Lista de ligas populares preconfiguradas
export const POPULAR_LEAGUES = [
  { id: 'Spanish La Liga', name: 'La Liga (España)' },
  { id: 'English Premier League', name: 'Premier League (Inglaterra)' },
  { id: 'Italian Serie A', name: 'Serie A (Italia)' },
  { id: 'German Bundesliga', name: 'Bundesliga (Alemania)' },
  { id: 'French Ligue 1', name: 'Ligue 1 (Francia)' },
  { id: 'Argentine Primera Division', name: 'Liga Argentina' },
  { id: 'Brazilian Serie A', name: 'Brasileirão (Brasil)' },
];

export const POPULAR_TEAMS = [
  'Real Madrid',
  'FC Barcelona',
  'Manchester City',
  'Inter Miami',
  'Paris SG',
  'Liverpool',
  'Arsenal',
  'Boca Juniors',
  'River Plate',
];

/**
 * Busca jugadores por nombre.
 * Si no encuentra jugadores por nombre, intenta buscar si es el nombre de un club.
 */
export async function searchPlayersByName(name: string): Promise<SportsApiPlayer[]> {
  if (!name.trim()) return [];
  const clean = name.trim();

  try {
    const url = `${BASE_URL}/searchplayers.php?p=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (Array.isArray(data.player) && data.player.length > 0) {
          return data.player.filter((p: any) => p.strPlayer);
        }
      }
    }
  } catch (err) {
    console.warn('Error en searchplayers:', err);
  }

  // Fallback: Si no hay jugadores con ese nombre, tal vez sea un equipo (ej. "Real Madrid")
  return await searchPlayersByTeam(clean);
}

/**
 * Busca jugadores de un equipo.
 * En TheSportsDB primero se consulta el ID del equipo vía searchteams.php y luego lookup_all_players.php
 */
export async function searchPlayersByTeam(teamName: string): Promise<SportsApiPlayer[]> {
  if (!teamName.trim()) return [];
  const clean = teamName.trim();

  let teamId: string | null = null;
  let officialTeamName: string = clean;

  // Intento 1: buscar equipo con guiones bajos (formato TheSportsDB: Real_Madrid)
  try {
    const url1 = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(clean.replace(/\s+/g, '_'))}`;
    const res1 = await fetch(url1);
    if (res1.ok) {
      const text = await res1.text();
      if (text && text.trim()) {
        const data1 = JSON.parse(text);
        if (data1.teams && data1.teams.length > 0) {
          teamId = data1.teams[0].idTeam;
          officialTeamName = data1.teams[0].strTeam || clean;
        }
      }
    }
  } catch (e) {}

  // Intento 2: buscar equipo con espacios normales si no encontró
  if (!teamId) {
    try {
      const url2 = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(clean)}`;
      const res2 = await fetch(url2);
      if (res2.ok) {
        const text = await res2.text();
        if (text && text.trim()) {
          const data2 = JSON.parse(text);
          if (data2.teams && data2.teams.length > 0) {
            teamId = data2.teams[0].idTeam;
            officialTeamName = data2.teams[0].strTeam || clean;
          }
        }
      }
    } catch (e) {}
  }

  // Si no encontramos equipo con ese nombre, intentar buscar jugadores por nombre
  if (!teamId) {
    const fallbackPlayers = await searchPlayersByName(clean);
    return fallbackPlayers;
  }

  // Paso 2: Obtener los jugadores del equipo usando lookup_all_players.php?id={teamId}
  try {
    const urlPlayers = `${BASE_URL}/lookup_all_players.php?id=${encodeURIComponent(teamId)}`;
    const resPlayers = await fetch(urlPlayers);
    if (!resPlayers.ok) return [];
    const textPlayers = await resPlayers.text();
    if (!textPlayers || !textPlayers.trim()) return [];

    const dataPlayers = JSON.parse(textPlayers);
    return (dataPlayers.player || []).map((p: any) => ({
      ...p,
      strTeam: p.strTeam || officialTeamName,
    }));
  } catch (err) {
    console.error('Error obteniendo jugadores del equipo:', err);
    return [];
  }
}

/**
 * Obtiene los equipos de una liga
 */
export async function getTeamsInLeague(
  leagueName: string
): Promise<Array<{ idTeam: string; strTeam: string; strBadge?: string }>> {
  try {
    const url = `${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || !text.trim()) return [];
    const data = JSON.parse(text);
    return data.teams || [];
  } catch (err) {
    console.error('Error obteniendo equipos de liga:', err);
    return [];
  }
}

/**
 * Descarga la imagen oficial del jugador como Blob para procesarla con @imgly/background-removal.
 * Usa proxy CORS confiable para imágenes (images.weserv.nl o proxy local Vite).
 */
export async function fetchPlayerImageBlob(imageUrl: string): Promise<Blob> {
  if (!imageUrl) throw new Error('No se proporcionó URL de imagen.');

  // Intento 1: Proxy de desarrollo Vite local (si aplica)
  if (import.meta.env.DEV && imageUrl.includes('r2.thesportsdb.com')) {
    try {
      const localProxied = imageUrl.replace('https://r2.thesportsdb.com', '/sportsdb-images');
      const res = await fetch(localProxied);
      if (res.ok) return await res.blob();
    } catch (e) {}
  }

  // Intento 2: images.weserv.nl (servicio público estable con CORS libre para imágenes)
  try {
    const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(weservUrl);
    if (res.ok) return await res.blob();
  } catch (e) {}

  // Intento 3: Descarga directa
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (res.ok) return await res.blob();
  } catch (e) {}

  // Intento 4: allorigins
  const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
  const res = await fetch(allOriginsUrl);
  if (!res.ok) throw new Error('No se pudo descargar la imagen por restricciones de red.');
  return await res.blob();
}
