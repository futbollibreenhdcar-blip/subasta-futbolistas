import { supabase } from './supabase';
import { Player, DeckType } from '../types';

/**
 * Trae todos los jugadores con sus versiones desde Supabase utilizando la Anon Key pública y RLS.
 * Opcionalmente filtra por mazo temático.
 */
export async function fetchPlayersFromSupabase(selectedDeck?: DeckType): Promise<Player[]> {
  const { data, error } = await supabase
    .from('jugadores')
    .select(`
      id,
      nombre_real,
      created_at,
      versiones (
        id,
        jugador_id,
        etiqueta,
        tier,
        valor,
        foto_url,
        mazos,
        revisar,
        posicion_pista,
        continente_pista,
        decada_pista,
        created_at
      )
    `)
    .order('nombre_real', { ascending: true });

  if (error) {
    console.error('Error al consultar jugadores en Supabase:', error);
    throw new Error('Error al conectar con Supabase: ' + error.message);
  }

  if (!data) return [];

  // Mapear los registros de Supabase a los modelos TypeScript de la app
  const mappedPlayers: Player[] = data.map((j: any) => ({
    id: j.id,
    name: j.nombre_real,
    createdAt: new Date(j.created_at || Date.now()).getTime(),
    versions: (j.versiones || [])
      .filter((v: any) => !v.revisar) // Excluir versiones marcadas para revisión manual
      .map((v: any) => ({
        id: v.id,
        versionTag: v.etiqueta,
        tier: v.tier,
        value: v.valor,
        decks: v.mazos || [],
        imageDataUrl: v.foto_url,
        posicionPista: v.posicion_pista,
        continentePista: v.continente_pista,
        decadaPista: v.decada_pista,
        revisar: v.revisar,
        createdAt: new Date(v.created_at || Date.now()).getTime(),
      })),
  })).filter((p) => p.versions.length > 0);

  // Filtrado por mazo si se especifica
  if (selectedDeck && selectedDeck !== 'mixto') {
    return mappedPlayers.filter((p) =>
      p.versions.some((v) => v.decks.includes(selectedDeck))
    );
  }

  return mappedPlayers;
}
