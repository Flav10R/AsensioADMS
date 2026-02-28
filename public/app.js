// CONFIGURACIÓN DE SUPABASE
// Reemplaza estos valores con los de tu Dashboard de Supabase (Settings -> API)
const SB_URL = 'https://vgkazdekgkowualsooyr.supabase.co';
const SB_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna2F6ZGVrZ2tvd3VhbHNvb3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjAyMTEsImV4cCI6MjA4NzczNjIxMX0.qP0vxBQH-syLYoft5HmX5R2R17XJQP19lLIIV6wNOOY'; // <--- PEGA TU ANON KEY AQUÍ

const supabaseClient = supabase.createClient(SB_URL, SB_ANON_KEY);

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api/admin'
    : `${SB_URL}/functions/v1/admin-api`;

let leafletMap = null;
let currentSession = null;

// Auth Check & UI Logic
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleSession(session);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        handleSession(session);
    });
}

function handleSession(session) {
    currentSession = session;
    const overlay = document.getElementById('login-overlay');
    if (session) {
        overlay.classList.add('hidden');
        loadDashboard();
    } else {
        overlay.classList.remove('hidden');
    }
}

// Interceptor para Fetch que añade el Token y la apikey necesaria para Edge Functions
async function authorizedFetch(url, options = {}) {
    if (!currentSession) return null;

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${currentSession.access_token}`,
        'apikey': SB_ANON_KEY,
        'Content-Type': 'application/json'
    };

    return fetch(url, { ...options, headers });
}

// Navigation Logic
document.querySelectorAll('.nav li').forEach(item => {
    item.addEventListener('click', (e) => {
        if (!currentSession) return;

        // Toggle Active Class
        document.querySelectorAll('.nav li').forEach(li => li.classList.remove('active'));
        item.classList.add('active');

        // Show correct section
        const target = item.getAttribute('data-target');
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(target).classList.add('active');

        // Load specific data
        if (target === 'dashboard') loadDashboard();
        if (target === 'devices') loadDevices();
        if (target === 'attendances') loadAttendances();
        if (target === 'diagnostics') loadDiagnostics();
        if (target === 'map') setTimeout(initMap, 200);
    });
});

// Load Dashboard Stats
async function loadDashboard() {
    try {
        const [devicesRes, attendancesRes] = await Promise.all([
            authorizedFetch(`${API_URL}/devices`),
            authorizedFetch(`${API_URL}/attendances?limit=1`) // Request minimal data
        ]);

        if (!devicesRes.ok || !attendancesRes.ok) {
            const err = await devicesRes.json();
            console.error("Fetch Error:", err);
            return;
        }

        const devices = await devicesRes.json();
        if (!Array.isArray(devices)) throw new Error("Devices is not an array");

        const authDevices = devices.filter(d => d.is_authorized).length;

        const attendancesData = await attendancesRes.json();

        document.getElementById('total-devices').textContent = devices.length;
        document.getElementById('authorized-devices').textContent = authDevices;
        document.getElementById('total-attendances').textContent = attendancesData.total || 0;

        // Emulate Database usage stats
        const dbApprox = attendancesData.db_size_mb || 0;
        const maxDb = attendancesData.max_db_size || 512;
        const usageLimit = ((dbApprox / maxDb) * 100).toFixed(2);
        document.getElementById('db-usage').textContent = `${dbApprox} / ${maxDb} MB (${usageLimit}%)`;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load Devices Table
async function loadDevices() {
    const tbody = document.querySelector('#devices-table tbody');
    tbody.innerHTML = '<tr><td colspan="5">Cargando datos...</td></tr>';

    try {
        const response = await authorizedFetch(`${API_URL}/devices`);
        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const devices = await response.json();
        if (!Array.isArray(devices)) throw new Error("Los datos de dispositivos no son un array");

        tbody.innerHTML = '';
        if (devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay dispositivos registrados</td></tr>';
            return;
        }

        devices.forEach(d => {
            const date = new Date(d.last_activity).toLocaleString();
            const checked = d.is_authorized ? 'checked' : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${d.serial_number}</strong></td>
                <td>${d.alias || '-'}</td>
                <td>${date}</td>
                <td><span class="badge auth-${d.is_authorized}">${d.is_authorized ? 'Autorizado' : 'Sin Autorizar'}</span></td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${checked} onchange="toggleDeviceAuth('${d.serial_number}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:red">Error cargando dispositivos</td></tr>';
        console.error('Error loading devices:', error);
    }
}

// Toggle Device Authorization
window.toggleDeviceAuth = async (sn, isAuthorized) => {
    try {
        const response = await authorizedFetch(`${API_URL}/authorize`, {
            method: 'PUT',
            body: JSON.stringify({ sn, is_authorized: isAuthorized })
        });

        if (response.ok) {
            loadDevices(); // Refresh list to update badges
            loadDashboard(); // Refresh counts
        } else {
            alert('Error al actualizar el estado del dispositivo.');
        }
    } catch (error) {
        console.error('Error toggling device authorization:', error);
        alert('Error de conexión.');
    }
};

// Wrapper para el boton buscar
window.loadAttendancesFiltered = function () {
    loadAttendances();
};

// Load Attendances Table
async function loadAttendances() {
    const tbody = document.querySelector('#attendances-table tbody');
    tbody.innerHTML = '<tr><td colspan="5">Cargando transacciones...</td></tr>';

    const dateFrom = document.getElementById('filter-date-from') ? document.getElementById('filter-date-from').value : '';
    const dateTo = document.getElementById('filter-date-to') ? document.getElementById('filter-date-to').value : '';
    const deviceSn = document.getElementById('filter-device') ? document.getElementById('filter-device').value : '';
    const empId = document.getElementById('filter-emp-id') ? document.getElementById('filter-emp-id').value : '';

    let queryParams = new URLSearchParams({ limit: 100 });
    if (dateFrom) queryParams.append('date_from', dateFrom);
    if (dateTo) queryParams.append('date_to', dateTo);
    if (deviceSn) queryParams.append('sn', deviceSn);
    if (empId) queryParams.append('pin', empId);

    try {
        const response = await authorizedFetch(`${API_URL}/attendances?${queryParams.toString()}`);
        const result = await response.json();
        const records = result.data || [];

        tbody.innerHTML = '';
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay registraciones para los criterios buscados.</td></tr>';
            return;
        }

        records.forEach(r => {
            const deviceName = r.devices?.alias || r.device_sn;

            const punchDate = new Date(r.punch_time);
            const formattedDate = punchDate.toLocaleDateString();
            const formattedTime = punchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color: var(--brand-primary);">${r.user_pin}</strong></td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td><code>Verif: ${r.verify_type || 0} Stat: ${r.status || 0}</code></td>
                <td><strong>${deviceName}</strong> <br><small style="color:var(--text-secondary)">${r.device_sn}</small></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:red">Error cargando registraciones</td></tr>';
        console.error('Error loading attendances:', error);
    }
}

// DIAGNOSTICS LOGIC
async function loadDiagnostics() {
    const logConsole = document.getElementById('diagnostic-log');
    const filterSn = document.getElementById('filter-sn').value.trim();

    logConsole.innerHTML = '<div class="log-entry" style="color: yellow">Cargando registros desde la base de datos...</div>';

    try {
        // Obtenemos asistencias que coincidan con el equipo
        let url = `${API_URL}/attendances?limit=30`;
        const response = await authorizedFetch(url);
        const result = await response.json();
        let records = result.data || [];

        if (filterSn) {
            records = records.filter(r => r.device_sn === filterSn);
        }

        logConsole.innerHTML = ''; // Clear

        if (records.length === 0) {
            logConsole.innerHTML = `<div class="log-entry" style="color: #ef4444">No se encontraron eventos para: ${filterSn || 'Todos'}</div>`;
            return;
        }

        records.forEach(r => {
            const time = new Date(r.created_at).toLocaleTimeString();
            const date = new Date(r.punch_time).toLocaleString();
            logConsole.innerHTML += `
                <div class="log-entry">
                    <span class="log-time">[${time}]</span> 
                    <span style="color: #10b981">DEVICE_SN:</span> ${r.device_sn} | 
                    <span style="color: #3b82f6">ACT:</span> ATTLOG | 
                    <span class="log-data">USER: ${r.user_pin} | TIME: ${date} | VERIFY: ${r.verify_type}</span>
                </div>
            `;
        });
    } catch (error) {
        logConsole.innerHTML = `<div class="log-entry" style="color: #ef4444">Error de conexión con la API de diagnóstico.</div>`;
    }
}

// MAP LOGIC
async function initMap() {
    // Si el mapa ya existe, solo actualizamos el tamaño
    if (leafletMap !== null) {
        leafletMap.invalidateSize();
        return;
    }

    // Inicializar mapa centrado en un punto global genérico
    leafletMap = L.map('leaflet-map').setView([10, -10], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(leafletMap);

    try {
        // Cargar dispositivos para colocarlos en el mapa
        const response = await authorizedFetch(`${API_URL}/devices`);
        const devices = await response.json();

        let addedMarkers = false;

        devices.forEach(async (d, i) => {
            let lat = d.lat;
            let lng = d.lng;

            // Si no tiene coords físicas, intentamos ubicar usando la dirección IP real
            if (!lat || !lng) {
                if (d.ip_address && d.ip_address !== '127.0.0.1' && d.ip_address !== '::1' && !d.ip_address.startsWith('192.168.') && !d.ip_address.startsWith('::ffff:127.')) {
                    try {
                        const cleanIp = d.ip_address.replace('::ffff:', '');
                        const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}`);
                        const geoData = await geoRes.json();
                        if (geoData.status === 'success') {
                            lat = geoData.lat;
                            lng = geoData.lon;
                        }
                    } catch (e) {
                        console.error("Geoloc err:", e);
                    }
                }
            }

            // Si falla o es local, lo ubicamos en Argentina simulado cerca de Buenos Aires con pequeña variación
            if (!lat || !lng) {
                lat = -34.6037 + (Math.random() * 0.1 - 0.05);
                lng = -58.3816 + (Math.random() * 0.1 - 0.05);
            }

            const statusColor = d.is_authorized ? 'green' : 'red';

            const markerHtml = `
                <div style="background-color: ${statusColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${statusColor};"></div>
            `;

            const customIcon = L.divIcon({
                html: markerHtml,
                className: 'custom-leaflet-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);

            marker.bindPopup(`
                <div style="color: #333">
                    <strong>${d.alias || d.serial_number}</strong><br>
                    SN: ${d.serial_number}<br>
                    Estado: ${d.is_authorized ? 'Autorizado' : 'Sin Autorizar'}<br>
                    Última act: ${new Date(d.last_activity).toLocaleTimeString()}
                </div>
            `);
            addedMarkers = true;
        });

        if (addedMarkers) {
            console.log("Marcadores cargados en el mapa");
        }

    } catch (error) {
        console.error("Error cargando dispositivos al mapa", error);
    }
}

// Auth Event Handlers
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.classList.add('hidden');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        errorEl.textContent = "Error: " + error.message;
        errorEl.classList.remove('hidden');
    }
});

window.handleLogout = async () => {
    await supabaseClient.auth.signOut();
};

// Initialize
checkAuth();
