// backend/scripts/debug_system.js
import mongoose from "mongoose";
import axios from "axios";
import "dotenv/config";
import Visit from "../src/models/Visit.js";
import Cat from "../src/models/Cat.js";

const debugSystem = async () => {
    console.log("🔍 DIAGNOSTIC TOOL INITIALIZING...\n");

    // 1. Check MongoDB Connection
    if (!process.env.MONGODB_URL) {
        console.error("❌ ERROR: MONGODB_URL is missing in .env");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("✅ MongoDB Connected");

        const visitCount = await Visit.countDocuments();
        const catCount = await Cat.countDocuments();
        console.log(`📊 Current DB Stats:`);
        console.log(`   - Visits Found: ${visitCount}`);
        console.log(`   - Cats Found:   ${catCount}`);

    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
        return;
    }

    // 2. Check Blynk Live Data
    const token = process.env.BLYNK_AUTH_TOKEN;
    if (!token) {
        console.error("❌ ERROR: BLYNK_AUTH_TOKEN is missing");
    } else {
        try {
            console.log("\n🌍 Fetching Live Blynk Data...");
            const v0 = await axios.get(`https://blynk.cloud/external/api/get?token=${token}&v0`); // Weight
            const v3 = await axios.get(`https://blynk.cloud/external/api/get?token=${token}&v3`); // Duration

            const weight = parseFloat(v0.data);
            const duration = parseInt(v3.data);

            console.log(`   - Current Weight (V0): ${weight} kg`);
            console.log(`   - Last Visit Duration (V3): ${duration} sec`);

            console.log("\n🕵️ ANALYSIS:");
            if (weight < 1.0 && duration === 0) {
                console.log("   👉 The sensors are currently IDLE (0 weight, 0 duration).");
                console.log("   👉 RESULT: No data will be saved until the cat enters the box.");
            } else if (weight > 1.0) {
                console.log("   👉 Cat is detected on scale! Live weight should be updating.");
            } else if (duration > 0) {
                console.log("   👉 A visit finished recently. It should have been saved.");
            }
        } catch (err) {
            console.error("❌ Blynk API Failed:", err.message);
        }
    }

    process.exit();
};

debugSystem();
