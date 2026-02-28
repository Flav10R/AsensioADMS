# Guía de Despliegue - Asensio ADMS Server

Para que los relojes ZKTeco físicos (que están en las oficinas de tus clientes) puedan enviar datos a tu sistema, tu servidor de Node.js necesita estar alojado en internet con una **Dirección IP Pública** o un **Dominio genérico** (URL) accesible.

A continuación, los pasos y plataformas recomendadas para lograrlo:

## 1. Dónde alojar el Servidor Node.js (Aclaración importante)

Actualmente, tienes dos piezas en tu arquitectura:
1.  **La Base de Datos (Supabase):** Ya está en la nube y funcionando perfectamente. Almacena equipos y asistencias de forma segura.
2.  **El Servidor ADMS (Node.js / Express):** Actualmente este código (`server.js`) corre en tu PC (`localhost`). Debemos subirlo a internet.

> **Importante:** Supabase aloja tu *base de datos* y la *autenticación*, pero **no** aloja tu *servidor Node.js de Express*. Necesitas un servicio de alojamiento de aplicaciones para correr el código que acabamos de crear y mantenerlo escuchando las 24 horas.

Para servidores que escuchan peticiones de hardware de forma constante (IoT / Relojes), recomiendo estas opciones probadas:

**Opción A: Render.com (La más fácil y con capa gratuita)**
*   **Ideal para:** Empezar, pruebas, producción inicial.
*   **Costo:** Gratis para pruebas (se duerme si no hay tráfico), plan pago desde $7 USD/mes (no se duerme, 100% activo, ideal para producción).
*   **Cómo funciona:** Conectas tu cuenta de GitHub, y Render detecta tu código de Node.js y lo ejecuta automáticamente. Te provee un subdominio gratis con HTTPS (`ej: asensio-adms.onrender.com`).

**Opción B: VPS / Servidor Privado Virtual (DigitalOcean, AWS EC2, Hostinger)**
*   **Ideal para:** Alto volumen de relojes (más de 50 relojes mandando datos a la vez) o empresas grandes.
*   **Costo:** Desde $4 a $6 USD/mes.
*   **Ventaja:** Tienes control total y una **Dirección IP pública estática y garantizada** (A los relojes ZKTeco antiguos les gusta más conectarse por IP directa que por nombres de dominio).

**Opción C: Railway.app**
*   Similar a Render, muy rápido de desplegar y excelente rendimiento.

---

## 2. Pasos para el Despliegue (Ejemplo General con Render o Railway)

### Paso 1: Subir el código a GitHub
1.  Crea un repositorio gratuito y privado en [GitHub](https://github.com/).
2.  Abre una terminal en tu computadora (`C:\Users\flavi\ADMS_Proyect`), e inicializa git para subir el código:
    ```bash
    git init
    git add .
    git commit -m "Versión Inicial Asensio ADMS"
    git branch -M main
    git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
    git push -u origin main
    ```
    *(Nota: Antes de correr esto, asegúrate de crear un archivo `.gitignore` y poner `.env` y `node_modules` adentro para que tus claves privadas de Supabase no se suban a internet)*.

### Paso 2: Conectar el Host (App Platform)
1.  Crea una cuenta en Render (o Railway) y selecciona **Nuevo Web Service**.
2.  Conecta tu cuenta de Github y selecciona tu nuevo repositorio `Asensio ADMS`.

### Paso 3: Configurar el Entorno en la Nube
El servicio te pedirá algunos ajustes básicos. Normalmente auto-detecta Node.js, pero por si acaso confirmamos:
*   **Build Command (Comando de instalación):** `npm install`
*   **Start Command (Comando de inicio):** `npm start`
*   **Environment Variables (Variables de Entorno):** Aquí debes copiar el contenido de tu archivo `.env` local. Haz clic en "Añadir Variable Secreta" y coloca exactamente las mismas claves que usamos:
    *   `SUPABASE_URL` = (Tu url de supabase)
    *   `SUPABASE_SERVICE_KEY` = (Tu clave *service_role* segura)

### Paso 4: Desplegar y Obtener la URL
Haz clic en "Deploy" (Desplegar). En un par de minutos la plataforma compilará el código y te dará una URL pública con candado verde SSL.
*   Ejemplo: `https://asensio-adms.onrender.com`

¡Listo! Si visitas esa web desde tu celular ya deberías ver el Panel de Control.

---

## 3. Configuración Física en los Relojes ZKTeco (El Hardware)

Una vez que tengas tu URL pública, o tu IP pública (si usas VPS), debes ir a cada reloj ZKTeco en la pared o empresa del cliente y configurarlo para que "llame a casa".

1.  Entra al **Menú** del reloj (presionando M/OK).
2.  Ve a la opción de **Opciones de Red**.
3.  Busca y selecciona **Configuración de Servidor en la Nube** (A veces dice Cloud Server, ADMS, o ADMS Configuration).
4.  Configura los siguientes parámetros exactos:
    *   **Dirección del Servidor (Server Address):** Aquí va tu URL *sin* el `https://` (ejemplo: `asensio-adms.onrender.com`) o tu IP pública (ejemplo: `198.51.100.1`).
    *   **Puerto del Servidor (Server Port):**
        *   Si usas un web host como Render con dominio HTTPS, debes poner el puerto `443`.
        *   Si usas HTTP o tu propio VPS configurado manualmente, usa `80` u `8080`.
    *   **Habilitar Nombre de Dominio (Enable Domain Name):** Si pasaste un nombre con letras (como `onrender.com`), debes marcar esto en "Activado / ON". Si escribiste números IP, déjalo en "Desactivado / OFF".
5.  *(Opcional - Zona Horaria):* Aprovecha para ir a Configuración General -> Zona Horaria, y poner -3:00 (O la correspondiente a tu país) para evitar el desfasaje horario.
6.  Sal del menú y asegúrate de que el reloj está conectado por cable Ethernet al router o vía WiFi.
7.  Al instante visualizarás un **ícono pequeño en la pantalla ("Conectado al servidor")**.

## 4. Pruebas Finales en tu Panel
1. Desde tu celular o PC entra al Panel de Control de Asensio, en la sección **Dispositivos**.
2. Tu nuevo equipo ZKTeco físico aparecerá listado ahí (como No Autorizado). 
3. Da clic a "Autorizar".
4. Pon tu huella digital en el reloj para realizar una prueba.
5. Ve a **Registraciones**. Filtros -> Hoy. Allí verás tu asistencia real aparecer en cuestión de 1 segundo directamente desde internet a tu base de datos Supabase.
