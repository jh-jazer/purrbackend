import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
    {
        catId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cat",
            required: false, // Optional for single-cat mode
        },
        type: {
            type: String,
            required: true,
            enum: [
                'weight_urgent',      // >3% loss in 48hrs
                'weight_trend',       // 5% loss over 14-30 days
                'weight_gain',        // >5% gain over 30 days
                'frequency_critical', // 3+ visits in 1 hour
                'frequency_high',     // 50% above 7-day average
                'frequency_low'       // 0 visits in 24 hours
            ]
        },
        severity: {
            type: String,
            required: true,
            enum: ['critical', 'warning', 'info'],
            default: 'warning'
        },
        message: {
            type: String,
            required: true
        },
        triggerData: {
            type: Object,
            default: {}
        },
        isRead: {
            type: Boolean,
            default: false
        },
        isDismissed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
alertSchema.index({ catId: 1, createdAt: -1 });
alertSchema.index({ isRead: 1, isDismissed: 1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
