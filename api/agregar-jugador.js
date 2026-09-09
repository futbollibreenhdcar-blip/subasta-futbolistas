import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function: /api/agregar-jugador
 * Protegida mediante el header 'x-admin-secret' = process.env.ADMIN_SECRET
 * Utiliza la Service Role Key de Supabase para:
 * 1. Subir la foto transparente al bucket 'fotos-jugadores'
 * 2. Insertar o buscar al jugador en la tabla 'jugadores'
 * 3. Insertar la versión correspondiente en la tabla 'versiones'
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Solo POST.' });
  }

  const adminSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret || adminSecret !== expectedSecret) {
    return res.status(401).json({ error: 'No autorizado: x-admin-secret inválido o ausente.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Variables SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY no configuradas en el servidor.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { nombre_real, etiqueta, tier, valor, mazos, foto_base64, foto_url } = req.body;

    if (!nombre_real || !etiqueta || !tier || valor === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos (nombre_real, etiqueta, tier, valor).' });
    }

    let finalFotoUrl = foto_url;

    // Si viene foto en base64, subirla directamente al bucket fotos-jugadores
    if (foto_base64) {
      const base64Data = foto_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-jugadores')
        .upload(filename, buffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        return res.status(500).json({ error: 'Error al subir foto al bucket: ' + uploadError.message });
      }

      const { data: publicUrlData } = supabase.storage
        .from('fotos-jugadores')
        .getPublicUrl(uploadData.path);

      finalFotoUrl = publicUrlData.publicUrl;
    }

    if (!finalFotoUrl) {
      return res.status(400).json({ error: 'Se requiere foto_base64 o foto_url.' });
    }

    // Buscar si el jugador ya existe por nombre
    const { data: existingPlayers, error: searchError } = await supabase
      .from('jugadores')
      .select('id, nombre_real')
      .ilike('nombre_real', nombre_real.trim())
      .limit(1);

    if (searchError) {
      return res.status(500).json({ error: 'Error consultando jugadores: ' + searchError.message });
    }

    let jugadorId;
    if (existingPlayers && existingPlayers.length > 0) {
      jugadorId = existingPlayers[0].id;
    } else {
      const { data: newPlayer, error: insertPlayerError } = await supabase
        .from('jugadores')
        .insert([{ nombre_real: nombre_real.trim() }])
        .select()
        .single();

      if (insertPlayerError) {
        return res.status(500).json({ error: 'Error insertando jugador: ' + insertPlayerError.message });
      }
      jugadorId = newPlayer.id;
    }

    // Insertar la versión
    const { data: newVersion, error: insertVersionError } = await supabase
      .from('versiones')
      .insert([
        {
          jugador_id: jugadorId,
          etiqueta: etiqueta.trim(),
          tier,
          valor: parseInt(valor, 10),
          foto_url: finalFotoUrl,
          mazos: Array.isArray(mazos) ? mazos : [],
        },
      ])
      .select()
      .single();

    if (insertVersionError) {
      return res.status(500).json({ error: 'Error insertando versión: ' + insertVersionError.message });
    }

    return res.status(200).json({
      success: true,
      jugador_id: jugadorId,
      version: newVersion,
    });
  } catch (err) {
    console.error('Error en /api/agregar-jugador:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
}
