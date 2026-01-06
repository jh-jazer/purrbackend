import mongoose from "mongoose";
import "dotenv/config";
import LitterBoxState from "./models/LitterBoxState.js";

const checkState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB.");

        const state = await LitterBoxState.findOne();
        if (state) {
            console.log("--- CURRENT BOX STATE ---");
            console.log(`Status: '${state.lastSensorStatus}'`);
            console.log(`Weight: ${state.currentWeight}`);
            console.log("-------------------------");
        } else {
            console.log("❌ No State Found (System hasn't run yet?)");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkState();
