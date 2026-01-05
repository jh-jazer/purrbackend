import express from "express";
import axios from "axios";
import LitterData from "../models/LitterData.js";
import Visit from "../models/Visit.js";
import Cat from "../models/Cat.js";

const router = express.Router();

// Helper: Fetch from connection
const fetchBlynkPin = async (token, pin) => {
    try {
        const response = await axios.get(`https://blynk.cloud/external/api/get?token=${token}&${pin}`);
        return response.data;
    } catch (error) {
        // Blynk returns 400 if pin is empty or other issues, return null/0 safely
        return 0;
    }
};

// GET /api/litter/sync
// Triggered by Cron or Manual Refresh
router.all("/sync", async (req, res) => {
    const token = process.env.BLYNK_AUTH_TOKEN;

    if (!token) {
        return res.status(500).json({ error: "BLYNK_AUTH_TOKEN not configured in .env" });
    }

    try {
        // 1. Fetch all pins in parallel
        // V0: Weight (Real-time)
        // V1: Status Text ("Cat Inside" / "Cat Exited")
        // V2: Usage Status ("In Use" / "Normal" / "Possible UTI")
        // V3: Last Visit Duration (Seconds)
        const [v0, v1, v2, v3] = await Promise.all([
            fetchBlynkPin(token, "v0"),
            fetchBlynkPin(token, "v1"),
            fetchBlynkPin(token, "v2"),
            fetchBlynkPin(token, "v3")
        ]);

        const currentWeight = parseFloat(v0) || 0;
        const lastDuration = parseInt(v3) || 0;
        const statusText = v1 || "";

        const syncResult = {
            fetched: { currentWeight, lastDuration, statusText, v2 },
            actions: []
        };

        // 2. Logic: Update Live Monitor
        // If weight > 1kg, we assume the cat is currently on the scale.
        if (currentWeight > 1.0) {
            // Find main cat and update weight
            const cat = await Cat.findOne();
            if (cat) {
                cat.currentWeight = currentWeight;
                await cat.save();
                syncResult.actions.push("Updated Cat Live Weight");
            }
        }

        // 3. Logic: Record Visit (Log)
        // If Duration > 0, a visit happened recently.
        // Challenge: Polling runs every minute. V3 stays constant until next visit.
        // We must avoid creating duplicates for the same visit.
        if (lastDuration > 0) {
            // Check most recent visit in DB
            const lastVisit = await Visit.findOne().sort({ entryTime: -1 });

            // Duplicate Prevention Rule:
            // If the last recorded visit has the SAME duration AND was recorded recently (e.g. < 1 hour ago)
            // Then likely we are just polling the same stale data.
            // (Note: Duration being identical is a weak check, but best we have without specific timestamps from Blynk)
            const isDuplicate = lastVisit &&
                lastVisit.durationSeconds === lastDuration && // We need to store duration to check
                (Date.now() - new Date(lastVisit.createdAt).getTime() < 3600000); // 1 hour buffer

            if (!isDuplicate) {
                // Determine Weight for this visit
                // If cat is still on (currentWeight > 1), use it.
                // If cat left (currentWeight ~ 0), try to use Cat's stored weight or fallback.
                let visitWeight = currentWeight > 1 ? currentWeight : 0;

                if (visitWeight === 0) {
                    const cat = await Cat.findOne();
                    visitWeight = cat ? cat.currentWeight : 0;
                }

                // Create Visit
                // "entryTime" estimation: Now - Duration
                const entryTime = new Date(Date.now() - (lastDuration * 1000));

                const newVisit = await Visit.create({
                    weightIn: visitWeight,
                    weightOut: visitWeight,      // Assuming no waste change detectable via simple bridge
                    entryTime: entryTime,
                    wasteWeight: 0,              // Unknown
                    // Store duration in a way we can check? 
                    // The Visit model doesn't have duration field explicitly in user's file (only weightOut/waste).
                    // We might need to depend on timestamp or add a field if schema allows strict mode. 
                    // But MongoDB is flexible. We'll save it as 'durationSeconds' for our duplicate check.
                    durationSeconds: lastDuration
                });

                syncResult.actions.push("Created New Visit Log");
            } else {
                syncResult.actions.push("Duplicate Visit Ignored");
            }
        }

        // (Optional) Log raw data for debug
        // await LitterData.create({ token, weight: currentWeight, catStatus: statusText, healthStatus: v2, duration: lastDuration });

        res.json(syncResult);

    } catch (err) {
        console.error("Sync Error:", err.message);
        res.status(500).json({ error: "Failed to sync with Blynk", details: err.message });
    }
});

// GET /api/litter/history/:token (Legacy support, maybe unused)
router.get("/history/:token", async (req, res) => {
    try {
        const data = await LitterData.find({ token: req.params.token }).sort({ timestamp: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;
