import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
    // 1. Manejar el preflight de CORS pronto
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // 2. Obtener y validar el Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Falta encabezado de autorización' }), { status: 401, headers: corsHeaders });
    }

    // Usamos el cliente de Supabase para validar el token del usuario
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
        console.error("Auth Fail:", authError);
        return new Response(JSON.stringify({ error: 'Sesión inválida', details: authError?.message }), { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    try {
        // --- ENDPOINTS ---

        // GET /devices
        if (method === 'GET' && path.endsWith('/devices')) {
            const { data, error } = await supabase.from('devices').select('*').order('last_activity', { ascending: false });
            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // PUT /authorize
        if (method === 'PUT' && path.includes('/authorize')) {
            const { sn, is_authorized } = await req.json();
            const { data, error } = await supabase.from('devices').update({ is_authorized }).eq('serial_number', sn).select();
            if (error) throw error;
            return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // GET /attendances
        if (method === 'GET' && path.endsWith('/attendances')) {
            const limit = parseInt(url.searchParams.get('limit') || '100');
            const dateFrom = url.searchParams.get('date_from');
            const dateTo = url.searchParams.get('date_to');
            const sn = url.searchParams.get('sn');
            const pin = url.searchParams.get('pin');

            let query = supabase.from('attendances').select('*, devices(alias)', { count: 'exact' }).order('punch_time', { ascending: false }).limit(limit);

            if (dateFrom) query = query.gte('punch_time', `${dateFrom} 00:00:00`);
            if (dateTo) query = query.lte('punch_time', `${dateTo} 23:59:59`);
            if (sn) query = query.in('device_sn', sn.split(',').map(s => s.trim()));
            if (pin) query = query.eq('user_pin', pin.trim());

            const { data, count, error } = await query;
            if (error) throw error;

            return new Response(JSON.stringify({
                data,
                total: count,
                db_size_mb: (count * 0.0001).toFixed(3),
                max_db_size: 512
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ status: 'Online' }), { headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
