import express from "express";
import {
  getCats,
  getCatById,
  createCat,
  updateCat,
  deleteCat,
} from "../controllers/catController.js";
// import { protect } from "../middleware/authMiddleware.js"; // optional if you add user auth later

const router = express.Router();

/**
 * @route   GET /api/cats
 * @desc    Get all cats
 * @access  Public (or Private if auth added)
 */
router.get("/", getCats);

/**
 * @route   GET /api/cats/:id
 * @desc    Get a single cat by ID
 * @access  Public
 */
router.get("/:id", getCatById);

/**
 * @route   POST /api/cats
 * @desc    Add a new cat
 * @access  Public (or Private if using auth)
 */
router.post("/", createCat);

/**
 * @route   PUT /api/cats/:id
 * @desc    Update a cat's information
 * @access  Public
 */
router.put("/:id", updateCat);

/**
 * @route   DELETE /api/cats/:id
 * @desc    Remove a cat profile
 * @access  Public
 */
router.delete("/:id", deleteCat);

export default router;
