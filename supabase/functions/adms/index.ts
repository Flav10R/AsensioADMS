import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('PROJECT_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Extraer parámetros de consulta comunes
    const SN = url.searchParams.get('SN');
    const table = url.searchParams.get('table');

    console.log(`[ADMS] Request: ${method} ${path} | SN: ${SN}`);

    // ROUTING LOGIC
    try {
        // 1. Handshake (GET /iclock/cdata)
        if (method === 'GET' && path.includes('/cdata')) {
            if (!SN) return new Response('SN required', { status: 400 });

            await supabase.from('devices').upsert({
                serial_number: SN,
                last_activity: new Date().toISOString(),
                ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            }, { onConflict: 'serial_number' });

            return new Response(`GET OPTION FROM: ${SN}\nDelay=30\nServerVer=3.4.1\nRealtime=1\nEncrypt=0`, {
                headers: { "Content-Type": "text/plain" }
            });
        }

        // 2. Receive Data (POST /iclock/cdata)
        if (method === 'POST' && path.includes('/cdata')) {
            const bodyText = await req.text();

            await supabase.from('devices').update({
                last_activity: new Date().toISOString(),
                ip_address: req.headers.get('x-forwarded-for') || 'unknown'
            }).eq('serial_number', SN);

            if (table === 'ATTLOG' && bodyText) {
                const records = parseAttendance(bodyText, SN!);
                if (records.length > 0) {
                    await supabase.from('attendances').insert(records);
                }
            }
            return new Response('OK', { headers: { "Content-Type": "text/plain" } });
        }

        // 3. Get Commands (GET /iclock/getrequest)
        if (method === 'GET' && path.includes('/getrequest')) {
            const { data } = await supabase.from('device_commands')
                .select('*').eq('device_sn', SN).eq('status', 'PENDING')
                .order('created_at', { ascending: true });

            if (!data || data.length === 0) return new Response('OK');

            let response = '';
            for (const cmd of data) {
                response += `C:${cmd.id}:${cmd.command_string}\n`;
                await supabase.from('device_commands').update({ status: 'SENT' }).eq('id', cmd.id);
            }
            return new Response(response);
        }

        // 4. Device Command Result (POST /iclock/devicecmd)
        // Device reports the result of a command execution
        if (method === 'POST' && path.includes('/devicecmd')) {
            const id = url.searchParams.get('ID');
            const returnValue = url.searchParams.get('Return');

            if (id) {
                await supabase.from('device_commands').update({
                    status: 'EXECUTED',
                    return_value: returnValue,
                    executed_at: new Date().toISOString()
                }).eq('id', id).eq('device_sn', SN);
            }
            return new Response('OK');
        }

        return new Response('Asensio ADMS Online', { status: 200 });

    } catch (err) {
        console.error(err);
        return new Response('OK', { status: 200 }); // Always return OK to device
    }
});

// Helper Parser para Deno
function parseAttendance(textData: string, sn: string) {
    return textData.split('\n').filter(l => l.trim()).map(line => {
        const parts = line.split('\t');
        return {
            device_sn: sn,
            user_pin: parts[0],
            punch_time: parts[1],
            verify_type: parseInt(parts[2]) || 0,
            status: parseInt(parts[3]) || 0
        };
    });
}
