import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envText.split('\n').filter(l => l.includes('=')).map(l => l.trim().split('=')));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const MULTI_VERSION_PLAYERS = [
  {
    nombre: 'Edinson Cavani',
    posicion: 'Delantero',
    continente: 'Sudamérica',
    prime: {
      etiqueta: 'PSG 2018 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/xf3lty1750043968.png'
    },
    decline: {
      etiqueta: 'Valencia 2022 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2020s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/xf3lty1750043968.png'
    }
  },
  {
    nombre: 'Wayne Rooney',
    posicion: 'Delantero',
    continente: 'Europa',
    prime: {
      etiqueta: 'Man United 2010 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/voz09s1609529985.png'
    },
    decline: {
      etiqueta: 'DC United 2018 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/voz09s1609529985.png'
    }
  },
  {
    nombre: 'Radamel Falcao',
    posicion: 'Delantero',
    continente: 'Sudamérica',
    prime: {
      etiqueta: 'Atlético Madrid 2012 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/8xl2t31666379044.png'
    },
    decline: {
      etiqueta: 'Chelsea 2015 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/8xl2t31666379044.png'
    }
  },
  {
    nombre: 'Mario Balotelli',
    posicion: 'Delantero',
    continente: 'Europa',
    prime: {
      etiqueta: 'Man City 2012 (Prime)',
      tier: 'A',
      valor: 70,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/alfgb41610666098.png'
    },
    decline: {
      etiqueta: 'FC Sion 2022 (Declive)',
      tier: 'D',
      valor: 10,
      decada: 'Años 2020s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/alfgb41610666098.png'
    }
  },
  {
    nombre: 'Fernando Torres',
    posicion: 'Delantero',
    continente: 'Europa',
    prime: {
      etiqueta: 'Liverpool 2008 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2000s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/l65kxv1654200501.png'
    },
    decline: {
      etiqueta: 'Chelsea 2011 (Declive)',
      tier: 'B',
      valor: 45,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/l65kxv1654200501.png'
    }
  },
  {
    nombre: 'Robinho',
    posicion: 'Delantero',
    continente: 'Sudamérica',
    prime: {
      etiqueta: 'Real Madrid 2007 (Prime)',
      tier: 'A',
      valor: 70,
      decada: 'Años 2000s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/1ahvfn1661506437.png'
    },
    decline: {
      etiqueta: 'Sivasspor 2018 (Declive)',
      tier: 'D',
      valor: 10,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/1ahvfn1661506437.png'
    }
  },
  {
    nombre: 'Paul Pogba',
    posicion: 'Mediocampista',
    continente: 'Europa',
    prime: {
      etiqueta: 'Juventus 2015 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/3fv73s1766238293.png'
    },
    decline: {
      etiqueta: 'Man United 2021 (Declive)',
      tier: 'B',
      valor: 45,
      decada: 'Años 2020s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/3fv73s1766238293.png'
    }
  },
  {
    nombre: 'Neymar',
    posicion: 'Delantero',
    continente: 'Sudamérica',
    prime: {
      etiqueta: 'Barcelona 2015 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/av4ar01767782947.png'
    },
    decline: {
      etiqueta: 'Al Hilal 2023 (Declive)',
      tier: 'B',
      valor: 45,
      decada: 'Años 2020s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/av4ar01767782947.png'
    }
  },
  {
    nombre: 'Gareth Bale',
    posicion: 'Delantero',
    continente: 'Europa',
    prime: {
      etiqueta: 'Real Madrid 2016 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/j8hjmr1629105139.png'
    },
    decline: {
      etiqueta: 'LAFC 2022 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2020s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/j8hjmr1629105139.png'
    }
  },
  {
    nombre: 'David Villa',
    posicion: 'Delantero',
    continente: 'Europa',
    prime: {
      etiqueta: 'Barcelona 2011 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/ecimll1659207823.png'
    },
    decline: {
      etiqueta: 'Vissel Kobe 2019 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2010s',
      mazos: ['leyendas'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/ecimll1659207823.png'
    }
  },
  {
    nombre: 'Diego Costa',
    posicion: 'Delantero',
    continente: 'Europa',
    prime: {
      etiqueta: 'Atlético Madrid 2014 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/ebi2l81667669825.png'
    },
    decline: {
      etiqueta: 'Wolves 2022 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2020s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/ebi2l81667669825.png'
    }
  },
  {
    nombre: 'Alexis Sánchez',
    posicion: 'Delantero',
    continente: 'Sudamérica',
    prime: {
      etiqueta: 'Arsenal 2016 (Prime)',
      tier: 'S',
      valor: 100,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/6bj5hk1762860338.png'
    },
    decline: {
      etiqueta: 'Man United 2018 (Declive)',
      tier: 'C',
      valor: 25,
      decada: 'Años 2010s',
      mazos: ['estrellas_actuales'],
      photoQuery: 'https://r2.thesportsdb.com/images/media/player/cutout/6bj5hk1762860338.png'
    }
  }
];

async function fetchImageBuffer(url) {
  try {
    const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    const res = await fetch(weservUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 500) return buf;
    }
  } catch (e) {}

  try {
    const res2 = await fetch(url);
    if (res2.ok) {
      const buf = Buffer.from(await res2.arrayBuffer());
      if (buf.length > 500) return buf;
    }
  } catch (e) {}

  return null;
}

async function uploadToStorage(name, tag, buffer) {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const safeTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `${safeName}_${safeTag}_${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('fotos-jugadores')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) throw error;

  const { data: pubData } = supabase.storage
    .from('fotos-jugadores')
    .getPublicUrl(data.path);

  return pubData.publicUrl;
}

async function run() {
  console.log('===============================================================');
  console.log(' INSERTANDO VERSIONES MÚLTIPLES (PRIME VS. DECLIVE) PARA 12 JUGADORES');
  console.log('===============================================================');

  let totalAdded = 0;

  for (const item of MULTI_VERSION_PLAYERS) {
    console.log(`\n⚽ Procesando: ${item.nombre}...`);

    // 1. Obtener o crear jugador en 'jugadores'
    let jugadorId;
    const { data: existingPlayer } = await supabase
      .from('jugadores')
      .select('id')
      .ilike('nombre_real', item.nombre.trim())
      .limit(1);

    if (existingPlayer && existingPlayer.length > 0) {
      jugadorId = existingPlayer[0].id;
      console.log(`  Encontrado en tabla jugadores: ${jugadorId}`);
    } else {
      const { data: newP, error: pErr } = await supabase
        .from('jugadores')
        .insert([{ nombre_real: item.nombre.trim() }])
        .select()
        .single();
      if (pErr) throw pErr;
      jugadorId = newP.id;
      console.log(`  Creado nuevo en tabla jugadores: ${jugadorId}`);
    }

    // 2. Descargar imagen cutout
    const buf = await fetchImageBuffer(item.prime.photoQuery);
    if (!buf) {
      console.log(`  ❌ Falló descarga de foto para ${item.nombre}`);
      continue;
    }

    // 3. Crear versión Prime
    const primePhotoUrl = await uploadToStorage(item.nombre, 'prime', buf);
    const { data: vPrime, error: vPrimeErr } = await supabase
      .from('versiones')
      .insert([{
        jugador_id: jugadorId,
        etiqueta: item.prime.etiqueta,
        tier: item.prime.tier,
        valor: item.prime.valor,
        foto_url: primePhotoUrl,
        mazos: item.prime.mazos,
        posicion_pista: item.posicion,
        continente_pista: item.continente,
        decada_pista: item.prime.decada,
        revisar: false
      }])
      .select()
      .single();

    if (vPrimeErr) {
      console.log(`  ❌ Error insertando prime: ${vPrimeErr.message}`);
    } else {
      console.log(`  ✅ Prime insertada: [${item.prime.etiqueta}] Tier ${item.prime.tier} ($${item.prime.valor})`);
      totalAdded++;
    }

    // 4. Crear versión Declive / Peor época
    const declinePhotoUrl = await uploadToStorage(item.nombre, 'declive', buf);
    const { data: vDecline, error: vDeclineErr } = await supabase
      .from('versiones')
      .insert([{
        jugador_id: jugadorId,
        etiqueta: item.decline.etiqueta,
        tier: item.decline.tier,
        valor: item.decline.valor,
        foto_url: declinePhotoUrl,
        mazos: item.decline.mazos,
        posicion_pista: item.posicion,
        continente_pista: item.continente,
        decada_pista: item.decline.decada,
        revisar: false
      }])
      .select()
      .single();

    if (vDeclineErr) {
      console.log(`  ❌ Error insertando declive: ${vDeclineErr.message}`);
    } else {
      console.log(`  ✅ Declive insertada: [${item.decline.etiqueta}] Tier ${item.decline.tier} ($${item.decline.valor})`);
      totalAdded++;
    }
  }

  console.log('\n===============================================================');
  console.log(` PROCESO FINALIZADO: ${totalAdded} versiones múltiples creadas (12 jugadores x 2)`);
  console.log('===============================================================\n');
}

run();
