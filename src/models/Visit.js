import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
    {
        catId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cat",
            required: false,
        },
        entryTime: {
            type: Date,
            default: Date.now,
        },
        weightIn: {
            type: Number,
            required: true,
        },
        // Optional: if you measure weight out or waste later
        weightOut: {
            type: Number,
        },
        wasteWeight: {
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
