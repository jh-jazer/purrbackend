import express from "express";
import axios from "axios";
import LitterData from "../models/LitterData.js";
import Visit from "../models/Visit.js";
import LitterBoxState from "../models/LitterBoxState.js";

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
        const [v0, v1, v2] = await Promise.all([
            fetchBlynkPin(token, "v0"),
            fetchBlynkPin(token, "v1"),
            fetchBlynkPin(token, "v2")
        ]);

        const currentWeight = parseFloat(v0) || 0;
        const statusText = v1 || "";

        const syncResult = {
            fetched: { currentWeight, statusText, v2 },
            actions: []
        };

        // Fetch System State (Hardware Memory)
        let boxState = await LitterBoxState.findOne();
        if (!boxState) {
            boxState = await LitterBoxState.create({
                lastSensorStatus: "",
                currentWeight: 0
            });
        }

        // 2. Logic: Update Live Monitor
        // If weight > 1kg, we assume the cat is currently on the scale.
        if (currentWeight > 1.0) {
            boxState.currentWeight = currentWeight;
            await boxState.save();
            syncResult.actions.push("Updated Live Weight");
        }

        // 3. Logic: Record Visit (Log)
        // We detect a visit when status transitions from "Cat Inside" to "Cat Exit" (or empty/other)
        // OR when duration changes significantly, but state transition is more reliable for "visit just finished".

        let visitCreated = false;

        // Check for specific transition: Was Inside -> Now NOT Inside (or specifically "Exit")
        // Normalized check:
        const lastStatus = (boxState.lastSensorStatus || "").toLowerCase();
        const wasInside = lastStatus.includes("inside") || lastStatus.includes("entered");

        const isNowExit = (statusText || "").toLowerCase().includes("exit");
        const isNowEmpty = !(statusText || "").toLowerCase().includes("inside") && !(statusText || "").toLowerCase().includes("entered");

        // DEBUG: Temporary log to see why logic fails
        if (wasInside || isNowExit) {
            syncResult.actions.push(`DEBUG: last='${lastStatus}', curr='${statusText}', wasInside=${wasInside}, isExit=${isNowExit}`);
        }

        // Trigger if: Was Inside AND (Is Exit OR Is Empty)
        // Adjust logic based on exact Blynk string values user expects. Assuming "Cat Inside" and "Cat Exit"
        if (wasInside && (isNowExit || isNowEmpty)) {

            // Double check duplicate via duration/time to be safe
            const lastVisit = await Visit.findOne().sort({ entryTime: -1 });
            const isDuplicate = lastVisit &&
                (Date.now() - new Date(lastVisit.createdAt).getTime() < 30000); // 30 sec buffer for immediate re-syncs

            if (!isDuplicate) {
                // Calculate weight
                // If cat just left, currentWeight might be 0. Use stored weight.
                let visitWeight = currentWeight > 1 ? currentWeight : boxState.currentWeight;
                // Removed hardcoded fallback (4.5) to rely strictly on Blynk/Sensor data as requested.

                const entryTime = new Date(); // Record time at moment of exit detection

                await Visit.create({
                    weightIn: visitWeight,
                    entryTime: entryTime
                });

                visitCreated = true;
                syncResult.actions.push("Successfully saved visit to database");
            }
        }

        // Update box state for next poll
        if (statusText !== boxState.lastSensorStatus) {
            boxState.lastSensorStatus = statusText;
            await boxState.save();

            syncResult.actions.push(`Updated Status: ${statusText}`);
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
