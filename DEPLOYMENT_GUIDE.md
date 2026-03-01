# Guía de Despliegue - Supabase Edge Functions (Asensio ADMS)

Has elegido la arquitectura más eficiente: **Supabase Edge Functions**. Esto significa que no necesitas un servidor externo (como Render o AWS) para procesar los datos de los relojes.

---

## 1. Preparación de las Funciones

He creado dos funciones dentro de la carpeta `supabase/functions/`:
1.  **`adms`**: Encargada de hablar con los Relojes Asensio (Handshake, Asistencias, Comandos).
2.  **`admin-api`**: Encargada de alimentar el Panel de Control (Listado de equipos, filtros, autorizaciones).

### Requisitos
*   Tener instalada la **Supabase CLI**.
*   Estar logueado con `supabase login`.

---

## 2. Pasos para el Despliegue Cloud

Ejecuta estos comandos en tu terminal desde la raíz del proyecto para subir las funciones a tu proyecto `vgkazdekgkowualsooyr`:

### Paso 1: Configurar Secretos (Solo una vez)
Deno (el motor de las Edge Functions) necesita conocer tus claves. Ejecuta:
```bash
supabase secrets set SUPABASE_SERVICE_KEY=tu_service_role_key_aqui
```
*(La URL se detecta automáticamente en la nube, pero si falla puedes agregarla también).*

### Paso 2: Desplegar Funciones
```bash
supabase functions deploy adms
supabase functions deploy admin-api
```

---

## 3. Configuración en los Relojes Físicos

Una vez desplegado, tu servidor ADMS estará disponible en esta dirección:
`https://vgkazdekgkowualsooyr.supabase.co/functions/v1/adms`

**Configuración en el menú del Reloj Asensio:**
*   **Dirección del Servidor:** `vgkazdekgkowualsooyr.supabase.co`
*   **Ruta (si el reloj lo permite):** `/functions/v1/adms`
*   **Puerto:** `443`
*   **HTTPS/SSL:** Activado (ON)
*   **Nombre de Dominio:** Activado (ON)

---

## 4. El Panel de Control (Frontend)

El panel de control (HTML/JS) es estático. Al no tener ya un servidor de Node.js central, tienes dos opciones para alojarlo:

1.  **Vercel / Netlify / GitHub Pages (Recomendado):** Simplemente sube la carpeta `public` a uno de estos servicios. Es gratis y muy rápido.
2.  **Supabase Storage:** Puedes crear un bucket público en Supabase, subir los archivos de `/public` y habilitar el "Static Website Hosting".

**Importante:** En `public/app.js` ya dejé configurada la lógica para que detecte automáticamente si estás en local o en producción y use la URL de la Edge Function `admin-api`.

---

## 5. Mantenimiento y Logs
Para ver qué está pasando en tiempo real con los relojes, puedes usar el comando de logs de Supabase:
```bash
supabase functions serve adms --env-file .env  # Para probar local
# O en el dashboard de Supabase -> Edge Functions -> adms -> Logs
```
