import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf-8').split('\n')
    .filter(l => l.includes('='))
    .map(l => l.trim().split('='))
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Continents and Nations map
const NATION_MAP = {
  54: { name: 'Brasil', continent: 'Sudamérica' },
  52: { name: 'Argentina', continent: 'Sudamérica' },
  60: { name: 'Uruguay', continent: 'Sudamérica' },
  56: { name: 'Colombia', continent: 'Sudamérica' },
  55: { name: 'Chile', continent: 'Sudamérica' },
  18: { name: 'Francia', continent: 'Europa' },
  45: { name: 'España', continent: 'Europa' },
  21: { name: 'Alemania', continent: 'Europa' },
  14: { name: 'Inglaterra', continent: 'Europa' },
  27: { name: 'Italia', continent: 'Europa' },
  38: { name: 'Portugal', continent: 'Europa' },
  34: { name: 'Países Bajos', continent: 'Europa' },
  7: { name: 'Bélgica', continent: 'Europa' },
  10: { name: 'Croacia', continent: 'Europa' },
  36: { name: 'Noruega', continent: 'Europa' },
  46: { name: 'Suecia', continent: 'Europa' },
  37: { name: 'Polonia', continent: 'Europa' },
  13: { name: 'Dinamarca', continent: 'Europa' },
  4: { name: 'Austria', continent: 'Europa' },
  47: { name: 'Suiza', continent: 'Europa' },
  50: { name: 'Gales', continent: 'Europa' },
  35: { name: 'Irlanda del Norte', continent: 'Europa' },
  108: { name: 'Costa de Marfil', continent: 'África' },
  136: { name: 'Senegal', continent: 'África' },
  111: { name: 'Egipto', continent: 'África' },
  133: { name: 'Nigeria', continent: 'África' },
  103: { name: 'Camerún', continent: 'África' },
  129: { name: 'Marruecos', continent: 'África' },
  97: { name: 'Argelia', continent: 'África' },
  117: { name: 'Ghana', continent: 'África' },
  163: { name: 'Japón', continent: 'Asia' },
  167: { name: 'Corea del Sur', continent: 'Asia' },
  95: { name: 'Estados Unidos', continent: 'Norteamérica' },
  82: { name: 'Canadá', continent: 'Norteamérica' },
  83: { name: 'México', continent: 'Norteamérica' },
  115: { name: 'Georgia', continent: 'Europa' },
  49: { name: 'Turquía', continent: 'Europa' },
  22: { name: 'Grecia', continent: 'Europa' },
  48: { name: 'República Checa', continent: 'Europa' },
  42: { name: 'Rumania', continent: 'Europa' },
  25: { name: 'Hungría', continent: 'Europa' },
  28: { name: 'Costa de Marfil', continent: 'África' }
};

function getPositionCategory(pos) {
  if (['ST', 'CF', 'LW', 'RW', 'LF', 'RF'].includes(pos)) return 'Delantero';
  if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return 'Centrocampista';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'Defensor';
  if (pos === 'GK') return 'Portero';
  return 'Polifuncional';
}

function calculateTier(grl) {
  if (grl >= 121) return 'S';
  if (grl >= 119) return 'A';
  if (grl >= 117) return 'B';
  if (grl >= 115) return 'C';
  return 'D';
}

function calculateValue(grl) {
  // Escala balanceada para subastas (30 a 100 de presupuesto)
  if (grl >= 122) return 98;
  if (grl === 121) return 92;
  if (grl === 120) return 86;
  if (grl === 119) return 78;
  if (grl === 118) return 70;
  if (grl === 117) return 62;
  if (grl === 116) return 54;
  if (grl === 115) return 46;
  return 38;
}

// Memory caches to avoid duplicate storage uploads
const bgCache = new Map();
const flagCache = new Map();
const clubCache = new Map();

async function uploadAsset(url, folder, filename) {
  if (!url) return '';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return url;
    const buf = Buffer.from(await res.arrayBuffer());
    const path = `${folder}/${filename}`;
    const { error } = await supabase.storage.from('fotos-jugadores').upload(path, buf, {
      contentType: 'image/png',
      upsert: true
    });
    if (error) {
      console.warn(`Storage upload error for ${path}:`, error.message);
      return url;
    }
    const { data } = supabase.storage.from('fotos-jugadores').getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn(`Failed to upload ${url}:`, e.message);
    return url;
  }
}

async function fetchSveltekitData(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'x-sveltekit-invalidated': '001' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

async function main() {
  console.log('🚀 Iniciando importación de cartas FC Mobile desde RenderZ...');

  // 1. Limpiar base de datos para arrancar limpios
  console.log('🧹 Limpiando tablas de jugadores y versiones...');
  const { error: delVersionesErr } = await supabase.from('versiones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: delJugadoresErr } = await supabase.from('jugadores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delVersionesErr || delJugadoresErr) {
    console.log('Aviso al limpiar (podría ya estar vacía):', delVersionesErr?.message || delJugadoresErr?.message);
  }

  // 2. Recolectar cartas de eventos y top rated
  const collectedCards = new Map();

  const programConfigs = [
    { id: 'PROGRAM_TOTS26-tots-26', eventName: 'TOTS 26' },
    { id: 'PROGRAM_NUMERO26-numero', eventName: 'Número 1' },
    { id: 'PROGRAM_GC26-game-changer', eventName: 'Game Changers' },
    { id: 'PROGRAM_CHAMPIONS26-champions', eventName: 'UCL Champions' },
    { id: 'PROGRAM_RECORDHOLDERS-record-holders', eventName: 'Record Holders' },
  ];

  for (const prog of programConfigs) {
    try {
      console.log(`📥 Descargando catálogo del evento: ${prog.eventName}...`);
      const data = await fetchSveltekitData(`https://renderz.app/programs/${prog.id}/__data.json`);
      const node2 = data.nodes[2]?.data;
      if (!node2) continue;
      const pResp = node2[node2[0]?.playersResponse];
      if (!pResp) continue;
      const pIndices = node2[pResp.players] || [];

      for (const idx of pIndices) {
        const p = node2[idx];
        const cardName = node2[p.cardName];
        const rating = Number(node2[p.rating]);
        const position = node2[p.position];
        const images = node2[p.images] || {};
        const cutout = node2[images.playerCardImage];
        const bg = node2[images.playerCardBackground];
        const flag = node2[images.flagImage];
        const club = node2[images.clubImage];
        const nationObj = node2[p.nation];
        const nationId = nationObj ? node2[nationObj.id] : null;
        const clubObj = node2[p.club];
        const clubId = clubObj ? node2[clubObj.id] : null;
        const source = node2[p.source] || prog.id;
        const key = `${cardName}_${rating}_${prog.eventName}`;

        if (cardName && rating >= 115 && cutout && bg && !collectedCards.has(key)) {
          collectedCards.set(key, {
            assetId: p.assetId || Math.floor(Math.random() * 1000000),
            playerId: p.playerId,
            cardName,
            firstName: node2[p.firstName],
            lastName: node2[p.lastName],
            birthday: node2[p.birthday],
            rating,
            position,
            source,
            eventName: prog.eventName,
            cutout,
            bg,
            flag,
            club,
            nationId,
            clubId,
          });
        }
      }
    } catch (e) {
      console.error(`Error con ${prog.eventName}:`, e.message);
    }
  }

  // Descargar páginas del ranking top
  for (let page = 1; page <= 5; page++) {
    try {
      console.log(`📥 Descargando página ${page} de mejores valorados...`);
      const data = await fetchSveltekitData(`https://renderz.app/players/__data.json?sortType=rating&sortDirection=DESC&page=${page}`);
      const node2 = data.nodes[2]?.data;
      if (!node2) continue;
      const pIndices = node2[node2[0]?.players] || [];

      for (const idx of pIndices) {
        const p = node2[idx];
        const cardName = node2[p.cardName];
        const rating = Number(node2[p.rating]);
        const position = node2[p.position];
        const images = node2[p.images] || {};
        const cutout = node2[images.playerCardImage];
        const bg = node2[images.playerCardBackground];
        const flag = node2[images.flagImage];
        const club = node2[images.clubImage];
        const nationObj = node2[p.nation];
        const nationId = nationObj ? node2[nationObj.id] : null;
        const clubObj = node2[p.club];
        const clubId = clubObj ? node2[clubObj.id] : null;
        const source = node2[p.source] || 'FC Mobile';

        let eventName = 'Estrellas Top';
        if (source.includes('ICON')) eventName = 'Icons';
        else if (source.includes('HERO')) eventName = 'Heroes';
        else if (source.includes('CHAMPIONS')) eventName = 'UCL Champions';
        else if (source.includes('TOTS')) eventName = 'TOTS 26';
        else if (source.includes('NUMERO')) eventName = 'Número 1';
        else if (source.includes('TWG')) eventName = 'The World Game';

        const key = `${cardName}_${rating}_${eventName}`;

        if (cardName && rating >= 115 && cutout && bg && !collectedCards.has(key)) {
          collectedCards.set(key, {
            assetId: p.assetId || Math.floor(Math.random() * 1000000),
            playerId: p.playerId,
            cardName,
            firstName: node2[p.firstName],
            lastName: node2[p.lastName],
            birthday: node2[p.birthday],
            rating,
            position,
            source,
            eventName,
            cutout,
            bg,
            flag,
            club,
            nationId,
            clubId,
          });
        }
      }
    } catch (e) {
      console.error(`Error en página ${page}:`, e.message);
    }
  }

  const cardsList = Array.from(collectedCards.values());
  console.log(`✅ Total de cartas únicas seleccionadas: ${cardsList.length}`);

  // Agrupar por jugador (para permitir multi-versión si un jugador tiene varias cartas top)
  const playersMap = new Map();
  for (const card of cardsList) {
    const pKey = card.cardName.trim();
    if (!playersMap.has(pKey)) {
      playersMap.set(pKey, []);
    }
    playersMap.get(pKey).push(card);
  }

  console.log(`👥 Total de futbolistas únicos: ${playersMap.size}`);

  let totalInserted = 0;
  let totalVersiones = 0;

  for (const [playerName, versions] of playersMap.entries()) {
    try {
      // 1. Insertar Jugador
      const jugadorId = crypto.randomUUID();
      const { error: pErr } = await supabase.from('jugadores').insert({
        id: jugadorId,
        nombre_real: playerName,
      });

      if (pErr) {
        console.error(`Error insertando jugador ${playerName}:`, pErr.message);
        continue;
      }
      totalInserted++;

      // 2. Insertar Versiones de este Jugador
      for (const ver of versions) {
        // Subir o reusar background
        let bgUrl = bgCache.get(ver.bg);
        if (!bgUrl) {
          const bgHash = crypto.createHash('md5').update(ver.bg).digest('hex').substring(0, 10);
          bgUrl = await uploadAsset(ver.bg, 'fc_backgrounds', `bg_${bgHash}.png`);
          bgCache.set(ver.bg, bgUrl);
        }

        // Subir o reusar bandera
        let flagUrl = ver.flag ? flagCache.get(ver.flag) : '';
        if (ver.flag && !flagUrl) {
          const flagKey = ver.nationId || crypto.createHash('md5').update(ver.flag).digest('hex').substring(0, 8);
          flagUrl = await uploadAsset(ver.flag, 'fc_flags', `flag_${flagKey}.png`);
          flagCache.set(ver.flag, flagUrl);
        }

        // Subir o reusar club
        let clubUrl = ver.club ? clubCache.get(ver.club) : '';
        if (ver.club && !clubUrl) {
          const clubKey = ver.clubId || crypto.createHash('md5').update(ver.club).digest('hex').substring(0, 8);
          clubUrl = await uploadAsset(ver.club, 'fc_clubs', `club_${clubKey}.png`);
          clubCache.set(ver.club, clubUrl);
        }

        // Subir recorte del jugador
        const cutoutUrl = await uploadAsset(ver.cutout, 'fc_cutouts', `player_${ver.assetId}.png`);

        // Datos del juego
        const tier = calculateTier(ver.rating);
        const value = calculateValue(ver.rating);

        const isLegend = ver.source.includes('ICON') || ver.source.includes('HERO');
        const decks = ['mixto'];
        if (isLegend) {
          decks.push('leyendas');
          decks.push('retirados');
        } else {
          decks.push('estrellas_actuales');
        }
        if (ver.position === 'GK') {
          decks.push('arqueros');
        }

        const nationInfo = NATION_MAP[ver.nationId] || { name: 'Mundial', continent: 'Internacional' };
        const posicionCat = getPositionCategory(ver.position);

        let decada = '2020s';
        if (isLegend) decada = '1990s - 2000s';

        const versionId = crypto.randomUUID();
        const { error: vErr } = await supabase.from('versiones').insert({
          id: versionId,
          jugador_id: jugadorId,
          etiqueta: `${ver.eventName} • GRL ${ver.rating}`,
          tier,
          valor: value,
          foto_url: cutoutUrl,
          card_bg_url: bgUrl,
          flag_url: flagUrl,
          club_url: clubUrl,
          grl: ver.rating,
          posicion: ver.position,
          evento: ver.eventName,
          mazos: decks,
          revisar: false,
          posicion_pista: `${posicionCat} (${ver.position})`,
          continente_pista: `${nationInfo.continent} (${nationInfo.name})`,
          decada_pista: decada,
        });

        if (vErr) {
          console.error(`Error insertando versión para ${playerName}:`, vErr.message);
        } else {
          totalVersiones++;
        }
      }

      if (totalInserted % 10 === 0) {
        console.log(`⏳ Progreso: ${totalInserted} jugadores importados (${totalVersiones} cartas FC Mobile)...`);
      }
    } catch (err) {
      console.error(`Error procesando ${playerName}:`, err.message);
    }
  }

  console.log(`\n🎉 ¡Importación completada con éxito!`);
  console.log(`⭐ Total Jugadores: ${totalInserted}`);
  console.log(`🃏 Total Cartas FC Mobile: ${totalVersiones}`);
  console.log(`🎨 Backgrounds subidos/cacheados: ${bgCache.size}`);
  console.log(`🏳️ Banderas subidas/cacheadas: ${flagCache.size}`);
  console.log(`🛡️ Escudos subidos/cacheados: ${clubCache.size}`);
}

main();
