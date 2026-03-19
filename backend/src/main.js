const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { InfluxDB } = require('@influxdata/influxdb-client');

const app = express();
app.use(express.json());
app.use(cors());

// Move config path up one directory into '/config'
const CONFIG_DIR = path.join(__dirname, '../config');
const DEVICES_FILE = path.join(CONFIG_DIR, 'devices.json');
const ROOMS_FILE = path.join(CONFIG_DIR, 'rooms.json');
const OFFLINE_MODE = process.env.OFFLINE_MODE === 'true';

// Ensure the config directory exists before trying to read/write
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Memory Registries
// Device Structure: Map<deviceId, { url, token, org, bucket, roomId, name, client, lastPosition, positionStagnantCount, mockSimulationState }>
const deviceRegistry = new Map();
// Room Structure: Map<roomId, { name, threshold, ...otherConfig }>
const roomRegistry = new Map();

let mockSensorData = [];
if (OFFLINE_MODE) {
    console.log("Starting in OFFLINE MODE. Attempting to load mock data...");
    const possiblePaths = [
        path.join(__dirname, '../collected_sensor_data.json'),
        path.join(__dirname, '../../collected_sensor_data.json')
    ];
    let loaded = false;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            mockSensorData = JSON.parse(fs.readFileSync(p, 'utf8'));
            console.log(`Loaded ${mockSensorData.length} mock data points from ${p}`);
            loaded = true;
            break;
        }
    }
    if (!loaded) console.log("Warning: No collected_sensor_data.json found. We will simulate data internally.");
}

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
                client,
                lastPosition: null,
                positionStagnantCount: 0,
                // Add a state object for offline simulations
                mockSimulationState: { scenario: 'normal', tick: 0, setpoint: 100, feedback: 0 }
            });
            console.log(`Loaded device ${deviceId} mapping to ${config.influxUrl}`);
        }
    } 
    
    if (OFFLINE_MODE && deviceRegistry.size === 0) {
        // Create dummy devices if offline and no config exists to test different scenarios
        const dummyDevices = [
            { id: 'offline-healthy-1', name: 'Healthy Actuator', scenario: 'normal' },
            { id: 'offline-calcified-2', name: 'Calcified Actuator (Warning)', scenario: 'calcified' },
            { id: 'offline-jammed-3', name: 'Jammed Actuator (Error)', scenario: 'jammed' }
        ];

        for (const d of dummyDevices) {
            deviceRegistry.set(d.id, {
                influxUrl: 'http://localhost:8086',
                influxToken: 'dummy',
                org: 'dummy',
                bucket: 'dummy',
                roomId: null,
                name: d.name,
                client: null,
                lastPosition: null,
                positionStagnantCount: 0,
                mockSimulationState: { scenario: d.scenario, tick: 0, setpoint: 100, feedback: 0 }
            });
        }
        console.log('Added 3 dummy devices for OFFLINE_MODE scenarios (Healthy, Warning, Error)');
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
            roomId: data.roomId, // Persist the assigned room
            name: data.name // Persist the custom name
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

// Add a new Device
app.post('/api/devices', (req, res) => {
    const { influxUrl, influxToken, org, bucket, roomId, name } = req.body;

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
        name: name || `Device ${deviceId.substring(0, 8)}`,
        client, // Cache the initialized client
        lastPosition: null,
        positionStagnantCount: 0,
        mockSimulationState: { scenario: 'normal', tick: 0, setpoint: 100, feedback: 0 }
    });

    saveDevices();

    console.log(`Manually added new device: ${deviceId} at ${influxUrl}`);
    res.json({ message: 'Device added successfully', deviceId });
});

// Assign/Change the Room, name, or connection details of an existing Device
app.patch('/api/devices/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const { roomId, name, influxUrl, influxToken, org, bucket } = req.body;

    const device = deviceRegistry.get(deviceId);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (roomId !== undefined) {
        if (roomId && !roomRegistry.has(roomId)) {
            return res.status(400).json({ error: 'Provided roomId does not exist' });
        }
        device.roomId = roomId || null;
    }
    
    if (name !== undefined) {
        device.name = name;
    }

    let rebuildClient = false;
    if (influxUrl !== undefined) { device.influxUrl = influxUrl; rebuildClient = true; }
    if (influxToken !== undefined && influxToken.trim() !== '') { device.influxToken = influxToken; rebuildClient = true; }
    if (org !== undefined) { device.org = org; }
    if (bucket !== undefined) { device.bucket = bucket; }

    if (rebuildClient) {
        device.client = new InfluxDB({ url: device.influxUrl, token: device.influxToken });
    }

    saveDevices();
    res.json({ message: 'Device updated successfully', deviceId, roomId: device.roomId, name: device.name });
});

// Get all Devices
app.get('/api/devices', (req, res) => {
    const devices = [];
    for (const [deviceId, data] of deviceRegistry.entries()) {
        devices.push({
            deviceId,
            name: data.name || `Device ${deviceId.substring(0, 8)}`, // fallback if old device has no name
            url: data.influxUrl,
            org: data.org,
            bucket: data.bucket,
            roomId: data.roomId
        });
    }
    res.json(devices);
});

// Mock counter to rotate through mock data
let mockDataIndex = 0;

// Helper function to generate simulated data based on a scenario
function generateSimulatedReading(device) {
    const state = device.mockSimulationState;
    state.tick++;

    // Base readings
    let reading = {
        'setpoint_position_%': state.setpoint,
        'feedback_position_%': state.feedback,
        'rotation_direction': 0,
        'motor_torque_Nmm': 150, // default baseline
        'power_W': 5,
        'internal_temperature_deg_C': 25
    };

    // Every 50 ticks (approx 25 seconds if polled every 500ms), change direction
    if (state.tick % 50 === 0) {
        state.setpoint = state.setpoint === 100 ? 0 : 100;
    }

    const diff = state.setpoint - state.feedback;
    const isMoving = Math.abs(diff) > 0;

    if (device.mockSimulationState.scenario === 'normal') {
        if (isMoving) {
            state.feedback += diff > 0 ? 5 : -5;
            reading['rotation_direction'] = diff > 0 ? 1 : 2;
            reading['motor_torque_Nmm'] = 150 + (Math.random() * 10 - 5); // Normal variance
        }
    } 
    else if (device.mockSimulationState.scenario === 'calcified') {
        if (isMoving) {
            state.feedback += diff > 0 ? 4 : -4; // Moves slightly slower
            reading['rotation_direction'] = diff > 0 ? 1 : 2;
            reading['motor_torque_Nmm'] = 185 + (Math.random() * 5); // 20%+ higher than 150 baseline (triggers WARNING)
        }
    }
    else if (device.mockSimulationState.scenario === 'jammed') {
        // Starts moving normally, but jams at 30%
        if (isMoving) {
            if (diff > 0 && state.feedback >= 30) {
                // Jammed while opening
                reading['rotation_direction'] = 0; // Stuck
                reading['motor_torque_Nmm'] = 240 + (Math.random() * 20); // 50%+ higher than 150 (triggers ERROR)
            } else if (diff < 0 && state.feedback <= 30) {
                 // Jammed while closing
                reading['rotation_direction'] = 0; // Stuck
                reading['motor_torque_Nmm'] = 240 + (Math.random() * 20); // 50%+ higher
            } else {
                // Moving normally before the jam point
                state.feedback += diff > 0 ? 5 : -5;
                reading['rotation_direction'] = diff > 0 ? 1 : 2;
                reading['motor_torque_Nmm'] = 150 + (Math.random() * 10 - 5);
            }
        }
    }

    // Ensure bounds
    if (state.feedback > 100) state.feedback = 100;
    if (state.feedback < 0) state.feedback = 0;
    
    reading['feedback_position_%'] = state.feedback;
    reading['setpoint_position_%'] = state.setpoint;

    return reading;
}


// Helper function to check for anomalies
function analyzeDeviceHealth(deviceId, reading) {
    const device = deviceRegistry.get(deviceId);
    if (!device) return { status: 'healthy', message: 'Device missing.' };

    let threshold = 0;
    if (device.roomId) {
        const room = roomRegistry.get(device.roomId);
        if (room) threshold = room.threshold;
    }
    
    // Default baseline if threshold is 0. Replace with your actual baseline calculation if needed.
    const baselineTorque = threshold > 0 ? threshold : 150; 
    
    // Convert to numbers explicitly just in case
    const currentTorque = Number(reading['motor_torque_Nmm']);
    const setpoint = Number(reading['setpoint_position_%']);
    const feedback = Number(reading['feedback_position_%']);
    const rotationDir = Number(reading['rotation_direction']); // 0 still, 1 opening, 2 closing
    
    // Make sure we have valid numbers
    if (isNaN(currentTorque) || isNaN(setpoint) || isNaN(feedback)) {
        return { status: 'unknown', message: 'Incomplete sensor data.' };
    }

    const positionDifference = Math.abs(setpoint - feedback);
    const isCommandedToMove = positionDifference > 5;
    
    // Check if the device is stuck
    if (isCommandedToMove) {
        if (device.lastPosition !== null && Math.abs(device.lastPosition - feedback) < 0.5) {
             // Position has not changed significantly since last reading
             device.positionStagnantCount = (device.positionStagnantCount || 0) + 1;
        } else {
             device.positionStagnantCount = 0; // Reset if moving
        }
    } else {
        device.positionStagnantCount = 0;
    }
    
    // Update last position for next check
    device.lastPosition = feedback;
    
    if (isCommandedToMove) {
        // 1. Critical Failure Check: Actuator commanded to move but isn't
        // If it's been stagnant for multiple readings, or torque is way too high
        
        // If the position hasn't changed for 3 consecutive readings while it should be moving
        if (device.positionStagnantCount >= 3) {
            return {
                status: 'error',
                message: `CRITICAL: Actuator jam detected! Target is ${setpoint}%, but position is stuck at ${feedback}%. Immediate maintenance required.`
            };
        }
        
        if (currentTorque > baselineTorque * 1.5) {
            // Torque is 50% higher than baseline - likely jammed
            return {
                status: 'error',
                message: `CRITICAL: Actuator jam detected! High torque (${currentTorque.toFixed(1)} Nmm) but unable to reach target position.`
            };
        } else if ((rotationDir === 1 || rotationDir === 2) && currentTorque > baselineTorque) {
            // Supposed to move, torque applied, but not rotating
            return {
                status: 'error',
                message: `CRITICAL: Actuator failure. Commanded to move (Setpoint: ${setpoint}%, Feedback: ${feedback}%) but rotation is 0 despite applied torque.`
            };
        }
    }

    // 2. Predictive Maintenance Warning: Torque is higher than normal
    // If torque is consistently higher than baseline, it might be mineral buildup.
    if (currentTorque > baselineTorque * 1.2) {
         // Torque is 20% higher than baseline
         return {
             status: 'warning',
             message: `WARNING: Elevated torque detected (${currentTorque.toFixed(1)} Nmm vs baseline ${baselineTorque} Nmm). Possible mineral buildup (calcification). Check within 3 months.`
         };
    }

    return { status: 'healthy', message: 'Operating normally.' };
}

// Query a specific device
app.get('/api/devices/:deviceId/getInformations', async (req, res) => {
    const { deviceId } = req.params;

    const device = deviceRegistry.get(deviceId);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (OFFLINE_MODE) {
        let reading;
        
        // Use the simulation engine if we don't have recorded mock data
        if (mockSensorData.length === 0 || !device.mockSimulationState.scenario.includes('normal')) {
             reading = generateSimulatedReading(device);
        } else {
            // Use the JSON recording if it's available and the device isn't explicitly set to simulate a failure
            reading = mockSensorData[mockDataIndex];
            mockDataIndex = (mockDataIndex + 1) % mockSensorData.length;
        }

        const results = Object.keys(reading)
            .filter(key => key !== 'local_timestamp' && key !== 'device_time')
            .map(key => ({
                _time: new Date().toISOString(), // Use current time so frontend charts advance
                _field: key,
                _value: reading[key]
            }));
            
        // Append health status
        const health = analyzeDeviceHealth(deviceId, reading);

        return res.json({
             data: results,
             health: health
        });
    }

    const fluxQuery = `
      from(bucket: "actuator-data")
        |> range(start: -1m)
        |> last()
    `;

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
                // To run the analyzer on live data, we need to reconstruct the reading object
                const reading = {};
                for (const r of results) {
                    reading[r._field] = r._value;
                }
                
                const health = analyzeDeviceHealth(deviceId, reading);
                
                res.json({
                    data: results,
                    health: health
                });
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to execute query' });
        console.error('Error executing query:', err);
    }
});


// Get Device status
app.get('/api/devices/:deviceId/status', async (req, res) => {
    const { deviceId } = req.params;
    const device = deviceRegistry.get(deviceId);

    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (OFFLINE_MODE) {
        return res.json({ deviceId, status: 'online' });
    }

    const queryApi = device.client.getQueryApi(device.org);

    const fluxQuery = `buckets() |> limit(n: 1)`;

    try {
        await queryApi.collectRows(fluxQuery);
        res.json({ deviceId, status: 'online' });
    } catch (error) {
        res.json({
            deviceId,
            status: 'offline',
            error: error.message
        });
    }
});

// Remove a device
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