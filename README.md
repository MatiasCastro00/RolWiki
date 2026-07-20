# Rolkeeper

Prototipo con backend externo para guardar campanas de rol, invitar jugadores, editar personajes y publicar una wiki de solo lectura.

## Backend externo

La app esta preparada para Supabase: Auth guarda las cuentas y Postgres guarda el estado compartido de campanas.

1. Crea un proyecto en Supabase.
2. Abre el SQL Editor y ejecuta el contenido de `supabase-schema.sql`.
3. En Project Settings > API copia:
   - Project URL
   - anon public key
4. Pega esos valores en `supabase-config.js`.

Para pruebas rapidas, en Authentication > Sign In / Providers podes desactivar la confirmacion por email. Si la dejas activa, el usuario tiene que confirmar el correo antes de entrar.

## Como probar

Abri `index.html` en el navegador despues de configurar Supabase.

Para que no dependa de tu PC, subi estos archivos a un hosting estatico como GitHub Pages, Netlify, Vercel o Sites. Todos los dispositivos tienen que abrir esa misma URL publicada.

## Otros dispositivos

Mientras todos usen el mismo proyecto de Supabase, las cuentas, campanas, invitaciones y personajes se comparten entre dispositivos.

## Flujos incluidos

- Crear cuentas con email y contrasena en Supabase Auth.
- Iniciar y cerrar sesion.
- Editar nombre, email y contrasena desde el perfil.
- Crear campanas de rol.
- Editar wiki privada/publica por campana.
- Generar link publico de wiki.
- Generar link de invitacion para jugadores.
- Aceptar invitaciones.
- Crear y editar personajes por jugador.
- Panel de miembros y ajustes de campana.

## Nota

Las cuentas ya no viven en `localStorage`: el navegador guarda la sesion de Supabase. Este esquema es suficiente para prototipo compartido; para produccion conviene normalizar campanas/personajes en tablas separadas, sumar politicas RLS mas estrictas, backups y dominio con HTTPS.

Por seguridad, el estado completo de campanas solo lo leen usuarios autenticados. Si queres una wiki verdaderamente publica sin login, la siguiente mejora es separar las paginas publicas en una tabla propia con politicas RLS de solo lectura anonima.

## Backend local opcional

`server.py` queda como alternativa local con SQLite si alguna vez queres probar sin Supabase, pero no es necesario para la version externa.
