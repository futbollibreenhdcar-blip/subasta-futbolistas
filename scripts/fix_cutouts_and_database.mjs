import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf-8').split('\n')
    .filter(l => l.includes('='))
    .map(l => l.trim().split('='))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

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
    if (error) return url;
    const { data } = supabase.storage.from('fotos-jugadores').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return url;
  }
}

async function fixDatabase() {
  console.log('🔍 Paso 1: Detectando y eliminando versiones con recortes vacíos...');
  const { data: existing } = await supabase.from('versiones').select('id, foto_url, jugador_id');
  const toDelete = [];
  for (const v of existing) {
    try {
      const res = await fetch(v.foto_url);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) {
        toDelete.push(v.id);
      }
    } catch {}
  }
  console.log(`Encontradas ${toDelete.length} versiones vacías para eliminar.`);
  if (toDelete.length > 0) {
    await supabase.from('versiones').delete().in('id', toDelete);
  }

  // Eliminar jugadores que quedaron sin versiones
  const { data: orphans } = await supabase.from('jugadores').select('id, versiones(id)');
  const orphanIds = (orphans || []).filter(j => !j.versiones || j.versiones.length === 0).map(j => j.id);
  if (orphanIds.length > 0) {
    console.log(`Eliminando ${orphanIds.length} futbolistas sin versiones...`);
    await supabase.from('jugadores').delete().in('id', orphanIds);
  }

  console.log('📥 Paso 2: Importando nuevas cartas 100% limpias de las páginas 6 a 9...');
  for (let page = 6; page <= 9; page++) {
    const res = await fetch(`https://renderz.app/players/__data.json?sortType=rating&sortDirection=DESC&page=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'x-sveltekit-invalidated': '001' }
    });
    const json = await res.json();
    const node2 = json.nodes[2]?.data;
    if (!node2) continue;
    const pList = node2[node2[0].players];

    for (const idx of pList) {
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

      // Ignorar si no tiene cutout válido o si es _WHITE_
      if (!cardName || rating < 118 || !cutout || !bg || cutout.includes('_WHITE_')) continue;

      // Verificar que el buffer del cutout sea real (> 2000 bytes)
      try {
        const cRes = await fetch(cutout);
        const cBuf = Buffer.from(await cRes.arrayBuffer());
        if (cBuf.length < 2000) continue;

        // Subir o reusar bg
        let bgUrl = bgCache.get(bg);
        if (!bgUrl) {
          const bgHash = crypto.createHash('md5').update(bg).digest('hex').substring(0, 10);
          bgUrl = await uploadAsset(bg, 'fc_backgrounds', `bg_${bgHash}.png`);
          bgCache.set(bg, bgUrl);
        }

        // Subir o reusar flag
        let flagUrl = flag ? flagCache.get(flag) : '';
        if (flag && !flagUrl) {
          const flagKey = nationId || crypto.createHash('md5').update(flag).digest('hex').substring(0, 8);
          flagUrl = await uploadAsset(flag, 'fc_flags', `flag_${flagKey}.png`);
          flagCache.set(flag, flagUrl);
        }

        // Subir o reusar club
        let clubUrl = club ? clubCache.get(club) : '';
        if (club && !clubUrl) {
          const clubKey = clubId || crypto.createHash('md5').update(club).digest('hex').substring(0, 8);
          clubUrl = await uploadAsset(club, 'fc_clubs', `club_${clubKey}.png`);
          clubCache.set(club, clubUrl);
        }

        // Subir cutout
        const assetId = p.assetId || Math.floor(Math.random() * 1000000);
        const cutoutUrl = await uploadAsset(cutout, 'fc_cutouts', `player_${assetId}.png`);

        let eventName = 'Estrellas Top';
        if (source.includes('ICON')) eventName = 'Icons';
        else if (source.includes('HERO')) eventName = 'Heroes';
        else if (source.includes('CHAMPIONS')) eventName = 'UCL Champions';
        else if (source.includes('TOTS')) eventName = 'TOTS 26';
        else if (source.includes('NUMERO')) eventName = 'Número 1';
        else if (source.includes('TWG')) eventName = 'The World Game';

        const isLegend = source.includes('ICON') || source.includes('HERO');
        const decks = ['mixto'];
        if (isLegend) {
          decks.push('leyendas');
          decks.push('retirados');
        } else {
          decks.push('estrellas_actuales');
        }
        if (position === 'GK') {
          decks.push('arqueros');
        }

        const nationInfo = NATION_MAP[nationId] || { name: 'Mundial', continent: 'Internacional' };
        const posicionCat = getPositionCategory(position);

        // Crear o buscar jugador
        let { data: existingPlayer } = await supabase.from('jugadores').select('id').eq('nombre_real', cardName).maybeSingle();
        let jId = existingPlayer?.id;
        if (!jId) {
          jId = crypto.randomUUID();
          await supabase.from('jugadores').insert({ id: jId, nombre_real: cardName });
        }

        // Insertar versión
        await supabase.from('versiones').insert({
          id: crypto.randomUUID(),
          jugador_id: jId,
          etiqueta: `${eventName} • GRL ${rating}`,
          tier: calculateTier(rating),
          valor: calculateValue(rating),
          foto_url: cutoutUrl,
          card_bg_url: bgUrl,
          flag_url: flagUrl,
          club_url: clubUrl,
          grl: rating,
          posicion: position,
          evento: eventName,
          mazos: decks,
          revisar: false,
          posicion_pista: `${posicionCat} (${position})`,
          continente_pista: `${nationInfo.continent} (${nationInfo.name})`,
          decada_pista: isLegend ? '1990s - 2000s' : '2020s',
        });
        console.log(`+ Añadido: ${cardName} (${eventName} GRL ${rating} ${position})`);
      } catch (err) {
        console.error(`Error procesando ${cardName}:`, err.message);
      }
    }
  }

  const { count: finalVersiones } = await supabase.from('versiones').select('*', { count: 'exact', head: true });
  const { count: finalJugadores } = await supabase.from('jugadores').select('*', { count: 'exact', head: true });
  console.log(`\n🎉 Base de datos depurada y actualizada:`);
  console.log(`- Versiones activas 100% limpias: ${finalVersiones}`);
  console.log(`- Jugadores únicos: ${finalJugadores}`);
}

fixDatabase();
