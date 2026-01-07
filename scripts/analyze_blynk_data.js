
import axios from "axios";
import "dotenv/config";

const analyzeData = async () => {
    const token = process.env.BLYNK_AUTH_TOKEN;
    if (!token) {
        console.error("❌ BLYNK_AUTH_TOKEN missing.");
        return;
    }

    console.log("🔍 Fetching Raw Data from Blynk...");
    try {
        // Fetch raw values
        const [v0, v1, v2] = await Promise.all([
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v0`),
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v1`),
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v2`)
        ]);

        const rawV0 = v0.data;
        const rawV1 = v1.data;
        const rawV2 = v2.data;

        console.log("\n--- DATA ANALYSIS ---");

        // 1. ANALYSIS OF V0 (WEIGHT)
        console.log(`\n1️⃣  V0 (Weight)`);
        console.log(`    Raw Value: '${rawV0}'`);
        console.log(`    Type: ${typeof rawV0}`);

        const parsedWeight = parseFloat(rawV0);
        console.log(`    Parsed via parseFloat(): ${parsedWeight}`);

        if (isNaN(parsedWeight)) {
            console.log("    ⚠️  WARNING: Weight parses to NaN! Database save will fail/error.");
        } else {
            console.log("    ✅  Weight can be saved as Number.");
        }

        // 2. ANALYSIS OF V1 (STATUS)
        console.log(`\n2️⃣  V1 (Status)`);
        console.log(`    Raw Value: '${rawV1}'`);

        const lowerStatus = String(rawV1).toLowerCase();
        const isInside = lowerStatus.includes("inside") || lowerStatus.includes("entered");
        const isExit = lowerStatus.includes("exit");

        console.log(`    Logic Check:`);
        console.log(`    - Detected as 'Inside'? ${isInside ? "YES" : "NO"}`);
        console.log(`    - Detected as 'Exit'?   ${isExit ? "YES" : "NO"}`);

        if (!isInside && !isExit) {
            console.log("    ⚠️  WARNING: Status matches neither 'Inside' nor 'Exit'. Logic may ignore this.");
        } else {
            console.log("    ✅  Status logic seems compatible.");
        }

    } catch (error) {
        console.error("❌ Failed to fetch data:", error.message);
    }
};

analyzeData();
