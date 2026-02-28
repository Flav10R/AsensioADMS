const supabase = require('../config/supabase');
const { parseAttendanceData } = require('../utils/parser');

// GET /iclock/cdata
// Called during device initialization (handshake)
const handshake = async (req, res) => {
    const { SN, options, PushVersion } = req.query;

    if (!SN) {
        return res.status(400).send('SN required');
    }

    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Upsert device to ensure it exists in the system
        const { error } = await supabase
            .from('devices')
            .upsert({
                serial_number: SN,
                last_activity: new Date().toISOString(),
                ip_address: ipAddress
            }, { onConflict: 'serial_number' });

        if (error) {
            console.error('Error in handshake:', error.message);
        }

        // Must return OK with configuration parameters
        // For basic functionality, an empty configuration string or minimum parameters work
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(`GET OPTION FROM: ${SN}\nDelay=30\nServerVer=3.4.1 2011-04-21\nTransTimes=00:00;14:05\nTransInterval=1\nTransFlag=1111111111\nRealtime=1\nEncrypt=0`);
    } catch (err) {
        console.error(err);
        res.status(500).send('ERROR');
    }
};

// POST /iclock/cdata
// Receives punch logs, user enrollments, etc.
const receiveData = async (req, res) => {
    const { SN, table } = req.query;
    const bodyText = req.body;

    // Reject if body is empty or not string
    if (!bodyText || typeof bodyText !== 'string') {
        return res.status(200).send('OK');
    }

    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Update device last activity
        await supabase
            .from('devices')
            .update({
                last_activity: new Date().toISOString(),
                ip_address: ipAddress
            })
            .eq('serial_number', SN);

        if (table === 'ATTLOG') {
            const records = parseAttendanceData(bodyText, SN);
            if (records.length > 0) {
                const { error } = await supabase
                    .from('attendances')
                    .insert(records);

                if (error) {
                    console.error('Error inserting attendance:', error.message);
                }
            }
        }
        // Handle other tables if necessary (USER, OPERLOG, etc.)

        res.status(200).send('OK');
    } catch (err) {
        console.error(err);
        // Important: If you return anything other than OK, the device might keep retrying
        res.status(500).send('OK');
    }
};

// GET /iclock/getrequest
// Device asks for pending server commands
const getRequest = async (req, res) => {
    const { SN } = req.query;

    try {
        const { data, error } = await supabase
            .from('device_commands')
            .select('*')
            .eq('device_sn', SN)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(200).send('OK');
        }

        // Build command string: C:<id>:<command>
        let responseString = '';
        for (const cmd of data) {
            responseString += `C:${cmd.id}:${cmd.command_string}\n`;

            // Mark as sent
            await supabase
                .from('device_commands')
                .update({ status: 'SENT' })
                .eq('id', cmd.id);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(responseString);
    } catch (err) {
        console.error(err);
        res.status(200).send('OK');
    }
};

// POST /iclock/devicecmd
// Device reports the result of a command execution
const deviceCmd = async (req, res) => {
    const { SN } = req.query;
    const { ID, Return, CMD } = req.query; // PUSH SDK sends command ID and return status

    if (ID) {
        try {
            await supabase
                .from('device_commands')
                .update({
                    status: 'EXECUTED',
                    return_value: Return, // e.g., 0 for success
                    executed_at: new Date().toISOString()
                })
                .eq('id', ID)
                .eq('device_sn', SN);
        } catch (err) {
            console.error(err);
        }
    }

    res.status(200).send('OK');
};

module.exports = {
    handshake,
    receiveData,
    getRequest,
    deviceCmd
};
