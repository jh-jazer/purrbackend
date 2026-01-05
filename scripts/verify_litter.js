
// Verification Script for LitterData API
// Run with: node scripts/verify_litter.js

const API_URL = "http://localhost:5000/api/litter";

async function testConnect() {
    console.log("Testing POST /api/litter/connect...");
    try {
        const response = await fetch(`${API_URL}/connect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: "TEST_TOKEN" })
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log("Response:", data);

        // We expect a 400 because the dummy token won't work with Blynk,
        // BUT getting a 400 from our server proves the route is active and logic is executing.
        // If we get 404, the route is missing.
        if (response.status === 400 && data.error && data.error.includes("Blynk")) {
            console.log("SUCCESS: Route is active and handling Blynk errors correctly.");
        } else if (response.status === 200) {
            console.log("SUCCESS: Simulation/Real connection worked!");
        } else {
            console.log("FAILURE: Unexpected response status/body.");
        }
    } catch (error) {
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.log("FAILURE: Could not connect to server. Is it running on port 5000?");
        } else {
            console.error("Error:", error.message);
        }
    }
}

async function testHistory() {
    console.log("\nTesting GET /api/litter/history/:token...");
    try {
        const response = await fetch(`${API_URL}/history/TEST_TOKEN`);
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log("Response (Array length):", Array.isArray(data) ? data.length : "Not an array");

        if (response.status === 200 && Array.isArray(data)) {
            console.log("SUCCESS: History endpoint returned data.");
        } else {
            console.log("FAILURE: History endpoint failed.");
        }
    } catch (error) {
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            console.log("FAILURE: Could not connect to server.");
        } else {
            console.error("Error:", error.message);
        }
    }
}

async function run() {
    await testConnect();
    await testHistory();
}

run();
