const fs = require('fs');
const path = require('path');

const configDir = 'c:/Users/Elia/Belimo-START-Hack/backend/config';

const companies = {
  "astra-bioscience": { "name": "Astra Bioscience" },
  "horizon-retail": { "name": "Horizon Retail Group" },
  "skyline-hospitality": { "name": "Skyline Hospitality" },
  "greentech-data": { "name": "GreenTech Data Solutions" }
};

const buildings = {
  "bld-astra-1": { "name": "Innovation Lab", "companyId": "astra-bioscience" },
  "bld-astra-2": { "name": "Production Site A", "companyId": "astra-bioscience" },
  "bld-horizon-1": { "name": "Grand Central Mall", "companyId": "horizon-retail" },
  "bld-horizon-2": { "name": "Metropole Plaza", "companyId": "horizon-retail" },
  "bld-skyline-1": { "name": "The Grand Regency", "companyId": "skyline-hospitality" },
  "bld-skyline-2": { "name": "Skyline Boutique Hotel", "companyId": "skyline-hospitality" },
  "bld-greentech-1": { "name": "DeepCool Facility", "companyId": "greentech-data" },
  "bld-greentech-2": { "name": "Edge Computing Hub", "companyId": "greentech-data" }
};

const places = {
  "plc-astra-1-1": { "name": "R&D Lab 1", "buildingId": "bld-astra-1", "type": "room", "threshold": 150 },
  "plc-astra-1-2": { "name": "Main Server Room", "buildingId": "bld-astra-1", "type": "room", "threshold": 160 },
  "plc-astra-2-1": { "name": "Assembly Line", "buildingId": "bld-astra-2", "type": "room", "threshold": 180 },
  "plc-horizon-1-1": { "name": "Main Lobby", "buildingId": "bld-horizon-1", "type": "room", "threshold": 150 },
  "plc-horizon-1-2": { "name": "Food Court", "buildingId": "bld-horizon-1", "type": "room", "threshold": 150 },
  "plc-skyline-1-1": { "name": "Presidential Suite", "buildingId": "bld-skyline-1", "type": "room", "threshold": 140 },
  "plc-skyline-1-2": { "name": "Main Kitchen", "buildingId": "bld-skyline-1", "type": "room", "threshold": 160 },
  "plc-greentech-1-1": { "name": "DC Room 1", "buildingId": "bld-greentech-1", "type": "room", "threshold": 170 },
  "plc-greentech-2-1": { "name": "Edge Hub", "buildingId": "bld-greentech-2", "type": "room", "threshold": 150 }
};

const devices = {
  "offline-healthy-astra-lab": {
    "influxUrl": "http://localhost:8086",
    "influxToken": "dummy",
    "org": "belimo",
    "bucket": "dummy",
    "placeId": "plc-astra-1-1",
    "name": "Lab Actuator 01",
    "scenario": "normal"
  },
  "offline-calcified-astra-server": {
    "influxUrl": "http://localhost:8086",
    "influxToken": "dummy",
    "org": "belimo",
    "bucket": "dummy",
    "placeId": "plc-astra-1-2",
    "name": "Server Fan 01",
    "scenario": "calcified"
  },
  "offline-healthy-horizon-lobby": {
    "influxUrl": "http://localhost:8086",
    "influxToken": "dummy",
    "org": "belimo",
    "bucket": "dummy",
    "placeId": "plc-horizon-1-1",
    "name": "Lobby Vent 04",
    "scenario": "normal"
  },
  "offline-jammed-horizon-food": {
    "influxUrl": "http://localhost:8086",
    "influxToken": "dummy",
    "org": "belimo",
    "bucket": "dummy",
    "placeId": "plc-horizon-1-2",
    "name": "Mixer Valve",
    "scenario": "jammed"
  },
  "offline-healthy-skyline-suite": {
    "influxUrl": "http://localhost:8086",
    "influxToken": "dummy",
    "org": "belimo",
    "bucket": "dummy",
    "placeId": "plc-skyline-1-1",
    "name": "HVAC Controller",
    "scenario": "normal"
  },
  "offline-calcified-greentech-dc": {
    "influxUrl": "http://localhost:8086",
    "influxToken": "dummy",
    "org": "belimo",
    "bucket": "dummy",
    "placeId": "plc-greentech-1-1",
    "name": "Cooling Node 01",
    "scenario": "calcified"
  }
};

fs.writeFileSync(path.join(configDir, 'companies.json'), JSON.stringify(companies, null, 2));
fs.writeFileSync(path.join(configDir, 'buildings.json'), JSON.stringify(buildings, null, 2));
fs.writeFileSync(path.join(configDir, 'places.json'), JSON.stringify(places, null, 2));
fs.writeFileSync(path.join(configDir, 'devices.json'), JSON.stringify(devices, null, 2));

console.log("Rich test data generated successfully.");
