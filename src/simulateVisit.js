import mongoose from "mongoose";
import dotenv from "dotenv";
import LitterBoxState from "./models/LitterBoxState.js";
import Visit from "./models/Visit.js";
import fs from 'fs';
import path from 'path';

// Load env
dotenv.config();

const LOG_FILE = path.join(process.cwd(), "simulation_log.txt");

// Clear log file
try { fs.unlinkSync(LOG_FILE); } catch (e) { }

const log = (msg) => {
    const text = (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + "\n";
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, text);
    } catch (e) {
        // ignore
    }
};

const runSimulation = async () => {
    try {
        log("--- STARTING SIMULATION ---");

        if (!process.env.MONGODB_URL && !process.env.MONGO_URI) {
            log("ERROR: MONGODB_URL or MONGO_URI not found in environment");
            return;
        }

        log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);
        log("Connected to MongoDB.");

        // 1. SETUP
        log("\n[STEP 1] Setting up 'Cat Inside' state...");
        let boxState = await LitterBoxState.findOne();
        if (!boxState) {
            boxState = await LitterBoxState.create({ lastSensorStatus: "" });
            log("Created mock box state.");
        }

        boxState.lastSensorStatus = "Cat Inside";
        await boxState.save();
        log(`Updated Sensor status to: '${boxState.lastSensorStatus}'`);
        log(`Updated Cat status to: '${cat.lastSensorStatus}'`);

        // 2. SIMULATE
        log("\n[STEP 2] Simulating Blynk poll with 'Cat Exit'...");
        const statusText = "Cat Exit";
        const lastDuration = 45;

        const wasInside = (boxState.lastSensorStatus || "").toLowerCase().includes("inside");
        const isNowExit = (statusText || "").toLowerCase().includes("exit");

        log(`Logic Check: wasInside=${wasInside}, isNowExit=${isNowExit}`);

        if (wasInside && isNowExit) {
            const lastVisit = await Visit.findOne().sort({ entryTime: -1 });
            const isDuplicate = lastVisit &&
                (Date.now() - new Date(lastVisit.createdAt).getTime() < 5000);

            if (!isDuplicate) {
                const newVisit = await Visit.create({
                    weightIn: boxState.currentWeight || 4.5,
                    entryTime: new Date()
                });

                log(">> SUCCESS: Database Write Confirmed!");
                log(newVisit);
            } else {
                log(">> IGNORED: Duplicate detected.");
            }
        } else {
            log(">> FAILED: Transition conditions not met.");
        }

        if (boxState.lastSensorStatus !== statusText) {
            boxState.lastSensorStatus = statusText;
            await boxState.save();
            log(`[STEP 3] System updated Sensor status to: '${statusText}'`);
        }

        log("\n--- SIMULATION COMPLETE ---");

    } catch (error) {
        log("Simulation Error: " + error.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runSimulation();
