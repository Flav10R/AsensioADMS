const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let validUrl = supabaseUrl;
let validKey = supabaseKey;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
    console.warn('Supabase credentials not configured correctly in .env file. Falling back to dummy values.');
    validUrl = 'http://localhost:8000';
    validKey = 'dummy_key_to_prevent_crash_during_development';
}

const supabase = createClient(validUrl, validKey);

module.exports = supabase;
