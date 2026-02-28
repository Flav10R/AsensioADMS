const supabase = require('../config/supabase');

// GET /api/admin/devices
// List all devices
const getDevices = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .order('last_activity', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/admin/devices/:sn/authorize
// Authorize or unauthorize a device
const authorizeDevice = async (req, res) => {
    const { sn } = req.params;
    const { is_authorized } = req.body;

    try {
        const { data, error } = await supabase
            .from('devices')
            .update({ is_authorized })
            .eq('serial_number', sn)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/admin/attendances
// List attendances with advanced filtering and pagination
const getAttendances = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const start = (page - 1) * limit;

    const { date_from, date_to, sn, pin } = req.query;

    try {
        let query = supabase
            .from('attendances')
            .select('*, devices(alias)', { count: 'exact' })
            .order('punch_time', { ascending: false })
            .range(start, start + limit - 1);

        // Apply Filters
        if (date_from) {
            query = query.gte('punch_time', `${date_from} 00:00:00`);
        }
        if (date_to) {
            query = query.lte('punch_time', `${date_to} 23:59:59`);
        }
        if (sn) {
            // Support multiple devices separated by comma
            const snList = sn.split(',').map(s => s.trim());
            query = query.in('device_sn', snList);
        }
        if (pin) {
            query = query.eq('user_pin', pin.trim());
        }

        const { data, count, error } = await query;

        if (error) throw error;

        // Emulate Database Size metric roughly based on total attendance rows
        // Note: A real implementation would require an rpc edge function if using Supabase free, here we mock it to prevent limits.
        const dbApproxSizeMb = (count * 0.0001).toFixed(3); // Rough estimation

        res.json({
            data,
            total: count,
            page,
            limit,
            db_size_mb: dbApproxSizeMb,
            max_db_size: 512 // 0.5 GB in MB
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/admin/devices/:sn/commands
// Queue a command for a device
const queueCommand = async (req, res) => {
    const { sn } = req.params;
    const { command_string } = req.body;

    if (!command_string) {
        return res.status(400).json({ error: 'command_string missing' });
    }

    try {
        const { data, error } = await supabase
            .from('device_commands')
            .insert([{
                device_sn: sn,
                command_string: command_string,
                status: 'PENDING'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getDevices,
    authorizeDevice,
    getAttendances,
    queueCommand
};
