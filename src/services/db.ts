import { Player, PlayerVersion } from '../types';

const DB_NAME = 'SubastaFutbolistasDB';
const DB_VERSION = 1;
const STORE_PLAYERS = 'players';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
        const store = db.createObjectStore(STORE_PLAYERS, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPlayers(): Promise<Player[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PLAYERS, 'readonly');
    const store = transaction.objectStore(STORE_PLAYERS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function savePlayer(player: Player): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PLAYERS, 'readwrite');
    const store = transaction.objectStore(STORE_PLAYERS);
    const request = store.put(player);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addOrUpdatePlayerVersion(
  playerName: string,
  version: PlayerVersion
): Promise<Player> {
  const trimmedName = playerName.trim();
  const allPlayers = await getAllPlayers();
  
  // Buscar si ya existe un jugador con el mismo nombre (ignora mayúsculas/minúsculas)
  const existingPlayer = allPlayers.find(
    (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  if (existingPlayer) {
    // Si la versión ya existe por ID, la actualizamos; si no, la agregamos
    const versionIdx = existingPlayer.versions.findIndex((v) => v.id === version.id);
    if (versionIdx >= 0) {
      existingPlayer.versions[versionIdx] = version;
    } else {
      existingPlayer.versions.push(version);
    }
    await savePlayer(existingPlayer);
    return existingPlayer;
  } else {
    // Nuevo jugador
    const newPlayer: Player = {
      id: crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: trimmedName,
      createdAt: Date.now(),
      versions: [version],
    };
    await savePlayer(newPlayer);
    return newPlayer;
  }
}

export async function deletePlayer(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PLAYERS, 'readwrite');
    const store = transaction.objectStore(STORE_PLAYERS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVersion(playerId: string, versionId: string): Promise<void> {
  const allPlayers = await getAllPlayers();
  const player = allPlayers.find((p) => p.id === playerId);
  if (!player) return;

  player.versions = player.versions.filter((v) => v.id !== versionId);
  if (player.versions.length === 0) {
    // Si no le quedan versiones, eliminamos el jugador
    await deletePlayer(playerId);
  } else {
    await savePlayer(player);
  }
}

export async function exportDatabaseJSON(): Promise<string> {
  const players = await getAllPlayers();
  return JSON.stringify(players, null, 2);
}

export async function importDatabaseJSON(jsonData: string): Promise<number> {
  const parsed = JSON.parse(jsonData);
  if (!Array.isArray(parsed)) {
    throw new Error('El formato del archivo JSON debe ser una lista de jugadores.');
  }

  const db = await openDB();
  const transaction = db.transaction(STORE_PLAYERS, 'readwrite');
  const store = transaction.objectStore(STORE_PLAYERS);

  let count = 0;
  for (const item of parsed) {
    if (item && item.id && item.name && Array.isArray(item.versions)) {
      store.put(item);
      count++;
    }
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(count);
    transaction.onerror = () => reject(transaction.error);
  });
}
