import mongoose from "mongoose";
import "dotenv/config";
import Visit from "./models/Visit.js";

const seedVisits = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            console.error("❌ Error: MONGODB_URL is not defined in .env file");
            process.exit(1);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ MongoDB Connected");

        // 1. Clear existing visits
        await Visit.deleteMany({});
        console.log("Cleared old visits.");

        // 2. Generate 50 Visits (No Cat ID needed for single-cat mode)
        const visits = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 50); // Start 50 days ago

        for (let i = 0; i < 50; i++) {
            // Random time each day
            const visitDate = new Date(baseDate);
            visitDate.setDate(visitDate.getDate() + i);
            visitDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            // Random subtle weight fluctuation (4.0kg - 5.0kg)
            const weight = 4.0 + Math.random();

            visits.push({
                entryTime: visitDate,
                weightIn: parseFloat(weight.toFixed(2)),
                weightOut: parseFloat(weight.toFixed(2)),
            });
        }

        await Visit.insertMany(visits);
        console.log(`Successfully seeded ${visits.length} visits!`);

        process.exit();
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedVisits();
