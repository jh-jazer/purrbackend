import mongoose from "mongoose";

const LitterSchema = new mongoose.Schema({
    token: String,
    weight: Number,
    catStatus: String,
    healthStatus: String,
    duration: Number,
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("LitterData", LitterSchema);
