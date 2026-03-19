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
const COMPANIES_FILE = path.join(CONFIG_DIR, 'companies.json');
const BUILDINGS_FILE = path.join(CONFIG_DIR, 'buildings.json');
const PLACES_FILE = path.join(CONFIG_DIR, 'places.json');
const ROOMS_FILE = path.join(CONFIG_DIR, 'rooms.json'); // Keep for migration
const OFFLINE_MODE = process.env.OFFLINE_MODE === 'true';

// Ensure the config directory exists before trying to read/write
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Memory Registries
// Device Structure: Map<deviceId, { url, token, org, bucket, placeId, name, client, lastPosition, positionStagnantCount, mockSimulationState }>
const deviceRegistry = new Map();
// Company Structure: Map<companyId, { name }>
const companyRegistry = new Map();
// Building Structure: Map<buildingId, { name, companyId }>
const buildingRegistry = new Map();
// Place Structure: Map<placeId, { name, buildingId, type, threshold }>
const placeRegistry = new Map();

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
 * --- HIERARCHY HELPERS (Company, Building, Place) ---
 */

function loadHierarchy() {
    // 1. Load Companies
    if (fs.existsSync(COMPANIES_FILE)) {
        const data = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
        for (const [id, config] of Object.entries(data)) companyRegistry.set(id, config);
    }
    // 2. Load Buildings
    if (fs.existsSync(BUILDINGS_FILE)) {
        const data = JSON.parse(fs.readFileSync(BUILDINGS_FILE, 'utf8'));
        for (const [id, config] of Object.entries(data)) buildingRegistry.set(id, config);
    }
    // 3. Load Places (and migrate from rooms if needed)
    if (fs.existsSync(PLACES_FILE)) {
        const data = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8'));
        for (const [id, config] of Object.entries(data)) placeRegistry.set(id, config);
    } else if (fs.existsSync(ROOMS_FILE)) {
        console.log("Migrating rooms.json to new hierarchy...");
        const legacyRooms = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8'));
        
        // Ensure a default company and building exist if needed for migration
        let defaultCompanyId = 'default-company';
        let defaultBuildingId = 'default-building';

        if (!companyRegistry.has(defaultCompanyId)) {
            companyRegistry.set(defaultCompanyId, { name: 'Initial Customer' });
        }
        if (!buildingRegistry.has(defaultBuildingId)) {
            buildingRegistry.set(defaultBuildingId, { name: 'Initial Site', companyId: defaultCompanyId });
        }

        for (const [roomId, config] of Object.entries(legacyRooms)) {
            placeRegistry.set(roomId, {
                name: config.name,
                buildingId: defaultBuildingId,
                type: 'room',
                threshold: config.threshold || 0
            });
        }
        
        saveHierarchy();
        console.log(`Migrated ${placeRegistry.size} rooms to places.`);
    }

    console.log(`Loaded ${companyRegistry.size} companies, ${buildingRegistry.size} buildings, ${placeRegistry.size} places.`);
}

function saveHierarchy() {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(Object.fromEntries(companyRegistry), null, 2), 'utf8');
    fs.writeFileSync(BUILDINGS_FILE, JSON.stringify(Object.fromEntries(buildingRegistry), null, 2), 'utf8');
    fs.writeFileSync(PLACES_FILE, JSON.stringify(Object.fromEntries(placeRegistry), null, 2), 'utf8');
}

/**
 * --- DEVICE HELPERS ---
 */
function loadDevices() {
    if (fs.existsSync(DEVICES_FILE)) {
        const data = fs.readFileSync(DEVICES_FILE, 'utf8');
        const devices = JSON.parse(data);

        for (const [deviceId, config] of Object.entries(devices)) {
            // Migration: roomId -> placeId
            if (config.roomId && !config.placeId) {
                config.placeId = config.roomId;
                delete config.roomId;
            }

            const client = new InfluxDB({ url: config.influxUrl, token: config.influxToken });

            deviceRegistry.set(deviceId, {
                ...config,
                client,
                lastPosition: null,
                positionStagnantCount: 0,
                mockSimulationState: { scenario: config.scenario || 'normal', tick: 0, setpoint: 100, feedback: 0 }
            });
            console.log(`Loaded device ${deviceId} mapping to ${config.influxUrl}`);
        }
    } 
    
    if (OFFLINE_MODE && deviceRegistry.size === 0) {
        // Create dummy devices if offline and no config exists
        const dummyDevices = [
            { id: 'offline-healthy-1', name: 'Healthy Actuator', scenario: 'normal' },
            { id: 'offline-calcified-2', name: 'Calcified Actuator (Warning)', scenario: 'calcified' },
            { id: 'offline-jammed-3', name: 'Jammed Actuator (Error)', scenario: 'jammed' }
        ];

        let defaultPlaceId = null;
        if (placeRegistry.size > 0) defaultPlaceId = placeRegistry.keys().next().value;

        for (const d of dummyDevices) {
            deviceRegistry.set(d.id, {
                influxUrl: 'http://localhost:8086',
                influxToken: 'dummy',
                org: 'dummy',
                bucket: 'dummy',
                placeId: defaultPlaceId,
                name: d.name,
                client: null,
                lastPosition: null,
                positionStagnantCount: 0,
                mockSimulationState: { scenario: d.scenario, tick: 0, setpoint: 100, feedback: 0 }
            });
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
            placeId: data.placeId,
            name: data.name
        };
    }
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
}

// Initialize data from config files on startup
loadHierarchy();
loadDevices();

/**
 * ==========================================
 * HIERARCHY ENDPOINTS
 * ==========================================
 */

// --- COMPANIES ---
app.post('/api/companies', (req, res) => {
    const { name, companyId: providedId } = req.body;
    if (!name) return res.status(400).json({ error: 'Company name is required' });
    const id = providedId || crypto.randomUUID();
    companyRegistry.set(id, { name });
    saveHierarchy();
    res.json({ message: 'Company saved', companyId: id });
});

app.patch('/api/companies/:companyId', (req, res) => {
    const { companyId } = req.params;
    const { name } = req.body;
    if (!companyRegistry.has(companyId)) return res.status(404).json({ error: 'Company not found' });
    if (name) companyRegistry.get(companyId).name = name;
    saveHierarchy();
    res.json({ message: 'Company updated' });
});

app.delete('/api/companies/:companyId', (req, res) => {
    const { companyId } = req.params;
    if (!companyRegistry.has(companyId)) return res.status(404).json({ error: 'Company not found' });
    
    // Cascaded delete
    for (const [bid, b] of buildingRegistry.entries()) {
        if (b.companyId === companyId) {
            // Delete places in this building
            for (const [pid, p] of placeRegistry.entries()) {
                if (p.buildingId === bid) placeRegistry.delete(pid);
            }
            buildingRegistry.delete(bid);
        }
    }
    companyRegistry.delete(companyId);
    saveHierarchy();
    res.json({ message: 'Company and all its locations deleted' });
});

app.get('/api/companies', (req, res) => {
    res.json(Array.from(companyRegistry).map(([id, d]) => ({ companyId: id, ...d })));
});

// --- BUILDINGS ---
app.post('/api/buildings', (req, res) => {
    const { name, companyId, buildingId: providedId } = req.body;
    if (!name || !companyId) return res.status(400).json({ error: 'Name and companyId required' });
    const id = providedId || crypto.randomUUID();
    buildingRegistry.set(id, { name, companyId });
    saveHierarchy();
    res.json({ message: 'Building saved', buildingId: id });
});

app.patch('/api/buildings/:buildingId', (req, res) => {
    const { buildingId } = req.params;
    const { name, companyId } = req.body;
    if (!buildingRegistry.has(buildingId)) return res.status(404).json({ error: 'Building not found' });
    const b = buildingRegistry.get(buildingId);
    if (name) b.name = name;
    if (companyId) b.companyId = companyId;
    saveHierarchy();
    res.json({ message: 'Building updated' });
});

app.delete('/api/buildings/:buildingId', (req, res) => {
    const { buildingId } = req.params;
    if (!buildingRegistry.has(buildingId)) return res.status(404).json({ error: 'Building not found' });
    
    // Cascaded delete places
    for (const [pid, p] of placeRegistry.entries()) {
        if (p.buildingId === buildingId) placeRegistry.delete(pid);
    }
    buildingRegistry.delete(buildingId);
    saveHierarchy();
    res.json({ message: 'Building and all its places deleted' });
});

app.get('/api/buildings', (req, res) => {
    res.json(Array.from(buildingRegistry).map(([id, d]) => ({ buildingId: id, ...d })));
});

// --- PLACES (was Rooms) ---
app.post('/api/places', (req, res) => {
    const { name, buildingId, type, threshold, placeId: providedId } = req.body;

    if (!name || !buildingId) {
        return res.status(400).json({ error: 'Place name and buildingId are required' });
    }

    const id = providedId || crypto.randomUUID();
    const config = {
        name,
        buildingId,
        type: type || 'room',
        threshold: threshold || 0
    };

    placeRegistry.set(id, config);
    saveHierarchy();
    res.json({ message: 'Place saved', placeId: id, place: config });
});

app.get('/api/places', (req, res) => {
    res.json(Array.from(placeRegistry).map(([id, d]) => ({ placeId: id, ...d })));
});

app.patch('/api/places/:placeId', (req, res) => {
    const { placeId } = req.params;
    const { name, buildingId, type, threshold } = req.body;
    if (!placeRegistry.has(placeId)) return res.status(404).json({ error: 'Place not found' });
    const p = placeRegistry.get(placeId);
    if (name !== undefined) p.name = name;
    if (buildingId !== undefined) p.buildingId = buildingId;
    if (type !== undefined) p.type = type;
    if (threshold !== undefined) p.threshold = threshold;
    saveHierarchy();
    res.json({ message: 'Place updated' });
});

app.delete('/api/places/:placeId', (req, res) => {
    const { placeId } = req.params;
    if (placeRegistry.has(placeId)) {
        placeRegistry.delete(placeId);
        saveHierarchy();

        // Detach from devices
        for (const [deviceId, device] of deviceRegistry.entries()) {
            if (device.placeId === placeId) device.placeId = null;
        }
        saveDevices();
        res.json({ message: 'Place deleted successfully' });
    } else {
        res.status(404).json({ error: 'Place not found' });
    }
});

/**
 * ==========================================
 * DEVICE ENDPOINTS
 * ==========================================
 */

// Add a new Device
app.post('/api/devices', (req, res) => {
    const { influxUrl, influxToken, org, bucket, placeId, name } = req.body;

    if (!influxUrl || !influxToken || !org || !bucket) {
        return res.status(400).json({ error: 'Missing required InfluxDB connection fields' });
    }

    if (placeId && !placeRegistry.has(placeId)) {
        return res.status(400).json({ error: 'Provided placeId does not exist' });
    }

    const deviceId = crypto.randomUUID();
    const client = new InfluxDB({ url: influxUrl, token: influxToken });

    deviceRegistry.set(deviceId, {
        influxUrl,
        influxToken,
        org,
        bucket,
        placeId: placeId || null,
        name: name || `Device ${deviceId.substring(0, 8)}`,
        client,
        lastPosition: null,
        positionStagnantCount: 0,
        mockSimulationState: { scenario: 'normal', tick: 0, setpoint: 100, feedback: 0 }
    });

    saveDevices();
    res.json({ message: 'Device added successfully', deviceId });
});

// Assign/Change the Room, name, or connection details of an existing Device
app.patch('/api/devices/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const { placeId, name, influxUrl, influxToken, org, bucket } = req.body;

    const device = deviceRegistry.get(deviceId);
    if (!device) {
        return res.status(404).json({ error: 'Device not found' });
    }

    if (placeId !== undefined) {
        if (placeId && !placeRegistry.has(placeId)) {
            return res.status(400).json({ error: 'Provided placeId does not exist' });
        }
        device.placeId = placeId || null;
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
    res.json({ message: 'Device updated successfully', deviceId, placeId: device.placeId, name: device.name });
});

// Get all Devices
app.get('/api/devices', (req, res) => {
    const devices = [];
    for (const [deviceId, data] of deviceRegistry.entries()) {
        devices.push({
            deviceId,
            name: data.name || `Device ${deviceId.substring(0, 8)}`,
            url: data.influxUrl,
            org: data.org,
            bucket: data.bucket,
            placeId: data.placeId
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
            // 20%+ higher than 150 baseline (triggers WARNING, ~185)
            reading['motor_torque_Nmm'] = 185 + (Math.random() * 5); 
        }
    }
    else if (device.mockSimulationState.scenario === 'jammed') {
        // Starts moving normally, but jams at 30%
        if (isMoving) {
            if (diff > 0 && state.feedback >= 30) {
                // Jammed while opening
                reading['rotation_direction'] = 0; // Stuck
                // 50%+ higher than 150 (triggers ERROR, >225)
                reading['motor_torque_Nmm'] = 240 + (Math.random() * 20); 
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
    if (device.placeId) {
        const place = placeRegistry.get(device.placeId);
        if (place) threshold = place.threshold;
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
    // We only check if it should be moving AND if it's currently instructed to move
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
        
        // If the position hasn't changed for 5 consecutive readings while it should be moving
        if (device.positionStagnantCount >= 5) {
            return {
                status: 'error',
                message: `CRITICAL: Actuator jam detected! Target is ${setpoint}%, but position is stuck at ${feedback}%. Immediate maintenance required.`
            };
        }
        
        // Only trigger high torque jam if torque is EXTREMELY high (e.g. 50% above baseline) AND rotation is 0
        // (Removed rotationDir === 0 requirement since the sensor might report 1/2 while completely jammed)
        // Also removed the immediate rotation = 0 check unless it's been stagnant.
    }

    // 2. Predictive Maintenance Warning & Critical Torque:
    // Only check for calcification/extreme torque if it is actually moving or trying to move.
    if (isCommandedToMove) {
        // Extreme torque (e.g., 50% higher than baseline)
        if (currentTorque > baselineTorque * 1.5) {
            return {
                status: 'error',
                message: `CRITICAL: Dangerously high torque detected (${currentTorque.toFixed(1)} Nmm vs baseline ${baselineTorque} Nmm). Motor damage imminent.`
            };
        } 
        // Elevated torque (e.g., 20% higher than baseline)
        else if (currentTorque > baselineTorque * 1.2) {
             return {
                 status: 'warning',
                 message: `WARNING: Elevated torque detected (${currentTorque.toFixed(1)} Nmm vs baseline ${baselineTorque} Nmm). Possible mineral buildup (calcification). Check within 3 months.`
             };
        }
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
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use. Please close the process using it (e.g., Brave or another node instance).`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});