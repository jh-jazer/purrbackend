import express from "express";
import {
  getVisits,
  seedVisits,
} from "../controllers/catController.js";
// import { protect } from "../middleware/authMiddleware.js"; // optional if you add user auth later

const router = express.Router();

/**
 * @route   GET /api/cats
 * @desc    Get all cats
 * @access  Public (or Private if auth added)
 */
// Specific routes
router.get("/visits", getVisits);
router.post("/seed", seedVisits);

export default router;
