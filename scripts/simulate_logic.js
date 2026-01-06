
// Mock Data
const cat = {
    lastSensorStatus: "Cat Entered",
    currentWeight: 4.5
};

const statusText = "Cat Exited";
const currentWeight = 0;

// Logic from litterRoutes.js
console.log("--- LOGIC SIMULATION ---");

const lastStatus = (cat.lastSensorStatus || "").toLowerCase();
console.log(`Last Status: "${lastStatus}"`);

const wasInside = lastStatus.includes("inside") || lastStatus.includes("entered");
console.log(`wasInside: ${wasInside}`);

const isNowExit = (statusText || "").toLowerCase().includes("exit");
console.log(`isNowExit: ${isNowExit}`);

const isNowEmpty = !(statusText || "").toLowerCase().includes("inside") && !(statusText || "").toLowerCase().includes("entered");
console.log(`isNowEmpty: ${isNowEmpty}`);

if (wasInside && (isNowExit || isNowEmpty)) {
    console.log(">> SUCCESS: Condition MET. Visit would be created.");
} else {
    console.log(">> FAIL: Condition NOT met.");
}
