import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import catRoutes from "./routes/catRoutes.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT 

job.start();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/cats", catRoutes);


app.listen(PORT, () => {
  console.log('Server is running on port ${PORT}');
  connectDB();
});

