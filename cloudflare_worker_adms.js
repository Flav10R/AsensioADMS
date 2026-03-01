/**
 * CLOUDFLARE WORKER PARA ASENSIO ADMS
 * 
 * Este script actúa como un túnel/máscara entre los Relojes Asensio y Supabase.
 * Proporciona una URL más corta y corrige rutas de protocolos ADMS antiguos.
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. URL base de tu Supabase Edge Function
        const SUPABASE_ADMS_URL = "https://vgkazdekgkowualsooyr.supabase.co/functions/v1/adms";

        // 2. Normalización de la ruta
        // Algunos equipos Asensio agregan prefixos como /iclock/ o /cdata
        // Nosotros necesitamos que todo llegue limpio a las Edge Functions
        let path = url.pathname;

        // Si la ruta contiene /iclock, lo removemos para compatibilidad
        if (path.startsWith('/iclock')) {
            path = path.replace('/iclock', '');
        }

        // 3. Construcción de la URL de destino conservando los parámetros (SN, table, etc.)
        const destinationUrl = `${SUPABASE_ADMS_URL}${path}${url.search}`;

        // 4. Clonar y modificar la petición
        const modifiedRequest = new Request(destinationUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'follow'
        });

        // 5. Reenviar a Supabase
        try {
            const response = await fetch(modifiedRequest);

            // Creamos una nueva respuesta para poder manipular los headers si fuera necesario
            // (Por ejemplo, para asegurar compatibilidad con navegadores antiguos o CORS)
            const newResponse = new Response(response.body, response);
            newResponse.headers.set('X-Proxied-By', 'Asensio-Cloudflare-Worker');

            return newResponse;
        } catch (e) {
            return new Response("Error al conectar con Supabase ADMS", { status: 502 });
        }
    },
};
