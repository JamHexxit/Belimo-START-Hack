const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { InfluxDB } = require('@influxdata/influxdb-client');
const { Point } = require('@influxdata/influxdb-client');


const app = express();
app.use(express.json());
app.use(cors());

// Move config path up one directory into '/config'
const CONFIG_DIR = path.join(__dirname, '../config');
const DEVICES_FILE = path.join(CONFIG_DIR, 'devices.json');
const ROOMS_FILE = path.join(CONFIG_DIR, 'rooms.json');

// Ensure the config directory exists before trying to read/write
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Memory Registries
// Device Structure: Map<deviceId, { url, token, org, bucket, roomId, client }>
const deviceRegistry = new Map();
// Room Structure: Map<roomId, { name, threshold, ...otherConfig }>
const roomRegistry = new Map();

/**
 * --- ROOM HELPERS ---
 */
function loadRooms() {
    if (fs.existsSync(ROOMS_FILE)) {
        const data = fs.readFileSync(ROOMS_FILE, 'utf8');
        const rooms = JSON.parse(data);
        for (const [roomId, config] of Object.entries(rooms)) {
            roomRegistry.set(roomId, config);
        }
        console.log(`Loaded ${roomRegistry.size} rooms.`);
    }
}

function saveRooms() {
    const dataToSave = Object.fromEntries(roomRegistry);
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
}

/**
 * --- DEVICE HELPERS ---
 */
function loadDevices() {
    if (fs.existsSync(DEVICES_FILE)) {
        const data = fs.readFileSync(DEVICES_FILE, 'utf8');
        const devices = JSON.parse(data);

        for (const [deviceId, config] of Object.entries(devices)) {
            // Re-initialize the InfluxDB client for each loaded device
            const client = new InfluxDB({ url: config.influxUrl, token: config.influxToken });

            deviceRegistry.set(deviceId, {
                ...config,
                client
            });
            console.log(`Loaded device ${deviceId} mapping to ${config.influxUrl}`);
        }
    }
}

function saveDevices() {
    const dataToSave = {};
    for (const [deviceId, data] of deviceRegistry.entries()) {
        dataToSave[deviceId] = {
            influxUrl: data.influxUrl,
            influxToken: data.influxToken,
            org: data.org,
            bucket: data.bucket,
            roomId: data.roomId // Persist the assigned room
        };
    }
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
}

// Initialize data from config files on startup
loadRooms();
loadDevices();

/**
 * ==========================================
 * ROOM ENDPOINTS
 * ==========================================
 */

// 1. Create or Update a Room
app.post('/api/rooms', (req, res) => {
    const { name, threshold, roomId: providedId } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = providedId || crypto.randomUUID();
    const roomConfig = {
        name,
        threshold: threshold || 0 // Default threshold if not provided
    };

    roomRegistry.set(roomId, roomConfig);
    saveRooms();

    console.log(`Room saved: ${roomId} (${name})`);
    res.json({ message: 'Room saved successfully', roomId, room: roomConfig });
});

// 2. Get all Rooms
app.get('/api/rooms', (req, res) => {
    const rooms = [];
    for (const [roomId, data] of roomRegistry.entries()) {
        rooms.push({ roomId, ...data });
    }
    res.json(rooms);
});

// 3. Delete a Room
app.delete('/api/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (roomRegistry.has(roomId)) {
        roomRegistry.delete(roomId);
        saveRooms();

        // Optional: Detach this room from any assigned devices
        for (const [deviceId, device] of deviceRegistry.entries()) {
            if (device.roomId === roomId) {
                device.roomId = null;
            }
        }
        saveDevices();

        res.json({ message: 'Room deleted successfully' });
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

/**
 * ==========================================
 * DEVICE ENDPOINTS
 * ==========================================
 */

// 1. Add a new Device
app.post('/api/devices', (req, res) => {
    const { influxUrl, influxToken, org, bucket, roomId } = req.body;

    if (!influxUrl || !influxToken || !org || !bucket) {
        return res.status(400).json({ error: 'Missing required InfluxDB connection fields' });
    }

    if (roomId && !roomRegistry.has(roomId)) {
        return res.status(400).json({ error: 'Provided roomId does not exist' });
    }

    const deviceId = crypto.randomUUID();
    const client = new InfluxDB({ url: influxUrl, token: influxToken });

    deviceRegistry.set(deviceId, {
        influxUrl,
        influxToken,
        org,
        bucket,
        roomId: roomId || null,
        client // Cache the initialized client
    });

    saveDevices();

    console.log(`Manually added new device: ${deviceId} at ${influxUrl}`);
    res.json({ message: 'Device added successfully', deviceId });
});

// 2. Assign/Change the Room of an existing Device
app.patch('/api/devices/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const { roomId } = req.body;

    const device = deviceRegistry.get(deviceId);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (roomId && !roomRegistry.has(roomId)) {
        return res.status(400).json({ error: 'Provided roomId does not exist' });
    }

    device.roomId = roomId || null; // Allows un-assigning if null is passed
    saveDevices();

    res.json({ message: 'Device room updated successfully', deviceId, roomId });
});

// 3. Get all Devices
app.get('/api/devices', (req, res) => {
    const devices = [];
    for (const [deviceId, data] of deviceRegistry.entries()) {
        devices.push({
            deviceId,
            url: data.influxUrl,
            org: data.org,
            bucket: data.bucket,
            roomId: data.roomId
        });
    }
    res.json(devices);
});

// 4. Query a specific device
app.get('/api/devices/:deviceId/getInformations', async (req, res) => {
    const { deviceId } = req.params;
    const fluxQuery = `
      from(bucket: "actuator-data")
        |> range(start: -10m)
        |> last()
    `;

    const device = deviceRegistry.get(deviceId);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    const queryApi = device.client.getQueryApi(device.org);
    const results = [];

    try {
        queryApi.queryRows(fluxQuery, {
            next(row, tableMeta) {
                const dataObject = tableMeta.toObject(row);
                results.push(dataObject);
            },
            error(error) {
                console.error(`Error querying device ${deviceId}:`, error);
                res.status(500).json({ error: error.message });
            },
            complete() {
                res.json(results);
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to execute query' });
        console.error('Error executing query:', err);
    }
});

// 5. Remove a device
app.delete('/api/devices/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    if (deviceRegistry.has(deviceId)) {
        deviceRegistry.delete(deviceId);
        saveDevices();
        res.json({ message: 'Device removed successfully' });
    } else {
        res.status(404).json({ error: 'Device not found' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Central Backend running on port ${PORT}`);
});

for(const [deviceId, device] of deviceRegistry){
    const writeApi = device.client.getWriteApi(device.org, 'actuator-data', 'ns');

    // Just the measurement name, no tags!
    const point = new Point('_process')
        .floatField('setpoint_position_%', 100) // Your target position
        .intField('test_number', 70)           // Your experiment tag
        .timestamp(new Date(0));

    // Write to the local buffer
    writeApi.writePoint(point);

    // Flush the buffer immediately to move the hardware
    writeApi.close()
        .then(() => {
            console.log(`\nCOMMAND SENT: Actuator moving to 50%`);
        })
        .catch(error => {
            console.error('\nWrite Error:', error);
        });

}