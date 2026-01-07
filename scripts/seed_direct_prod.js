import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Visit from '../src/models/Visit.js';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("❌ MONGODB_URL is missing in .env file");
    process.exit(1);
}

const seed = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("✅ Connected to MongoDB");

        console.log("🌱 Generating visits...");

        // Generate Visits for last 7 days
        const visits = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            // Randomly determine number of visits per day (3 to 6 visits)
            const dailyVisits = Math.floor(Math.random() * 4) + 3;

            for (let v = 0; v < dailyVisits; v++) {
                const visitTime = new Date(d);
                // Random hour between 6 AM and 11 PM
                const hour = 6 + Math.floor(Math.random() * 17);
                const minute = Math.floor(Math.random() * 60);
                visitTime.setHours(hour, minute);

                // Weight around 4.5kg
                let weightIn = 4.3 + (Math.random() * 0.4);

                visits.push({
                    entryTime: visitTime,
                    weightIn: parseFloat(weightIn.toFixed(2))
                });
            }
        }

        await Visit.insertMany(visits);
        console.log(`✅ Successfully inserted ${visits.length} visits into the database.`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

seed();
