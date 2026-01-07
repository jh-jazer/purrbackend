
import mongoose from "mongoose";
import "dotenv/config";
import LitterBoxState from "../src/models/LitterBoxState.js";

const viewState = async () => {
    if (!process.env.MONGODB_URL && !process.env.MONGO_URI) {
        console.log("❌ No DB Connection String");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URL || process.env.MONGO_URI);

        const state = await LitterBoxState.findOne();

        console.log("\n--- CURRENT DATABASE 'MEMORY' ---");
        if (state) {
            console.log(`Last Sensor Status: '${state.lastSensorStatus}'`);
            console.log(`Stored Weight:      ${state.currentWeight} kg`);
            console.log(`Last Update:        ${new Date(state.updatedAt).toLocaleTimeString()}`);
        } else {
            console.log("No state record found (System is blank).");
        }
        console.log("---------------------------------\n");

    } catch (e) {
        console.log("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
};

viewState();
