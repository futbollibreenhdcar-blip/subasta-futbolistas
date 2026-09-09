# Subasta de Futbolistas — Siluetas & Draft Lounge ⚽🏆

Juego interactivo multijugador local estilo subasta a ciegas de futbolistas. Los participantes pujan por siluetas recortadas con IA sin saber el nombre exacto del jugador hasta adjudicarlo, comparando el precio pagado contra su valor real de mercado.

## Características

- 👤 **Siluetas de Alta Definición:** Estrado luminoso de fondo blanco para apreciar cada contorno anatómico y corte de cabello.
- ⚡ **Catálogo en la Nube con Supabase:** Más de 700 futbolistas reales importados con fotos transparentes, tiers (S, A, B, C, D) y mazos temáticos (Leyendas, Estrellas Actuales, Arqueros, Retirados).
- 💡 **Sistema de Pistas Tácticas:** Pistas durante la puja (Posición, Época, Nacionalidad, Procedencia) con multiplicador de costo.
- 💰 **Motor Financiero de Subasta:** Sistema de pases consecutivos, saldo por manager y veredictos instantáneos (¡Ganga! vs. Sobrepago).
- 🏆 **Pantalla Final de Premiación:** Podio al "Mejor Manager" (mayor ratio rentabilidad) y "El Robo de la Noche" (jugador más estafado).
- ✂️ **Panel de Administración (`/admin`):** Búsqueda directa en TheSportsDB, recorte automático con `@imgly/background-removal` y guardado directo en Supabase Storage y Base de Datos.

## Configuración y Despliegue en Vercel

### Variables de Entorno

Configurar las siguientes variables en Vercel o en un archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_privada_service_role
ADMIN_SECRET=tu_clave_admin_secreta
```

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo local Vite con proxies API.
- `npm run build` - Compila para producción con verificación de tipos TypeScript.
- `npm run preview` - Previsualiza el build de producción localmente.
- `node test-logic.mjs` - Ejecuta la suite de pruebas unitarias de las reglas del juego.
