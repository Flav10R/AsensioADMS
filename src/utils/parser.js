/**
 * Parses ZKTeco raw data (TSV format) into JSON objects.
 * Different endpoints and parameters send different formats.
 */

function parseAttendanceData(textData, deviceSn) {
    const lines = textData.split('\n');
    const records = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Typical format for an attendance record:
        // PIN  Time    VerifyType  Status      WorkCode
        // 1    2023-10-10 10:00:00 1   0   0
        const parts = line.split('\t');
        if (parts.length >= 2) {
            records.push({
                device_sn: deviceSn,
                user_pin: parts[0],
                punch_time: parts[1],
                verify_type: parts[2] ? parseInt(parts[2], 10) : 0,
                status: parts[3] ? parseInt(parts[3], 10) : 0
            });
        }
    }
    return records;
}

module.exports = {
    parseAttendanceData
};
