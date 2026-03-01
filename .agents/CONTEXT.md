# Asensio ADMS - Contexto Técnico para Agentes

## 🎯 Objetivo del Proyecto
Servidor ADMS (Push SDK) para relojes ZKTeco, migrado de Node.js a una arquitectura 100% Serverless usando Supabase Edge Functions.

## 🏗️ Arquitectura
- **Backend**: Supabase Edge Functions (Deno + TypeScript).
- **Base de Datos**: PostgreSQL (Supabase).
- **Frontend**: Panel de control estático (HTML/CSS/Vanilla JS) alojado en Vercel.
- **Protocolo de Comunicación**: ADMS (HTTP/HTTPS) sobre el SDK de ZKTeco.

## 🛠️ Componentes Clave

### 1. Edge Function `adms`
- **Ruta**: `/functions/v1/adms`
- **Función**: Maneja el tráfico directo de los relojes.
- **Seguridad**: Desplegada con `--no-verify-jwt`. Los relojes envían datos en texto plano/ADMS estándar.
- **Acciones**: Handshake (`GET cdata`), Recibir Fichadas (`POST cdata`), Enviar Comandos (`GET getrequest`).

### 2. Edge Function `admin-api`
- **Ruta**: `/functions/v1/admin-api`
- **Función**: API para el panel de control de Vercel.
- **Seguridad**: Desplegada con `--no-verify-jwt` pero **valida manualmente el JWT** de Supabase Auth dentro del código.
- **Cabeceras obligatorias**: Requiere `Authorization: Bearer <token>` y `apikey: <anon_key>`.

### 3. Frontend (Carpeta `/public`)
- **Autenticación**: Usa Supabase Auth para proteger el panel.
- **Configuración**: El archivo `app.js` tiene la `SB_URL` y la `SB_ANON_KEY` del proyecto.

## ⚠️ Reglas Críticas (No olvidar)
1. **Despliegue**: Siempre usar la bandera `--no-verify-jwt` al desplegar funciones, de lo contrario, Supabase bloqueará el tráfico ADMS de los relojes.
   - `supabase functions deploy adms --no-verify-jwt`
   - `supabase functions deploy admin-api --no-verify-jwt`
2. **IP Tracking**: Se captura la IP real del dispositivo usando las cabeceras `x-forwarded-for` de Supabase.
3. **Fichadas Masivas**: Se testean mediante la colección de Bruno ubicada en `bruno-collections/Asensio-ADMS`.

## 🗄️ Esquema de Base de Datos
- `devices`: Almacena el estado, IP, geolocalización y autorización.
- `attendances`: Registros de fichadas (IDs de usuario, fecha, hora, SN del equipo).
- `device_commands`: Cola de comandos para enviar a los relojes.
