// backend/scripts/verify_blynk.js
import axios from "axios";
import "dotenv/config";

const verifyBlynk = async () => {
    const token = process.env.BLYNK_AUTH_TOKEN;
    if (!token) {
        console.error("❌ Error: BLYNK_AUTH_TOKEN is missing in .env");
        return;
    }

    console.log(`🔍 Testing connection with Token: ${token.substring(0, 5)}...`);

    try {
        const [v0, v1, v2, v3] = await Promise.all([
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v0`),
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v1`),
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v2`),
            axios.get(`https://blynk.cloud/external/api/get?token=${token}&v3`)
        ]);

        console.log("\n✅ Connection Successful! Received Data:");
        console.log(`- V0 (Weight): ${v0.data}`);
        console.log(`- V1 (Status): ${v1.data}`);
        console.log(`- V2 (Usage):  ${v2.data}`);
        console.log(`- V3 (Duration): ${v3.data}`);

        console.log("\n✅ The Backend Bridge is ready to use.");

    } catch (error) {
        console.error("\n❌ Connection Failed!");
        console.log(error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
    }
};

verifyBlynk();
