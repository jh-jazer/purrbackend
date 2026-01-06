import mongoose from "mongoose";
import "dotenv/config";
import Visit from "./models/Visit.js";

const seedVisits = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            console.error("❌ Error: MONGODB_URL is not defined in .env file");
            process.exit(1);
        }

        console.log("🔄 Connecting to MongoDB...");
        console.log("📍 Using URL:", process.env.MONGODB_URL.substring(0, 30) + "...");

        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ MongoDB Connected");

        // 1. Clear existing visits
        console.log("🗑️  Clearing old visits...");
        const deleteResult = await Visit.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} old visits`);

        // 2. Generate NORMAL Visits for days 3-30 (baseline data)
        console.log("🌱 Generating normal baseline data...");
        const visits = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        // Normal baseline weight: 4.5kg
        const baselineWeight = 4.5;

        for (let d = new Date(startDate); d <= new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000); d.setDate(d.getDate() + 1)) {
            // Normal: 3-5 visits per day
            const dailyVisits = Math.floor(Math.random() * 3) + 3;

            for (let v = 0; v < dailyVisits; v++) {
                const visitTime = new Date(d);
                const hour = 5 + Math.floor(Math.random() * 19);
                const minute = Math.floor(Math.random() * 60);
                visitTime.setHours(hour, minute);

                // Normal weight fluctuation: ±0.1kg around baseline
                let weightIn = baselineWeight + (Math.random() * 0.2 - 0.1);



                visits.push({
                    entryTime: visitTime,
                    weightIn: parseFloat(weightIn.toFixed(2))
                });
            }
        }

        console.log(`📊 Generated ${visits.length} normal baseline visits`);

        // 3. Add ALERT-TRIGGERING visits for the last 2 days
        console.log("⚠️  Adding alert-triggering scenarios...");

        const now = new Date();

        // SCENARIO 1: Urgent Weight Loss (>3% in 48 hours)
        // 48 hours ago: normal weight
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        visits.push({
            entryTime: fortyEightHoursAgo,
            weightIn: 4.5, // Normal baseline
        });

        // Recent visits with sudden weight drop (4.5kg -> 4.35kg = 3.3% loss)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        visits.push({
            entryTime: yesterday,
            weightIn: 4.35, // Sudden drop
        });

        // SCENARIO 2: Critical High Frequency (3+ visits in 1 hour)
        // Add 4 visits in the last hour
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        for (let i = 0; i < 4; i++) {
            const visitTime = new Date(oneHourAgo.getTime() + (i * 12 * 60 * 1000)); // Every 12 minutes
            visits.push({
                entryTime: visitTime,
                weightIn: 4.35
            });
        }

        console.log(`⚠️  Added ${4 + 2} alert-triggering visits`);
        console.log(`📊 Total visits: ${visits.length}`);
        console.log("💾 Inserting into database...");

        await Visit.insertMany(visits);
        console.log(`✅ Successfully seeded ${visits.length} visits!`);

        // Verify samples
        const recentSample = await Visit.findOne().sort({ entryTime: -1 });
        const oldSample = await Visit.findOne().sort({ entryTime: 1 });

        console.log("\n📋 Sample Data:");
        console.log("Oldest visit:", {
            entryTime: oldSample.entryTime,
            weightIn: oldSample.weightIn,
            wasteWeight: oldSample.wasteWeight
        });
        console.log("Most recent visit:", {
            entryTime: recentSample.entryTime,
            weightIn: recentSample.weightIn,
            wasteWeight: recentSample.wasteWeight
        });

        await mongoose.connection.close();
        console.log("\n👋 Database connection closed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error.message);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
};

seedVisits();
