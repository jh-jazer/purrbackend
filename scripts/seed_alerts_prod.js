import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Visit from '../src/models/Visit.js';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("❌ MONGODB_URL is missing in .env file");
    process.exit(1);
}

const seedAlerts = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("✅ Connected to MongoDB");

        console.log("⚠️  Seeding data to trigger ALERTS...");

        // Clear existing to ensure clean state
        await Visit.deleteMany({});
        console.log("Cleared existing visits.");

        const visits = [];
        const now = new Date();

        // 1. Establish Baseline (7-14 days ago) - Healthy Weight (5.0kg)
        console.log("Generating baseline data (5.0kg)...");
        for (let i = 14; i > 2; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(10, 0, 0, 0); // 10 AM

            visits.push({
                entryTime: d,
                weightIn: 5.0 // Healthy baseline
            });
        }

        // 2. Trigger WEIGHT ALERT (Urgent Loss)
        // Drop to 4.0kg in last 48 hours (20% loss!)
        console.log("Generating weight loss data (4.0kg in last 2 days)...");
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(9, 0, 0, 0);
        visits.push({ entryTime: yesterday, weightIn: 4.8 }); // Starting to drop

        const todayMorning = new Date(now);
        todayMorning.setHours(8, 0, 0, 0);
        visits.push({ entryTime: todayMorning, weightIn: 4.0 }); // Big drop

        // 3. Trigger FREQUENCY ALERT (Critical - 4 visits in 1 hour)
        console.log("Generating frequent visits (4 visits in last hour)...");
        for (let m = 50; m > 10; m -= 10) {
            const d = new Date(now);
            d.setMinutes(d.getMinutes() - m);
            visits.push({
                entryTime: d,
                weightIn: 4.0 // Consistent low weight
            });
        }

        await Visit.insertMany(visits);
        console.log(`✅ Successfully inserted ${visits.length} visits.`);
        console.log("🚨 EXPECTED ALERTS:");
        console.log("1. Urgent Weight Loss (5.0kg -> 4.0kg)");
        console.log("2. Critical Frequency (Multiple visits in 1 hour)");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

seedAlerts();
