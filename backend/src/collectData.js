const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const fs = require('fs');
const path = require('path');

const DEVICES_FILE = path.join(__dirname, '../config/devices.json');

if (!fs.existsSync(DEVICES_FILE)) {
    console.error('devices.json not found! Start your backend first to configure a device.');
    process.exit(1);
}

const devices = JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
const deviceKeys = Object.keys(devices);

if (deviceKeys.length === 0) {
    console.error('No devices configured in devices.json!');
    process.exit(1);
}

// Grab the first configured device
const config = devices[deviceKeys[0]];
const client = new InfluxDB({ url: config.influxUrl, token: config.influxToken });
const device = { ...config, client };

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setPosition(target, testNumber) {
    const writeApi = device.client.getWriteApi(device.org, 'actuator-data', 'ns');
    
    // Just the measurement name, no tags!
    const point = new Point('_process')
        .floatField('setpoint_position_%', target) // Your target position
        .intField('test_number', testNumber)       // Your experiment tag
        .timestamp(new Date(0));

    // Write to the local buffer
    writeApi.writePoint(point);

    // Flush the buffer immediately to move the hardware
    await writeApi.close();
    console.log(`\nCOMMAND SENT: Actuator target set to ${target}%`);
}

async function getLatestReading() {
    const queryApi = device.client.getQueryApi(device.org);
    const fluxQuery = `
      from(bucket: "actuator-data")
        |> range(start: -1m)
        |> last()
    `;
    try {
        const rows = await queryApi.collectRows(fluxQuery);
        const data = { local_timestamp: new Date().toISOString() };
        for (const row of rows) {
            data[row._field] = row._value;
            data.device_time = row._time; // Keeps the timestamp from the device
        }
        return data;
    } catch (e) {
        console.error("Error querying data:", e.message);
        return null;
    }
}

async function runCollection() {
    const collectedData = [];
    const NUM_CYCLES = 3;
    const testNumber = 70; // Tag for this experiment

    console.log(`Connecting to InfluxDB at ${device.influxUrl}`);
    console.log(`Starting data collection for ${NUM_CYCLES} cycles...`);

    for (let cycle = 1; cycle <= NUM_CYCLES; cycle++) {
        console.log(`\n--- Starting Cycle ${cycle}/${NUM_CYCLES} ---`);
        
        // Phase 1: OPENING (target 100%)
        await setPosition(100, testNumber);
        let openWait = 0;
        let lastPos = -1;
        while (true) {
            await sleep(500); // Collect every 500ms
            const data = await getLatestReading();
            if (data && Object.keys(data).length > 2) {
                // To avoid duplicate readings if the sensor hasn't pushed new data yet
                if (data['feedback_position_%'] !== lastPos || data.device_time !== collectedData[collectedData.length - 1]?.device_time) {
                    collectedData.push(data);
                    lastPos = data['feedback_position_%'];
                    console.log(`Opening - Current Position: ${lastPos !== undefined ? lastPos.toFixed(1) : 'N/A'}%`);
                }
                
                // Stop when near 100% or after timeout
                if (lastPos !== undefined && lastPos >= 99) break;
            } else {
                console.log(`Opening - Waiting for valid data...`);
            }
            if (++openWait > 240) { // Max 120 seconds
                console.log("Timeout waiting for open phase.");
                break;
            }
        }
        
        // Phase 2: CLOSING (target 0%)
        await setPosition(0, testNumber);
        let closeWait = 0;
        lastPos = -1;
        while (true) {
            await sleep(500); // Collect every 500ms
            const data = await getLatestReading();
            if (data && Object.keys(data).length > 2) {
                if (data['feedback_position_%'] !== lastPos || data.device_time !== collectedData[collectedData.length - 1]?.device_time) {
                    collectedData.push(data);
                    lastPos = data['feedback_position_%'];
                    console.log(`Closing - Current Position: ${lastPos !== undefined ? lastPos.toFixed(1) : 'N/A'}%`);
                }
                
                // Stop when near 0% or after timeout
                if (lastPos !== undefined && lastPos <= 1) break;
            } else {
                console.log(`Closing - Waiting for valid data...`);
            }
            if (++closeWait > 240) { // Max 120 seconds
                console.log("Timeout waiting for close phase.");
                break;
            }
        }
    }

    console.log(`\nData collection complete! Gathered ${collectedData.length} data points.`);
    const outputPath = path.join(__dirname, '../collected_sensor_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(collectedData, null, 2));
    console.log(`✅ Data successfully saved to: ${outputPath}`);
}

runCollection().catch(console.error);
