import express from "express";
import {
    getAlerts,
    getActiveAlerts,
    checkAlerts,
    markAlertAsRead,
    dismissAlert,
    getAlertStats
} from "../controllers/alertController.js";

const router = express.Router();

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts
 * @access  Public
 */
router.get("/", getAlerts);

/**
 * @route   GET /api/alerts/active
 * @desc    Get active (unread) alerts
 * @access  Public
 */
router.get("/active", getActiveAlerts);

/**
 * @route   GET /api/alerts/stats
 * @desc    Get alert statistics
 * @access  Public
 */
router.get("/stats", getAlertStats);

/**
 * @route   POST /api/alerts/check
 * @desc    Check and generate new alerts
 * @access  Public
 */
router.post("/check", checkAlerts);

/**
 * @route   PUT /api/alerts/:id/read
 * @desc    Mark alert as read
 * @access  Public
 */
router.put("/:id/read", markAlertAsRead);

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Dismiss an alert
 * @access  Public
 */
router.delete("/:id", dismissAlert);

export default router;
