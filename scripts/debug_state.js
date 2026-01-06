import mongoose from "mongoose";
import "dotenv/config";
import Cat from "./models/Cat.js";
import Visit from "./models/Visit.js";

const checkState = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB.");

        const cat = await Cat.findOne();
        if (cat) {
            console.log("--- CAT STATUS ---");
            console.log(`ID: ${cat._id}`);
            console.log(`Name: ${cat.name}`);
            console.log(`Last Sensor Status: '${cat.lastSensorStatus}'`);
            console.log(`Current Weight: ${cat.currentWeight}`);
            console.log("------------------");
        } else {
            console.log("❌ No Cat found in database!");
        }

        const lastVisit = await Visit.findOne().sort({ entryTime: -1 });
        if (lastVisit) {
            console.log("--- LAST VISIT ---");
            console.log(`Time: ${lastVisit.entryTime}`);
            console.log(`Duration: ${lastVisit.durationSeconds}s`);
            console.log("------------------");
        } else {
            console.log("ℹ️ No visits recorded yet.");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkState();
