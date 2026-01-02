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

        // 2. Generate Visits for last 30 days
        const visits = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            // Randomly determine number of visits per day (2 to 5 visits)
            const dailyVisits = Math.floor(Math.random() * 4) + 2;

            for (let v = 0; v < dailyVisits; v++) {
                const visitTime = new Date(d);
                // Random hour between 6 AM and 11 PM
                visitTime.setHours(6 + Math.floor(Math.random() * 18), Math.floor(Math.random() * 60));

                // Fluctuate weight slightly around 4.5kg (4.3 to 4.7)
                let weightIn = 4.3 + (Math.random() * 0.4);

                // 30% chance of waste deposit (weightOut < weightIn)
                let weightOut = weightIn;
                let wasteWeight = 0;

                if (Math.random() < 0.3) {
                    // Waste between 20g and 100g (0.02 - 0.1 kg)
                    wasteWeight = 0.02 + (Math.random() * 0.08);
                    // WeightOut should be effectively same as WeightIn for the CAT, but waste is separate record usually?
                    // Actually usually Visit record implies difference is waste. 
                    // If model has wasteWeight field, use it. Code showed only weightIn/weightOut.
                    // Let's assume weightOut is LESS if cat leaves simple, but actually weightIn/Out usually refers to scale reading.
                    // Scale reading: In = Cat. Out = Cat. Difference is 0 ideally.
                    // Wait, if cat leaves waste, scale reads Cat + Waste before cat leaves? 
                    // Let's simplify: Stats usually track Cat Weight.
                    // Let's add explicit wasteWeight if the model supports it (logs.jsx used it).
                }

                visits.push({
                    entryTime: visitTime,
                    weightIn: parseFloat(weightIn.toFixed(2)),
                    weightOut: parseFloat(weightOut.toFixed(2)),
                    wasteWeight: parseFloat((wasteWeight * 1000).toFixed(0)) // Store in Grams? logs.jsx line 117 expects it.
                });
            }
        }

        // Add some very recent visits for "Today"
        const today = new Date();
        visits.push({
            entryTime: new Date(today.setHours(today.getHours() - 1)), // 1 hour ago
            weightIn: 4.5,
            weightOut: 4.5,
            wasteWeight: 50
        });

        await Visit.insertMany(visits);
        console.log(`Successfully seeded ${visits.length} varied visits!`);

        process.exit();
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedVisits();
