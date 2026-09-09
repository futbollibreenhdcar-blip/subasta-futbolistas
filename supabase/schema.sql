-- ==============================================================================
-- SCHEMA SUBASTA A CIEGAS DE FUTBOLISTAS
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.
-- Crea las tablas 'jugadores' y 'versiones', activa Row Level Security (RLS)
-- con SELECT público e INSERT/UPDATE/DELETE bloqueados para 'anon',
-- y configura el bucket público 'fotos-jugadores'.
-- ==============================================================================

-- 1. TABLA JUGADORES
CREATE TABLE IF NOT EXISTS public.jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_real TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA VERSIONES
CREATE TABLE IF NOT EXISTS public.versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id UUID NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
    etiqueta TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('S', 'A', 'B', 'C', 'D')),
    valor INT NOT NULL,
    foto_url TEXT NOT NULL,
    mazos TEXT[] NOT NULL DEFAULT '{}',
    revisar BOOLEAN DEFAULT FALSE,
    posicion_pista TEXT,
    continente_pista TEXT,
    decada_pista TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ÍNDICES DE BÚSQUEDA Y RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_jugadores_nombre ON public.jugadores(nombre_real);
CREATE INDEX IF NOT EXISTS idx_versiones_jugador_id ON public.versiones(jugador_id);
CREATE INDEX IF NOT EXISTS idx_versiones_tier ON public.versiones(tier);
CREATE INDEX IF NOT EXISTS idx_versiones_mazos ON public.versiones USING GIN(mazos);

-- 4. ROW LEVEL SECURITY (RLS)
-- Activar RLS en ambas tablas
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versiones ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores si existieran
DROP POLICY IF EXISTS "Permitir SELECT publico a jugadores" ON public.jugadores;
DROP POLICY IF EXISTS "Permitir SELECT publico a versiones" ON public.versiones;

-- Política 1: Lectura pública (SELECT) para todos (anon y authenticated)
CREATE POLICY "Permitir SELECT publico a jugadores" 
    ON public.jugadores 
    FOR SELECT 
    USING (true);

CREATE POLICY "Permitir SELECT publico a versiones" 
    ON public.versiones 
    FOR SELECT 
    USING (true);

-- NOTA: No se crean políticas para INSERT, UPDATE o DELETE para 'anon',
-- por lo que cualquier modificación intentada desde el navegador sin service_role
-- quedará automáticamente denegada y bloqueada por RLS.
-- Las operaciones de inserción y administración se realizan mediante service_role.

-- 5. BUCKET DE STORAGE "fotos-jugadores"
-- Crear bucket público para lectura de imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-jugadores', 'fotos-jugadores', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para fotos-jugadores
DROP POLICY IF EXISTS "Permitir lectura publica fotos-jugadores" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida service_role fotos-jugadores" ON storage.objects;

-- Lectura pública para cualquier usuario:
CREATE POLICY "Permitir lectura publica fotos-jugadores"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'fotos-jugadores');

-- Modificación/Subida restringida (service_role bypasses RLS automáticamente):
CREATE POLICY "Permitir subida autenticada fotos-jugadores"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'fotos-jugadores');
