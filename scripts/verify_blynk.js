// backend/scripts/verify_blynk.js
import axios from "axios";
import "dotenv/config";

const checkPin = async (token, pin) => {
    try {
        const response = await axios.get(`https://blynk.cloud/external/api/get?token=${token}&${pin}`);
        console.log(`✅ ${pin}: Found (Value: ${response.data})`);
    } catch (error) {
        console.log(`❌ ${pin}: FAILED`);
        if (error.response) {
            console.log(`   - Status: ${error.response.status}`);
            console.log(`   - Message: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`   - Error: ${error.message}`);
        }
    }
};

const verifyBlynk = async () => {
    const token = process.env.BLYNK_AUTH_TOKEN;
    if (!token) {
        console.error("❌ Error: BLYNK_AUTH_TOKEN is missing in .env");
        return;
    }

    console.log(`🔍 Testing connection with Token: ${token.substring(0, 5)}...`);
    console.log("Checking pins individually...\n");

    await checkPin(token, "v0"); // Weight
    await checkPin(token, "v1"); // Status Text
    await checkPin(token, "v2"); // Usage Status

    console.log("\nIf any pin failed with 'Requested pin doesn't exist', that pin is not set up in your Blynk Dashboard.");
};

verifyBlynk();
