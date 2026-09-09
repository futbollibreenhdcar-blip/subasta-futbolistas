import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createClient } from '@supabase/supabase-js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Asegurar que las variables estén en process.env para funciones serverless locales
  process.env.SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.ADMIN_SECRET = env.ADMIN_SECRET;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-agregar-jugador-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/agregar-jugador', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Método no permitido. Solo POST.' }));
              return;
            }

            // Validar header x-admin-secret
            const adminSecret = req.headers['x-admin-secret'];
            if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'No autorizado: x-admin-secret inválido o ausente.' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const { nombre_real, etiqueta, tier, valor, mazos, foto_base64, foto_url } = parsed;

                if (!nombre_real || !etiqueta || !tier || valor === undefined) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Faltan campos requeridos (nombre_real, etiqueta, tier, valor).' }));
                  return;
                }

                const supabase = createClient(
                  process.env.SUPABASE_URL,
                  process.env.SUPABASE_SERVICE_ROLE_KEY
                );

                let finalFotoUrl = foto_url;

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
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Error al subir foto: ' + uploadError.message }));
                    return;
                  }

                  const { data: publicUrlData } = supabase.storage
                    .from('fotos-jugadores')
                    .getPublicUrl(uploadData.path);

                  finalFotoUrl = publicUrlData.publicUrl;
                }

                // Buscar o insertar jugador
                const { data: existingPlayers } = await supabase
                  .from('jugadores')
                  .select('id, nombre_real')
                  .ilike('nombre_real', nombre_real.trim())
                  .limit(1);

                let jugadorId;
                if (existingPlayers && existingPlayers.length > 0) {
                  jugadorId = existingPlayers[0].id;
                } else {
                  const { data: newPlayer, error: insErr } = await supabase
                    .from('jugadores')
                    .insert([{ nombre_real: nombre_real.trim() }])
                    .select()
                    .single();

                  if (insErr) throw insErr;
                  jugadorId = newPlayer.id;
                }

                // Insertar versión
                const { data: newVersion, error: vErr } = await supabase
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

                if (vErr) throw vErr;

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, jugador_id: jugadorId, version: newVersion }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Error en servidor' }));
              }
            });
          });
        },
      },
    ],
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
      proxy: {
        '/sportsdb-api': {
          target: 'https://www.thesportsdb.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sportsdb-api/, ''),
        },
        '/sportsdb-images': {
          target: 'https://r2.thesportsdb.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/sportsdb-images/, ''),
        },
      },
    },
    optimizeDeps: {
      exclude: ['@imgly/background-removal'],
    },
  };
});
