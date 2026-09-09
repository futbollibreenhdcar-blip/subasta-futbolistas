import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Cargar variables de .env
const envText = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envText.split('\n').filter(l => l.includes('=')).map(l => l.trim().split('=')));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const NON_PLAYERS_OR_SUSPICIOUS = [
  'Enzo Maresca',
  'Eduardo Coudet',
  'Diego Martínez',
  'Alberto Piernas',
  'Borja Álvarez',
  'Guillem Hernández',
  'Brian Fariñas',
  'Dro Fernández',
  'Arnau Ortiz',
  'Francisco Garcia'
];

const SOLID_BG_LEGENDS_TO_FLAG = [
  'Michel Platini',
  'Alfredo Di Stéfano',
  'Carlos Valderrama',
  'Hristo Stoichkov',
  'George Best'
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

async function uploadToStorage(name, buffer, contentType = 'image/png') {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `${safeName}_fixed_${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('fotos-jugadores')
    .upload(fileName, buffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;

  const { data: pubData } = supabase.storage
    .from('fotos-jugadores')
    .getPublicUrl(data.path);

  return pubData.publicUrl;
}

function determineClues(v, playerName) {
  const etiqueta = v.etiqueta || '';
  const mazos = v.mazos || [];

  // 1. Posición
  let posicion = 'Delantero';
  if (mazos.includes('arqueros') || playerName.includes('Buffon') || playerName.includes('Casillas') || playerName.includes('Courtois') || playerName.includes('ter Stegen') || playerName.includes('Neuer') || playerName.includes('Alisson') || playerName.includes('Ederson') || playerName.includes('Donnarumma') || playerName.includes('Oblak') || playerName.includes('Meret') || playerName.includes('Vicario') || playerName.includes('Sommer') || playerName.includes('Maignan') || playerName.includes('Kobel') || playerName.includes('Armani') || playerName.includes('Romero') || playerName.includes('Rossi') || playerName.includes('Costa') || playerName.includes('Trubin')) {
    posicion = 'Arquero';
  } else if (playerName.includes('Maldini') || playerName.includes('Beckenbauer') || playerName.includes('Ramos') || playerName.includes('van Dijk') || playerName.includes('Dias') || playerName.includes('Saliba') || playerName.includes('Gabriel') || playerName.includes('Militao') || playerName.includes('Rudiger') || playerName.includes('Bastoni') || playerName.includes('Romero') || playerName.includes('Gomez') || playerName.includes('Otamendi') || playerName.includes('Silva') || playerName.includes('Hakimi') || playerName.includes('Davies') || playerName.includes('Robertson') || playerName.includes('Porro') || playerName.includes('Pezzella') || playerName.includes('Acuña') || playerName.includes('Rojo')) {
    posicion = 'Defensa';
  } else if (playerName.includes('Zidane') || playerName.includes('Iniesta') || playerName.includes('Xavi') || playerName.includes('Platini') || playerName.includes('Gullit') || playerName.includes('Valderrama') || playerName.includes('Beckham') || playerName.includes('Gerrard') || playerName.includes('Lampard') || playerName.includes('Bellingham') || playerName.includes('De Bruyne') || playerName.includes('Rodri') || playerName.includes('Foden') || playerName.includes('Musiala') || playerName.includes('Kimmich') || playerName.includes('Pedri') || playerName.includes('Gavi') || playerName.includes('Rice') || playerName.includes('Odegaard') || playerName.includes('Fernandez') || playerName.includes('Caicedo') || playerName.includes('Barella') || playerName.includes('Calhanoglu') || playerName.includes('Modric') || playerName.includes('Kroos') || playerName.includes('Valverde') || playerName.includes('Mac Allister') || playerName.includes('Vitinha')) {
    posicion = 'Mediocampista';
  }

  // 2. Década
  let decada = 'Años 2020s';
  if (mazos.includes('leyendas') || etiqueta.includes('Leyenda')) {
    if (playerName.includes('Di Stéfano') || playerName.includes('Pelé') || playerName.includes('Best') || playerName.includes('Cruyff') || playerName.includes('Beckenbauer')) {
      decada = 'Siglo XX';
    } else if (playerName.includes('Maradona') || playerName.includes('Platini') || playerName.includes('Zico') || playerName.includes('Gullit') || playerName.includes('van Basten') || playerName.includes('Baggio') || playerName.includes('Stoichkov') || playerName.includes('Valderrama')) {
      decada = 'Años 1980s / 1990s';
    } else if (playerName.includes('Zidane') || playerName.includes('Ronaldo Nazário') || playerName.includes('Ronaldinho') || playerName.includes('Rivaldo') || playerName.includes('Romário') || playerName.includes('Figo') || playerName.includes('Beckham')) {
      decada = 'Años 2000s';
    } else {
      decada = 'Años 2010s';
    }
  } else if (etiqueta.includes('201')) {
    decada = 'Años 2010s';
  } else if (etiqueta.includes('200')) {
    decada = 'Años 2000s';
  }

  // 3. Continente
  let continente = 'Europa';
  const southAmericanClubs = ['River Plate', 'Boca Juniors', 'Flamengo', 'Palmeiras'];
  const isSouthAmericanClub = southAmericanClubs.some(c => etiqueta.includes(c));
  const southAmericanStars = [
    'Maradona', 'Pelé', 'Ronaldo', 'Ronaldinho', 'Rivaldo', 'Romário', 'Valderrama', 'Di Stéfano',
    'Messi', 'Vinícius', 'Neymar', 'Rodrygo', 'Valverde', 'Militao', 'Alvarez', 'Lautaro',
    'Mac Allister', 'Diaz', 'Suarez', 'Cavani', 'Falcao', 'Alisson', 'Ederson', 'Gabriel',
    'Endrick', 'Casemiro', 'Paqueta', 'Savinho', 'Estevao', 'Raphinha', 'Araujo', 'Romero'
  ];
  const isSouthAmericanStar = southAmericanStars.some(s => playerName.includes(s));
  const africanStars = ['Salah', 'Drogba', 'Mane', 'Osimhen', 'Hakimi', 'Bono', 'Mahrez', 'Koulibaly', 'Partey', 'Kudus'];
  const isAfrican = africanStars.some(a => playerName.includes(a));
  const asianStars = ['Son', 'Mitoma', 'Kubo', 'Endo', 'Tomiyasu', 'Minamino', 'Hwang', 'Kim'];
  const isAsian = asianStars.some(a => playerName.includes(a));

  if (isSouthAmericanClub || isSouthAmericanStar) {
    continente = 'Sudamérica';
  } else if (isAfrican) {
    continente = 'África';
  } else if (isAsian) {
    continente = 'Asia';
  }

  return { posicion, continente, decada };
}

async function run() {
  console.log('===============================================================');
  console.log(' AUDITORÍA, SANEAMIENTO Y LLENADO DE PISTAS EN SUPABASE');
  console.log('===============================================================');

  const { data: versiones, error } = await supabase
    .from('versiones')
    .select('id, foto_url, etiqueta, tier, valor, mazos, revisar, jugador_id, jugadores(id, nombre_real)');

  if (error) {
    console.error('Error obteniendo versiones:', error);
    return;
  }

  console.log(`Total versiones a auditar: ${versiones.length}`);

  let fotosReprocesadas = 0;
  let nombresCorregidos = 0;
  let marcadasParaRevisar = 0;
  let pistasLlenadas = 0;

  // 1. Corregir Xavi con su cutout oficial transparente
  const xaviVersion = versiones.find(v => v.jugadores?.nombre_real?.includes('Xavi'));
  if (xaviVersion) {
    try {
      console.log('\n🔄 Corrigiendo foto de Xavi Hernández con cutout transparente...');
      const xaviCutoutUrl = 'https://r2.thesportsdb.com/images/media/player/cutout/18olk11612092725.png';
      const buf = await fetchImageBuffer(xaviCutoutUrl);
      if (buf) {
        const newUrl = await uploadToStorage('Xavi_Hernandez', buf);
        await supabase
          .from('versiones')
          .update({ foto_url: newUrl, revisar: false })
          .eq('id', xaviVersion.id);
        console.log('✅ Foto de Xavi actualizada a PNG transparente en Supabase Storage');
        fotosReprocesadas++;
      }
    } catch (e) {
      console.error('Error actualizando foto de Xavi:', e.message);
    }
  }

  // 2. Corregir y auditar cada versión
  for (const v of versiones) {
    const playerName = v.jugadores?.nombre_real || '';
    let shouldFlagReview = false;

    // Verificar si es staff/técnico o homónimo dudoso
    const isSuspicious = NON_PLAYERS_OR_SUSPICIOUS.some(sp => playerName.toLowerCase().includes(sp.toLowerCase()));
    const isSolidBgLegend = SOLID_BG_LEGENDS_TO_FLAG.some(lg => playerName.toLowerCase().includes(lg.toLowerCase()));

    if (isSuspicious || isSolidBgLegend) {
      shouldFlagReview = true;
      marcadasParaRevisar++;
    }

    // Calcular pistas
    const { posicion, continente, decada } = determineClues(v, playerName);

    // Actualizar registro con pistas y flag de revisión
    await supabase
      .from('versiones')
      .update({
        revisar: shouldFlagReview,
        posicion_pista: posicion,
        continente_pista: continente,
        decada_pista: decada
      })
      .eq('id', v.id);

    pistasLlenadas++;
  }

  console.log('\n===============================================================');
  console.log(' RESUMEN DE AUDITORÍA');
  console.log('===============================================================');
  console.log(`Total registros procesados: ${versiones.length}`);
  console.log(`Fotos reprocesadas/reemplazadas con recorte limpio: ${fotosReprocesadas}`);
  console.log(`Nombres/cargos marcados en columna "revisar" (técnicos/staff/dudosos): ${marcadasParaRevisar}`);
  console.log(`Registros con datos de pistas cargados (posición/continente/década): ${pistasLlenadas}`);
  console.log('===============================================================\n');
}

run();
