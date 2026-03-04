import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req: Request) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Extraer parámetros de consulta comunes (Case Insensitive)
    const SN = url.searchParams.get('SN') || url.searchParams.get('sn');
    let table = url.searchParams.get('table') || url.searchParams.get('TABLE');
    if (table) table = table.toUpperCase();

    console.log(`[ADMS] Request: ${method} ${url.pathname}${url.search} | SN: ${SN}`);

    let companyId: string | null = null;

    // Track activity & Validate Company
    if (SN) {
        const { data: devRecord } = await supabase
            .from('devices')
            .select(`company_id, is_authorized, companies ( is_active, subscription_end_date )`)
            .eq('serial_number', SN)
            .single();

        // STRICT PRE-PROVISIONING ARCHITECTURE 
        if (!devRecord) {
            console.log(`[ADMS] Blocked: Unknown device SN ${SN} (Pre-provisioning required in Dashboard)`);
            return new Response('Unauthorized: Device not registered', { status: 401 });
        }

        if (devRecord.is_authorized === false) {
            console.log(`[ADMS] Blocked: Device SN ${SN} is explicitly disabled/unauthorized`);
            return new Response('Unauthorized: Device suspended', { status: 403 });
        }

        if (devRecord.companies) {
            const comp = devRecord.companies as any;
            if (comp.is_active === false) {
                console.log(`[ADMS] Rejected: Company inactive for SN ${SN}`);
                return new Response('Unauthorized: Inactive Subscription', { status: 403 });
            }
            if (comp.subscription_end_date && new Date(comp.subscription_end_date) < new Date()) {
                console.log(`[ADMS] Rejected: Company subscription expired for SN ${SN}`);
                return new Response('Unauthorized: Expired Subscription', { status: 403 });
            }
            companyId = devRecord.company_id;
        }

        // Update Heartbeat Activity (No more Upserting unknown devices)
        const { data: updateData, error } = await supabase.from('devices').update({
            last_activity: new Date().toISOString(),
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
        }).eq('serial_number', SN).select('model_info');

        if (error) {
            console.error(`[ADMS] Activity Update Error: ${error.message}`);
        } else if (updateData && updateData.length > 0 && !updateData[0].model_info) {
            // Auto-inyección de comando INFO para descubrir capacidades del reloj
            const { count } = await supabase.from('device_commands')
                .select('*', { count: 'exact', head: true })
                .eq('device_sn', SN)
                .eq('command_string', 'INFO')
                .in('status', ['PENDING', 'SENT']);

            if (count === 0) {
                console.log(`[ADMS] Auto-injecting INFO command for new device ${SN}`);
                await supabase.from('device_commands').insert({
                    device_sn: SN,
                    command_string: 'INFO',
                    status: 'PENDING',
                    company_id: companyId
                });
            }
        }
    }

    // ROUTING LOGIC
    try {
        // 1. Receive Options/Handshake (GET /iclock/cdata)
        if (method === 'GET' && path.includes('/cdata')) {
            if (!SN) return new Response('SN required', { status: 400 });

            // Si tiene más parámetros que solo el SN, es probable que sea una respuesta a INFO
            const options = url.searchParams.get('options');
            if (options || url.search.length > 20) {
                console.log(`[ADMS] Received Device Info/Options via GET | SN: ${SN} | Query: ${url.search}`);
                // Aquí podrías guardar esto en una tabla de 'device_info' en el futuro
            }

            const now = new Date();
            const serverTime = now.toISOString().replace('T', ' ').substring(0, 19);

            return new Response(`GET OPTION FROM:${SN}\nDelay=30\nServerVer=3.4.1\nServerVtime=${serverTime}\nTimeZone=-3\nRealtime=1\nEncrypt=0\nTransFlag=1111111111\nStamp=0\nOpStamp=0\nPhotoStamp=0\nOPERLOGStamp=0\nATTLOGStamp=0\nATTPHOTOStamp=0`, {
                headers: { "Content-Type": "text/plain" }
            });
        }

        // 2. Receive Data (POST /iclock/cdata)
        if (method === 'POST' && path.includes('/cdata')) {
            const bodyText = await req.text();
            console.log(`[ADMS] POST DATA | Table: ${table} | Body length: ${bodyText.length} | SN: ${SN}`);
            console.log(`[ADMS] Body Content: ${bodyText.substring(0, 1000)}`);

            if (table === 'ATTLOG' && bodyText) {
                console.log(`[ADMS] Processing ATTLOG for SN: ${SN}`);
                const records = parseAttendance(bodyText, SN!, companyId);
                if (records.length > 0) {
                    const { error } = await supabase.from('attendances').insert(records);
                    if (error) console.error(`[ADMS] Error inserting attendances: ${error.message}`);
                }
            } else if (table === 'USER' && bodyText) {
                console.log(`[ADMS] Processing USER table for SN: ${SN}`);
                const users = parseUsers(bodyText, companyId);
                if (users.length > 0) {
                    const { error } = await supabase.from('users').upsert(users, { onConflict: 'pin' });
                    if (error) console.error(`[ADMS] Error upserting users: ${error.message}`);
                }
            } else if (table === 'BIODATA' && bodyText) {
                console.log(`[ADMS] Processing BIODATA for SN: ${SN}`);
                const biometrics = parseBiometrics(bodyText, companyId);
                if (biometrics.length > 0) {
                    const { error } = await supabase.from('biometrics').upsert(biometrics, { onConflict: 'user_pin,type,version' });
                    if (error) console.error(`[ADMS] Error upserting biometrics: ${error.message}`);
                }
            } else if ((table === 'INFO' || path.includes('info')) && bodyText) {
                console.log(`[ADMS] Received Device INFO for SN: ${SN} | Length: ${bodyText.length}`);
                // Extraer y guardar las capacidades del reloj
                const supportsFace = bodyText.includes('FaceFunOn=1') || bodyText.includes('~FaceFunOn=1') || bodyText.toLowerCase().includes('face');

                await supabase.from('devices').update({
                    model_info: bodyText.substring(0, 1500),
                    supports_face: supportsFace
                }).eq('serial_number', SN!);

                console.log(`[ADMS] Capabilities updated for SN: ${SN} (Face Supported: ${supportsFace})`);
            } else if (table === 'OPERLOG' && bodyText) {
                console.log(`[ADMS] Received OPERLOG for SN: ${SN} (Activity Log or Multi-part Data)`);
                const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                for (const line of lines) {
                    let lineType = table;
                    if (line.startsWith('USER ')) lineType = 'USER';
                    else if (line.startsWith('FP ') || line.startsWith('FACE ') || line.startsWith('BIODATA ')) lineType = 'BIODATA';
                    else if (line.includes('\t') && !line.includes('=')) lineType = 'ATTLOG';

                    if (lineType === 'ATTLOG') {
                        const records = parseAttendance(line, SN!, companyId);
                        if (records.length > 0) await supabase.from('attendances').insert(records);
                    } else if (lineType === 'USER' || lineType === 'USERINFO' || lineType === 'USER_INFO') {
                        const users = parseUsers(line, companyId);
                        if (users.length > 0) await supabase.from('users').upsert(users, { onConflict: 'pin' });
                    } else if (lineType === 'BIODATA' || lineType === 'TEMPLATEV10' || lineType === 'FPTEMPLATE10') {
                        const biometrics = parseBiometrics(line, companyId);
                        if (biometrics.length > 0) await supabase.from('biometrics').upsert(biometrics, { onConflict: 'user_pin,type,version' });
                    }
                }
            } else {
                console.log(`[ADMS] Received table/data: ${table}. Length: ${bodyText.length}. SN: ${SN}`);
                if (bodyText.length < 2000) console.log(`[ADMS] Content: ${bodyText}`);
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
                console.log(`[ADMS] Sending command to ${SN}: C:${cmd.id}:${cmd.command_string}`);
                response += `C:${cmd.id}:${cmd.command_string}\n`;
                await supabase.from('device_commands').update({ status: 'SENT' }).eq('id', cmd.id);
            }
            return new Response(response);
        }

        // 4. Device Command Result (POST /iclock/devicecmd)
        if (method === 'POST' && path.includes('/devicecmd')) {
            const bodyText = await req.text(); // fetch API auto-reads raw body!
            const bodyParams = new URLSearchParams(bodyText.replace(/\n/g, '&'));

            const id = url.searchParams.get('ID') || url.searchParams.get('id') || bodyParams.get('ID') || bodyParams.get('id');
            const returnValue = url.searchParams.get('Return') || url.searchParams.get('return') || bodyParams.get('Return') || bodyParams.get('return');

            console.log(`[ADMS] Command Result | ID: ${id} | Return: ${returnValue} | SN: ${SN} | Body: ${bodyText.substring(0, 300)}`);

            let dbReturnValue = returnValue || '0';
            if (bodyText && bodyText.length > 5) {
                dbReturnValue = `${dbReturnValue} | BODY: ${bodyText.substring(0, 1000)}`;
            }

            if (id) {
                const { data: matchedCmd } = await supabase.from('device_commands')
                    .select('id').ilike('id', `${id}%`).eq('device_sn', SN!).order('created_at', { ascending: false }).limit(1);

                if (matchedCmd && matchedCmd.length > 0) {
                    await supabase.from('device_commands').update({
                        status: 'EXECUTED', return_value: dbReturnValue, executed_at: new Date().toISOString()
                    }).eq('id', matchedCmd[0].id);
                } else {
                    console.log(`[ADMS] No exact ID match. Attempting Fallback...`);
                    const cmdString = bodyParams.get('CMD') || bodyParams.get('cmd');
                    if (cmdString) {
                        const { data: fallbackCmd } = await supabase.from('device_commands')
                            .select('id').eq('device_sn', SN!).eq('status', 'SENT').ilike('command_string', `${cmdString}%`)
                            .order('created_at', { ascending: false }).limit(1);

                        if (fallbackCmd && fallbackCmd.length > 0) {
                            console.log(`[ADMS] Fallback successful by CMD: ${cmdString}`);
                            await supabase.from('device_commands').update({
                                status: 'EXECUTED', return_value: dbReturnValue, executed_at: new Date().toISOString()
                            }).eq('id', fallbackCmd[0].id);
                        } else {
                            console.log(`[ADMS] Fallback failed. Command string not found: ${cmdString}`);
                        }
                    }
                }
            } else if (bodyText.length > 20) {
                console.log(`[ADMS] Body without ID (Length: ${bodyText.length}). Snippet: ${bodyText.substring(0, 300)}`);
                // Encontrar el último comando enviado y actualizar su Return
                const { data: lastCmd } = await supabase.from('device_commands')
                    .select('id, return_value').eq('device_sn', SN!)
                    .order('created_at', { ascending: false }).limit(1);

                if (lastCmd && lastCmd.length > 0) {
                    const existingReturn = lastCmd[0].return_value || '';
                    await supabase.from('device_commands').update({
                        return_value: `${existingReturn} | LARGE_BODY: ${bodyText.replace(/\0/g, '').substring(0, 1500)}`
                    }).eq('id', lastCmd[0].id);
                }
            }

            return new Response('OK');
        }

        return new Response('Asensio ADMS Online', { status: 200 });

    } catch (err) {
        console.error(err);
        return new Response('OK', { status: 200 }); // Always return OK to device
    }
});

// Helper Parser para Deno - Asistencia
function parseAttendance(textData: string, sn: string, companyId: string | null = null) {
    return textData.split(/\r?\n/).filter(l => l.trim()).map(line => {
        const parts = line.split('\t');
        return {
            device_sn: sn,
            user_pin: parts[0]?.trim(),
            punch_time: parts[1]?.trim(),
            verify_type: parseInt(parts[2]) || 0,
            status: parseInt(parts[3]) || 0,
            company_id: companyId
        };
    });
}

// Helper Parser para Usuarios
function parseUsers(textData: string, companyId: string | null = null) {
    // Formato: PIN\tName\tPri\tPass\tCard\tGrp\tTZ
    return textData.split(/\r?\n/).filter(l => l.trim()).map(line => {
        const parts = line.split('\t');
        return {
            pin: parts[0]?.trim(),
            name: parts[1]?.trim(),
            privilege: parseInt(parts[2]) || 0,
            password: parts[3]?.trim(),
            card: parts[4]?.trim(),
            company_id: companyId
        };
    });
}

// Helper Parser para Biometría
function parseBiometrics(textData: string, companyId: string | null = null) {
    // Formato: PIN\tType\tSize\tTmp\tVersion
    return textData.split(/\r?\n/).filter(l => l.trim()).map(line => {
        const parts = line.split('\t');
        return {
            user_pin: parts[0]?.trim(),
            type: parseInt(parts[1]) || 0,
            template: parts[3]?.trim(), // Tmp
            version: parts[4]?.trim(),   // Version del algoritmo
            company_id: companyId
        };
    });
}
