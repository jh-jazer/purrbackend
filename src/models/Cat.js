import mongoose from "mongoose";

const catSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Cat name is required"],
      trim: true,
      default: "My Cat",
    },

    breed: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
      min: 0,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Unknown"],
      default: "Unknown",
    },
    color: {
      type: String,
      default: "N/A",
    },
    // Weight in kilograms (latest known weight)
    currentWeight: {
      type: Number,
      default: 0,
    },
    // Owner name (simplified for personal app)
    owner: {
      type: String,
      default: "Me",
    },
    // Optional: record of last visit
    lastVisit: {
      entryTime: Date,
      exitTime: Date,
      weightIn: Number,
      weightOut: Number,
      wasteWeight: Number,
    },
    // Optional health flags
    healthStatus: {
      type: String,
      enum: ["Normal", "Underweight", "Overweight", "Needs Attention"],
      default: "Normal",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Cat = mongoose.model("Cat", catSchema);

export default Cat;
