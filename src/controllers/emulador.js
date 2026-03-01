const http = require('http');

const SERVER_URL = 'http://localhost:8080';
const DEVICE_SN = 'TESTB123456'; // Número de serie ficticio

// Paso 1: Simular el Handshake (Inicialización)
async function handshake() {
    console.log(`[1] Iniciando Handshake para SN: ${DEVICE_SN}`);
    const response = await fetch(`${SERVER_URL}/iclock/cdata?SN=${DEVICE_SN}&options=all&PushVersion=3.4.1`);
    const text = await response.text();
    console.log('Respuesta del servidor:', text);
    console.log('-----------------------------------');
}

// Paso 2: Simular el envío de una fichada (Attendance Log)
async function sendPunchLog() {
    console.log(`[2] Enviando datos de asistencia (ATTLOG)...`);

    // Formato Asensio: "PIN \t Fecha_y_Hora \t TipoDeVerificacion \t Estado"
    const now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); // Formato: YYYY-MM-DD HH:mm:ss
    const pinEmpleado = "1001";
    const bodyText = `${pinEmpleado}\t${now}\t1\t0`;

    const response = await fetch(`${SERVER_URL}/iclock/cdata?SN=${DEVICE_SN}&table=ATTLOG`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: bodyText
    });

    const text = await response.text();
    console.log('Respuesta del servidor:', text); // Debería responder "OK"
    console.log('-----------------------------------');
}

// Ejecutar el flujo
async function run() {
    await handshake();
    await sendPunchLog();
}

run();
