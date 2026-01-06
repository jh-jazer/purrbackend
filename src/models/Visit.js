import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
    {
        entryTime: {
            type: Date,
            default: Date.now,
        },
        // Optional: if you measure weight out or waste later
        weightIn: {
            type: Number,
            required: true,
        },
        durationSeconds: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;
