import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Cargar variables de .env si no están en process.env
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const envText = fs.readFileSync('.env', 'utf-8');
    for (const line of envText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [k, ...v] = trimmed.split('=');
      const val = v.join('=').trim();
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = val;
      }
    }
  } catch (e) {}
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TIER_RULES = {
  'Real Madrid': 'S',
  'Barcelona': 'S',
  'Manchester City': 'S',
  'Bayern Munich': 'S',
  'Paris Saint-Germain': 'S',
  'Liverpool': 'A',
  'Manchester United': 'A',
  'Arsenal': 'A',
  'Chelsea': 'A',
  'Juventus': 'A',
  'AC Milan': 'A',
  'Inter Milan': 'A',
  'Atletico Madrid': 'A',
  'Borussia Dortmund': 'A',
  'River Plate': 'B',
  'Boca Juniors': 'B',
  'Flamengo': 'B',
  'Palmeiras': 'B',
  'Ajax': 'B',
  'Porto': 'B',
  'Benfica': 'B',
  'Sevilla': 'B',
  'Napoli': 'B',
  'Tottenham Hotspur': 'B',
};

const VALUES = {
  S: 100,
  A: 70,
  B: 45,
  C: 25,
};

const TEAMS_CONFIG = [
  { name: 'Real Madrid', id: '133738', tier: 'S' },
  { name: 'Barcelona', id: '133739', tier: 'S' },
  { name: 'Manchester City', id: '133613', tier: 'S' },
  { name: 'Bayern Munich', id: '133664', tier: 'S' },
  { name: 'Paris Saint-Germain', id: '133714', tier: 'S' },
  { name: 'Liverpool', id: '133602', tier: 'A' },
  { name: 'Manchester United', id: '133612', tier: 'A' },
  { name: 'Arsenal', id: '133604', tier: 'A' },
  { name: 'Chelsea', id: '133610', tier: 'A' },
  { name: 'Juventus', id: '133676', tier: 'A' },
  { name: 'AC Milan', id: '133667', tier: 'A' },
  { name: 'Inter Milan', id: '133681', tier: 'A' },
  { name: 'Atletico Madrid', id: '133729', tier: 'A' },
  { name: 'Borussia Dortmund', id: '133650', tier: 'A' },
  { name: 'River Plate', id: '135171', tier: 'B' },
  { name: 'Boca Juniors', id: '135156', tier: 'B' },
  { name: 'Flamengo', id: '134287', tier: 'B' },
  { name: 'Palmeiras', id: '134465', tier: 'B' },
  { name: 'Ajax', id: '133772', tier: 'B' },
  { name: 'Porto', id: '134114', tier: 'B' },
  { name: 'Benfica', id: '134108', tier: 'B' },
  { name: 'Sevilla', id: '133735', tier: 'B' },
  { name: 'Napoli', id: '133670', tier: 'B' },
  { name: 'Tottenham Hotspur', id: '133616', tier: 'B' },
];

const ADDITIONAL_SQUAD_PLAYERS = {
  'Manchester City': [
    'Erling Haaland', 'Kevin De Bruyne', 'Phil Foden', 'Bernardo Silva', 'Rodri',
    'Ederson', 'Josko Gvardiol', 'Ruben Dias', 'Manuel Akanji', 'John Stones',
    'Jack Grealish', 'Jeremy Doku', 'Savinho', 'Mateo Kovacic', 'Ilkay Gundogan',
    'Rico Lewis', 'Matheus Nunes', 'Stefan Ortega'
  ],
  'Bayern Munich': [
    'Harry Kane', 'Jamal Musiala', 'Leroy Sane', 'Kingsley Coman', 'Michael Olise',
    'Serge Gnabry', 'Joshua Kimmich', 'Leon Goretzka', 'Alphonso Davies', 'Dayot Upamecano',
    'Kim Min-jae', 'Manuel Neuer', 'Mathys Tel', 'Konrad Laimer', 'Joao Palhinha',
    'Aleksandar Pavlovic', 'Raphael Guerreiro', 'Sven Ulreich'
  ],
  'Paris Saint-Germain': [
    'Ousmane Dembele', 'Bradley Barcola', 'Randal Kolo Muani', 'Marco Asensio',
    'Vitinha', 'Warren Zaire-Emery', 'Fabian Ruiz', 'Joao Neves', 'Achraf Hakimi',
    'Marquinhos', 'Lucas Beraldo', 'Willian Pacho', 'Nuno Mendes', 'Gianluigi Donnarumma',
    'Matvey Safonov', 'Kang-in Lee', 'Lucas Hernandez'
  ],
  'Liverpool': [
    'Mohamed Salah', 'Virgil van Dijk', 'Trent Alexander-Arnold', 'Alisson Becker',
    'Alexis Mac Allister', 'Dominik Szoboszlai', 'Luis Diaz', 'Darwin Nunez',
    'Cody Gakpo', 'Diogo Jota', 'Ryan Gravenberch', 'Curtis Jones', 'Andy Robertson',
    'Ibrahima Konate', 'Joe Gomez', 'Caoimhin Kelleher', 'Harvey Elliott', 'Federico Chiesa'
  ],
  'Manchester United': [
    'Bruno Fernandes', 'Marcus Rashford', 'Rasmus Hojlund', 'Alejandro Garnacho',
    'Kobbie Mainoo', 'Casemiro', 'Mason Mount', 'Lisandro Martinez', 'Matthijs de Ligt',
    'Andre Onana', 'Diogo Dalot', 'Luke Shaw', 'Amad Diallo', 'Christian Eriksen',
    'Joshua Zirkzee', 'Harry Maguire', 'Manuel Ugarte'
  ],
  'Arsenal': [
    'Bukayo Saka', 'Martin Odegaard', 'Declan Rice', 'Kai Havertz', 'Gabriel Martinelli',
    'Gabriel Jesus', 'Leandro Trossard', 'Thomas Partey', 'Mikel Merino', 'William Saliba',
    'Gabriel Magalhaes', 'Ben White', 'Jurrien Timber', 'Riccardo Calafiori', 'David Raya',
    'Jorginho', 'Raheem Sterling'
  ],
  'Chelsea': [
    'Cole Palmer', 'Nicolas Jackson', 'Christopher Nkunku', 'Noni Madueke',
    'Enzo Fernandez', 'Moises Caicedo', 'Romeo Lavia', 'Pedro Neto', 'Jadon Sancho',
    'Reece James', 'Malo Gusto', 'Marc Cucurella', 'Levi Colwill', 'Robert Sanchez',
    'Joao Felix', 'Axel Disasi'
  ],
  'Juventus': [
    'Dusan Vlahovic', 'Kenan Yildiz', 'Teun Koopmeiners', 'Douglas Luiz',
    'Manuel Locatelli', 'Khephren Thuram', 'Nico Gonzalez', 'Francisco Conceicao',
    'Andrea Cambiaso', 'Bremer', 'Federico Gatti', 'Pierre Kalulu', 'Michele Di Gregorio',
    'Weston McKennie', 'Timothy Weah', 'Arkadiusz Milik'
  ],
  'AC Milan': [
    'Rafael Leao', 'Christian Pulisic', 'Alvaro Morata', 'Theo Hernandez',
    'Tijjani Reijnders', 'Youssouf Fofana', 'Ruben Loftus-Cheek', 'Mike Maignan',
    'Fikayo Tomori', 'Strahinja Pavlovic', 'Davide Calabria', 'Emerson Royal',
    'Samuel Chukwueze', 'Tammy Abraham', 'Yunus Musah', 'Ismael Bennacer'
  ],
  'Inter Milan': [
    'Lautaro Martinez', 'Marcus Thuram', 'Nicolo Barella', 'Hakan Calhanoglu',
    'Henrikh Mkhitaryan', 'Federico Dimarco', 'Denzel Dumfries', 'Alessandro Bastoni',
    'Benjamin Pavard', 'Yann Sommer', 'Francesco Acerbi', 'Davide Frattesi',
    'Mehdi Taremi', 'Piotr Zielinski', 'Carlos Augusto', 'Stefan de Vrij'
  ],
  'Atletico Madrid': [
    'Antoine Griezmann', 'Julian Alvarez', 'Alexander Sorloth', 'Rodrigo De Paul',
    'Koke', 'Conor Gallagher', 'Marcos Llorente', 'Samuel Lino', 'Robin Le Normand',
    'Jose Maria Gimenez', 'Reinildo', 'Jan Oblak', 'Nahuel Molina', 'Axel Witsel',
    'Angel Correa', 'Clement Lenglet'
  ],
  'Borussia Dortmund': [
    'Serhou Guirassy', 'Julian Brandt', 'Karim Adeyemi', 'Donyell Malen',
    'Marcel Sabitzer', 'Emre Can', 'Pascal Gross', 'Jamie Gittens',
    'Nico Schlotterbeck', 'Waldemar Anton', 'Yan Couto', 'Gregor Kobel',
    'Niklas Sule', 'Felix Nmecha', 'Ramy Bensebaini', 'Julian Ryerson'
  ],
  'River Plate': [
    'Franco Armani', 'German Pezzella', 'Marcos Acuna', 'Paulo Diaz',
    'Fabricio Bustos', 'Enzo Diaz', 'Matias Kranevitter', 'Rodrigo Aliendro',
    'Ignacio Fernandez', 'Manuel Lanzini', 'Franco Mastantuono', 'Claudio Echeverri',
    'Miguel Borja', 'Facundo Colidio', 'Adam Bareiro', 'Rodrigo Villagra', 'Jeremias Ledesma'
  ],
  'Boca Juniors': [
    'Sergio Romero', 'Leandro Brey', 'Luis Advincula', 'Cristian Lema',
    'Marcos Rojo', 'Lautaro Blanco', 'Aaron Anselmino', 'Ignacio Miramon',
    'Cristian Medina', 'Kevin Zenon', 'Tomas Belmonte', 'Agustin Martegani',
    'Miguel Merentiel', 'Edinson Cavani', 'Milton Gimenez', 'Exequiel Zeballos'
  ],
  'Flamengo': [
    'Gabriel Barbosa', 'Pedro', 'Giorgian de Arrascaeta', 'Nicolas de la Cruz',
    'Gerson', 'Everton Cebolinha', 'Luiz Araujo', 'Carlos Alcaraz', 'Erick Pulgar',
    'Ayrton Lucas', 'Fabricio Bruno', 'Leo Ortiz', 'Alex Sandro', 'Agustin Rossi',
    'Michael', 'Gonzalo Plata'
  ],
  'Palmeiras': [
    'Weverton', 'Gustavo Gomez', 'Murilo', 'Joaquin Piquerez', 'Marcos Rocha',
    'Mayke', 'Anibal Moreno', 'Ze Rafael', 'Richard Rios', 'Raphael Veiga',
    'Mauricio', 'Felipe Anderson', 'Estevao', 'Rony', 'Jose Lopez', 'Dudu'
  ],
  'Ajax': [
    'Remko Pasveer', 'Josip Sutalo', 'Devyne Rensch', 'Jorrel Hato',
    'Jordan Henderson', 'Kenneth Taylor', 'Branco van den Boomen', 'Davy Klaassen',
    'Kian Fitz-Jim', 'Bertrand Traore', 'Steven Berghuis', 'Mika Godts',
    'Brian Brobbey', 'Wout Weghorst', 'Chuba Akpom', 'Youri Baas'
  ],
  'Porto': [
    'Diogo Costa', 'Joao Mario', 'Nehuen Perez', 'Ze Pedro', 'Francisco Moura',
    'Alan Varela', 'Stephen Eustaquio', 'Nico Gonzalez', 'Vasco Sousa', 'Pepe',
    'Ivan Jaime', 'Galeno', 'Fabio Vieira', 'Danny Namaso', 'Samu Omorodion', 'Wendell'
  ],
  'Benfica': [
    'Anatoliy Trubin', 'Alexander Bah', 'Nicolas Otamendi', 'Antonio Silva',
    'Alvaro Carreras', 'Florentino Luis', 'Leandro Barreiro', 'Orkun Kokcu',
    'Fredrik Aursnes', 'Angel Di Maria', 'Kerem Akturkoglu', 'Gianluca Prestianni',
    'Zeki Amdouni', 'Arthur Cabral', 'Vangelis Pavlidis', 'Renato Sanches'
  ],
  'Sevilla': [
    'Orjan Nyland', 'Jesus Navas', 'Loic Bade', 'Marcao', 'Kike Salas',
    'Adria Pedrosa', 'Valentin Barco', 'Nemanja Gudelj', 'Lucien Agoume',
    'Saul Niguez', 'Albert Sambi Lokonga', 'Djibril Sow', 'Dodi Lukebakio',
    'Chidera Ejuke', 'Isaac Romero', 'Kelechi Iheanacho', 'Suso'
  ],
  'Napoli': [
    'Alex Meret', 'Giovanni Di Lorenzo', 'Amir Rrahmani', 'Alessandro Buongiorno',
    'Mathias Olivera', 'Leonardo Spinazzola', 'Stanislav Lobotka', 'Andre-Frank Zambo Anguissa',
    'Scott McTominay', 'Billy Gilmour', 'Matteo Politano', 'David Neres',
    'Khvicha Kvaratskhelia', 'Romelu Lukaku', 'Giacomo Raspadori', 'Giovanni Simeone'
  ],
  'Tottenham Hotspur': [
    'Guglielmo Vicario', 'Pedro Porro', 'Cristian Romero', 'Micky van de Ven',
    'Destiny Udogie', 'Radu Dragusin', 'Yves Bissouma', 'Pape Matar Sarr',
    'Rodrigo Bentancur', 'James Maddison', 'Dejan Kulusevski', 'Son Heung-min',
    'Brennan Johnson', 'Dominic Solanke', 'Richarlison', 'Timo Werner'
  ],
};

const LEGENDS_LIST = [
  { name: 'Diego Maradona', queries: ['Diego Maradona', 'Maradona'] },
  { name: 'Pelé', queries: ['Pelé', 'Edson Arantes do Nascimento', 'Pele'] },
  { name: 'Zinedine Zidane', queries: ['Zinedine Zidane', 'Zidane'] },
  { name: 'Ronaldo Nazário', queries: ['Ronaldo Luís Nazário de Lima', 'Ronaldo Nazario', 'Ronaldo'] },
  { name: 'Ronaldinho', queries: ['Ronaldinho', 'Ronaldinho Gaúcho'] },
  { name: 'Johan Cruyff', queries: ['Johan Cruyff', 'Johan Cruijff', 'Cruyff'] },
  { name: 'Franz Beckenbauer', queries: ['Franz Beckenbauer', 'Beckenbauer'] },
  { name: 'Michel Platini', queries: ['Michel Platini', 'Platini'] },
  { name: 'George Best', queries: ['George Best'] },
  { name: 'Alfredo Di Stéfano', queries: ['Alfredo Di Stéfano', 'Alfredo Di Stefano', 'Di Stefano'] },
  { name: 'Roberto Baggio', queries: ['Roberto Baggio', 'Baggio'] },
  { name: 'Andrés Iniesta', queries: ['Andrés Iniesta', 'Andres Iniesta', 'Iniesta'] },
  { name: 'Xavi Hernández', queries: ['Xavi Hernández', 'Xavi Hernandez', 'Xavi'] },
  { name: 'Paolo Maldini', queries: ['Paolo Maldini', 'Maldini'] },
  { name: 'Kaká', queries: ['Kaká', 'Ricardo Kaka', 'Kaka'] },
  { name: 'Thierry Henry', queries: ['Thierry Henry', 'Henry'] },
  { name: 'Ruud Gullit', queries: ['Ruud Gullit', 'Gullit'] },
  { name: 'Marco van Basten', queries: ['Marco van Basten', 'Van Basten'] },
  { name: 'Gianluigi Buffon', queries: ['Gianluigi Buffon', 'Buffon'], isGk: true },
  { name: 'Iker Casillas', queries: ['Iker Casillas', 'Casillas'], isGk: true },
  { name: 'Carlos Valderrama', queries: ['Carlos Valderrama', 'Valderrama'] },
  { name: 'Hristo Stoichkov', queries: ['Hristo Stoichkov', 'Stoichkov'] },
  { name: 'Rivaldo', queries: ['Rivaldo'] },
  { name: 'Romário', queries: ['Romário', 'Romario'] },
  { name: 'David Beckham', queries: ['David Beckham', 'Beckham'] },
  { name: 'Steven Gerrard', queries: ['Steven Gerrard', 'Gerrard'] },
  { name: 'Frank Lampard', queries: ['Frank Lampard', 'Lampard'] },
  { name: 'Didier Drogba', queries: ['Didier Drogba', 'Drogba'] },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch seguro con reintentos automáticos para TheSportsDB (Cloudflare rate limit 429)
async function fetchSportsJson(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (res.status === 429) {
        const retrySec = parseInt(res.headers.get('retry-after') || '14', 10);
        console.log(`\n⏳ [Rate-limit 429] Esperando ${retrySec}s según cabecera Cloudflare...`);
        await sleep((retrySec + 1) * 1000);
        continue;
      }

      if (!res.ok) {
        if (attempt < maxRetries) {
          await sleep(2000);
          continue;
        }
        return null;
      }

      const text = await res.text();
      if (!text || !text.trim().startsWith('{')) {
        // Puede ser página HTML de Cloudflare temporal
        if (attempt < maxRetries) {
          console.log(`\n⚠️ Respuesta HTML recibida, esperando 10s...`);
          await sleep(10000);
          continue;
        }
        return null;
      }

      return JSON.parse(text);
    } catch (e) {
      if (attempt < maxRetries) {
        await sleep(2000);
        continue;
      }
      return null;
    }
  }
  return null;
}

async function fetchImageBuffer(url) {
  if (!url) return null;
  // Intentar primero con el proxy weserv
  const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(weservUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 500) return buf;
    }
  } catch (e) {}

  // Fallback directo
  try {
    const res2 = await fetch(url);
    if (res2.ok) {
      const buf = Buffer.from(await res2.arrayBuffer());
      if (buf.length > 500) return buf;
    }
  } catch (e) {}

  return null;
}

// Subir foto a Supabase Storage y retornar URL pública
async function uploadPhotoToStorage(playerName, photoUrl) {
  const buf = await fetchImageBuffer(photoUrl);
  if (!buf) return null;

  const safeName = playerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `${safeName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('fotos-jugadores')
    .upload(fileName, buf, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error(`Error subiendo foto para ${playerName}:`, uploadError.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('fotos-jugadores')
    .getPublicUrl(uploadData.path);

  return publicUrlData.publicUrl;
}

// Guardar o verificar jugador en Supabase
async function savePlayerAndVersion({ nombreReal, etiqueta, tier, valor, mazos, photoUrl }) {
  // 1. Comprobar si el jugador ya existe por nombre
  const { data: existingPlayer } = await supabase
    .from('jugadores')
    .select('id, nombre_real')
    .ilike('nombre_real', nombreReal.trim())
    .limit(1);

  let jugadorId;
  if (existingPlayer && existingPlayer.length > 0) {
    jugadorId = existingPlayer[0].id;
  } else {
    const { data: newP, error: pErr } = await supabase
      .from('jugadores')
      .insert([{ nombre_real: nombreReal.trim() }])
      .select()
      .single();

    if (pErr) throw pErr;
    jugadorId = newP.id;
  }

  // 2. Comprobar si ya existe una versión con esta misma etiqueta o foto
  const { data: existingVersion } = await supabase
    .from('versiones')
    .select('id')
    .eq('jugador_id', jugadorId)
    .eq('etiqueta', etiqueta)
    .limit(1);

  if (existingVersion && existingVersion.length > 0) {
    return { skipped: true, jugadorId, versionId: existingVersion[0].id };
  }

  // 3. Subir foto al storage
  const finalPhotoUrl = await uploadPhotoToStorage(nombreReal, photoUrl);
  if (!finalPhotoUrl) {
    throw new Error('No se pudo descargar/subir la foto');
  }

  // 4. Insertar versión
  const { data: newV, error: vErr } = await supabase
    .from('versiones')
    .insert([
      {
        jugador_id: jugadorId,
        etiqueta,
        tier,
        valor,
        foto_url: finalPhotoUrl,
        mazos,
      },
    ])
    .select()
    .single();

  if (vErr) throw vErr;

  return { skipped: false, jugadorId, versionId: newV.id, finalPhotoUrl };
}

async function run() {
  console.log('========================================================================');
  console.log(' INICIANDO IMPORTACIÓN MASIVA COMPLETA A SUPABASE (~700 JUGADORES)');
  console.log('========================================================================');

  let totalNewImported = 0;
  let totalAlreadyExisting = 0;
  let totalErrors = 0;

  // -------------------------------------------------------------------------
  // PARTE 1: FUENTE A — 24 CLUBES TOP (ESTRELLAS ACTUALES)
  // -------------------------------------------------------------------------
  console.log('\n--- PARTE 1: 24 CLUBES TOP (Fuente A) ---');

  for (const team of TEAMS_CONFIG) {
    console.log(`\n⚽ Procesando club: ${team.name} (Tier ${team.tier}, Valor $${VALUES[team.tier]})...`);
    const tier = team.tier;
    const valor = VALUES[tier];
    const etiqueta = `${team.name} 2026`;

    // 1. Obtener lista desde TheSportsDB por ID de equipo
    const rosterData = await fetchSportsJson(`https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${team.id}`);
    await sleep(1000);

    const rawPlayers = [];
    if (rosterData?.player) {
      rawPlayers.push(...rosterData.player);
    }

    // 2. Jugadores adicionales para completar plantel amplio
    const extraNames = ADDITIONAL_SQUAD_PLAYERS[team.name] || [];
    for (const name of extraNames) {
      const pData = await fetchSportsJson(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`);
      await sleep(1000);
      if (pData?.player?.[0]) {
        rawPlayers.push(pData.player[0]);
      }
    }

    // Deduplicar jugadores por nombre
    const uniqueMap = new Map();
    for (const p of rawPlayers) {
      if (!p.strPlayer) continue;
      const norm = p.strPlayer.toLowerCase().trim();
      if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, p);
      }
    }

    console.log(`  📋 ${uniqueMap.size} jugadores listados para ${team.name}`);

    for (const [, player] of uniqueMap) {
      const photoUrl = player.strCutout || player.strThumb;
      if (!photoUrl) {
        continue;
      }

      const isGk = (player.strPosition || '').toLowerCase().includes('goal') || 
                   (player.strPosition || '').toLowerCase().includes('portero') ||
                   (player.strPosition || '').toLowerCase().includes('arquero');
      const mazos = isGk ? ['estrellas_actuales', 'arqueros'] : ['estrellas_actuales'];

      try {
        process.stdout.write(`    ⏳ ${player.strPlayer}... `);
        const res = await savePlayerAndVersion({
          nombreReal: player.strPlayer,
          etiqueta,
          tier,
          valor,
          mazos,
          photoUrl,
        });

        if (res.skipped) {
          console.log(`⏩ ya existe`);
          totalAlreadyExisting++;
        } else {
          console.log(`✅ insertado [${tier} | $${valor}]`);
          totalNewImported++;
        }
      } catch (err) {
        console.log(`❌ error: ${err.message}`);
        totalErrors++;
      }
    }
  }

  // -------------------------------------------------------------------------
  // PARTE 2: FUENTE B — 28 LEYENDAS Y RETIRADOS
  // -------------------------------------------------------------------------
  console.log('\n--- PARTE 2: 28 LEYENDAS (Fuente B) ---');

  for (const legend of LEGENDS_LIST) {
    console.log(`\n👑 Buscando Leyenda: ${legend.name}...`);
    let foundPlayer = null;

    for (const q of legend.queries) {
      const data = await fetchSportsJson(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(q)}`);
      await sleep(1000);

      if (data?.player && data.player.length > 0) {
        // Encontrar la mejor coincidencia de fútbol
        const soccerList = data.player.filter(p => !p.strSport || p.strSport.toLowerCase() === 'soccer');
        foundPlayer = soccerList.find(p => p.strCutout || p.strThumb) || soccerList[0] || data.player[0];
        if (foundPlayer && (foundPlayer.strCutout || foundPlayer.strThumb)) {
          break;
        }
      }
    }

    if (!foundPlayer || (!foundPlayer.strCutout && !foundPlayer.strThumb)) {
      console.log(`  ❌ No se encontró foto para leyenda: ${legend.name}`);
      totalErrors++;
      continue;
    }

    const photoUrl = foundPlayer.strCutout || foundPlayer.strThumb;
    const isGk = legend.isGk || (foundPlayer.strPosition || '').toLowerCase().includes('goal');
    const mazos = isGk ? ['leyendas', 'arqueros'] : ['leyendas'];

    try {
      process.stdout.write(`    ⏳ Guardando ${legend.name}... `);
      const res = await savePlayerAndVersion({
        nombreReal: legend.name,
        etiqueta: `Leyenda Histórica`,
        tier: 'S',
        valor: 100,
        mazos,
        photoUrl,
      });

      if (res.skipped) {
        console.log(`⏩ ya existe`);
        totalAlreadyExisting++;
      } else {
        console.log(`✅ insertada leyenda [S | $100 | ${mazos.join(',')}]`);
        totalNewImported++;
      }
    } catch (err) {
      console.log(`❌ error: ${err.message}`);
      totalErrors++;
    }
  }

  // -------------------------------------------------------------------------
  // RESUMEN FINAL DIRECTO DE SUPABASE
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(' CONSULTANDO ESTADÍSTICAS FINALES EN SUPABASE...');
  console.log('========================================================================');

  const { count: finalJugadores } = await supabase.from('jugadores').select('id', { count: 'exact', head: true });
  const { data: allVersiones, count: finalVersiones } = await supabase.from('versiones').select('id, tier, mazos');

  const tiersCount = {};
  const mazosCount = {};
  for (const v of allVersiones || []) {
    tiersCount[v.tier] = (tiersCount[v.tier] || 0) + 1;
    for (const m of v.mazos || []) {
      mazosCount[m] = (mazosCount[m] || 0) + 1;
    }
  }

  console.log(`Total Jugadores en Supabase: ${finalJugadores}`);
  console.log(`Total Versiones en Supabase: ${finalVersiones}`);
  console.log(`Nuevos insertados en esta sesión: ${totalNewImported}`);
  console.log(`Ya existentes (saltados): ${totalAlreadyExisting}`);
  console.log(`Errores: ${totalErrors}`);
  console.log('\nDesglose por Tier:');
  for (const [t, count] of Object.entries(tiersCount)) {
    console.log(`  - Tier ${t}: ${count}`);
  }
  console.log('\nDesglose por Mazo:');
  for (const [m, count] of Object.entries(mazosCount)) {
    console.log(`  - Mazo "${m}": ${count}`);
  }
  console.log('========================================================================\n');
}

run();
