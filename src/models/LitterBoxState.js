import mongoose from "mongoose";

const litterBoxStateSchema = new mongoose.Schema(
    {
        lastSensorStatus: {
            type: String,
            default: "",
        },
        currentWeight: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Singleton-like behavior is enforced by logic, not schema, but typically only one exists.
const LitterBoxState = mongoose.model("LitterBoxState", litterBoxStateSchema);

export default LitterBoxState;
