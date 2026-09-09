import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TIER_RULES = {
  'Real Madrid': 'S',
  'Barcelona': 'S',
};

const VALUES = {
  S: 100,
  A: 70,
  B: 45,
  C: 25,
};

// Jugadores adicionales destacados para completar los planteles a ~20-22 por club
const ADDITIONAL_PLAYERS = {
  'Real Madrid': [
    'Vinicius Junior', 'Kylian Mbappe', 'Jude Bellingham', 'Rodrygo',
    'Federico Valverde', 'Eduardo Camavinga', 'Thibaut Courtois',
    'Eder Militao', 'Ferland Mendy', 'Endrick', 'Lucas Vazquez', 'Fran Garcia'
  ],
  'Barcelona': [
    'Robert Lewandowski', 'Lamine Yamal', 'Raphinha', 'Pedri',
    'Marc-Andre ter Stegen', 'Jules Kounde', 'Pau Cubarsi', 'Inigo Martinez',
    'Marc Casado', 'Fermin Lopez', 'Ansu Fati', 'Wojciech Szczesny'
  ]
};

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

async function fetchImageBuffer(url) {
  // Intentar primero con weserv para asegurar headers correctos
  const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(weservUrl);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  } catch (e) {}

  // Fallback directo
  try {
    const res2 = await fetch(url);
    if (res2.ok) {
      return Buffer.from(await res2.arrayBuffer());
    }
  } catch (e) {}

  return null;
}

async function run() {
  console.log('================================================================');
  console.log(' INICIANDO IMPORTACIÓN DE PRUEBA: 2 CLUBES (Real Madrid y Barcelona)');
  console.log('================================================================');

  const clubs = ['Real Madrid', 'Barcelona'];
  let totalImported = 0;
  let totalFailures = 0;
  const importedList = [];

  for (const club of clubs) {
    console.log(`\n🔍 Obteniendo jugadores para: ${club}...`);
    const tier = TIER_RULES[club] || 'C';
    const valor = VALUES[tier];

    // 1. Obtener id del club
    const teamData = await fetchJson(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(club.replace(/\s+/g, '_'))}`);
    const teamId = teamData?.teams?.[0]?.idTeam;
    const officialName = teamData?.teams?.[0]?.strTeam || club;

    const rawPlayers = [];

    if (teamId) {
      const rosterData = await fetchJson(`https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamId}`);
      if (rosterData?.player) {
        rawPlayers.push(...rosterData.player);
      }
    }

    // 2. Buscar los jugadores adicionales del plantel
    const extraNames = ADDITIONAL_PLAYERS[club] || [];
    for (const name of extraNames) {
      const pData = await fetchJson(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`);
      if (pData?.player?.[0]) {
        rawPlayers.push(pData.player[0]);
      }
    }

    // Deduplicar por nombre normalizado
    const uniqueMap = new Map();
    for (const p of rawPlayers) {
      if (!p.strPlayer) continue;
      const norm = p.strPlayer.toLowerCase().trim();
      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, p);
      }
    }

    console.log(`📋 Total de jugadores a procesar para ${club}: ${uniqueMap.size}`);

    for (const [, player] of uniqueMap) {
      const photoUrl = player.strCutout || player.strThumb;
      if (!photoUrl) {
        console.log(`⚠️ Saltando ${player.strPlayer}: sin foto oficial disponible.`);
        totalFailures++;
        continue;
      }

      process.stdout.write(`⏳ Procesando ${player.strPlayer}... `);

      try {
        // Descargar foto
        const imgBuffer = await fetchImageBuffer(photoUrl);
        if (!imgBuffer || imgBuffer.length === 0) {
          console.log(`❌ Fallo descarga de imagen`);
          totalFailures++;
          continue;
        }

        // Subir al bucket 'fotos-jugadores'
        const safeName = player.strPlayer.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fileName = `${safeName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos-jugadores')
          .upload(fileName, imgBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.log(`❌ Error storage: ${uploadError.message}`);
          totalFailures++;
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('fotos-jugadores')
          .getPublicUrl(uploadData.path);

        const finalPhotoUrl = publicUrlData.publicUrl;

        // Determinar si es arquero
        const isGk = (player.strPosition || '').toLowerCase().includes('goal') || (player.strPosition || '').toLowerCase().includes('portero');
        const mazos = isGk ? ['estrellas_actuales', 'arqueros'] : ['estrellas_actuales'];

        // Insertar en tabla jugadores
        const { data: existingPlayer } = await supabase
          .from('jugadores')
          .select('id, nombre_real')
          .ilike('nombre_real', player.strPlayer.trim())
          .limit(1);

        let jugadorId;
        if (existingPlayer && existingPlayer.length > 0) {
          jugadorId = existingPlayer[0].id;
        } else {
          const { data: newP, error: pErr } = await supabase
            .from('jugadores')
            .insert([{ nombre_real: player.strPlayer.trim() }])
            .select()
            .single();

          if (pErr) throw pErr;
          jugadorId = newP.id;
        }

        // Insertar en tabla versiones
        const { data: newV, error: vErr } = await supabase
          .from('versiones')
          .insert([
            {
              jugador_id: jugadorId,
              etiqueta: `${officialName} 2026`,
              tier,
              valor,
              foto_url: finalPhotoUrl,
              mazos,
            },
          ])
          .select()
          .single();

        if (vErr) throw vErr;

        console.log(`✅ [${tier} | $${valor} | ${mazos.join(',')}]`);
        totalImported++;
        importedList.push({
          nombre: player.strPlayer,
          club: officialName,
          tier,
          valor,
          mazos,
        });
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
        totalFailures++;
      }
    }
  }

  console.log('\n================================================================');
  console.log(' RESUMEN DE IMPORTACIÓN DE PRUEBA (2 CLUBES)');
  console.log('================================================================');
  console.log(`Total futbolistas insertados: ${totalImported}`);
  console.log(`Total fallos/saltados: ${totalFailures}`);
  console.log(`Por Tier: S = ${totalImported}`);
  console.log(`Por Mazo:`);
  console.log(`  - Estrellas actuales: ${totalImported}`);
  console.log(`  - Arqueros: ${importedList.filter(p => p.mazos.includes('arqueros')).length}`);
  console.log('================================================================\n');
}

run();
