import Alert from "../models/Alert.js";
import { checkAndGenerateAlerts } from "../services/alertService.js";

/**
 * @desc    Get all alerts for a cat
 * @route   GET /api/alerts
 * @access  Public
 */
export const getAlerts = async (req, res) => {
    try {
        const { catId } = req.query;

        const query = catId ? { catId } : {};
        const alerts = await Alert.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch alerts", error: error.message });
    }
};

/**
 * @desc    Get active (unread and not dismissed) alerts
 * @route   GET /api/alerts/active
 * @access  Public
 */
export const getActiveAlerts = async (req, res) => {
    try {
        const { catId } = req.query;

        const query = {
            isRead: false,
            isDismissed: false,
            ...(catId && { catId })
        };

        const alerts = await Alert.find(query).sort({ severity: -1, createdAt: -1 });

        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch active alerts", error: error.message });
    }
};

/**
 * @desc    Check and generate new alerts
 * @route   POST /api/alerts/check
 * @access  Public
 */
export const checkAlerts = async (req, res) => {
    try {
        const { catId } = req.body;

        const result = await checkAndGenerateAlerts(catId || null);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to check alerts", error: error.message });
    }
};

/**
 * @desc    Mark alert as read
 * @route   PUT /api/alerts/:id/read
 * @access  Public
 */
export const markAlertAsRead = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        res.status(200).json(alert);
    } catch (error) {
        res.status(500).json({ message: "Failed to mark alert as read", error: error.message });
    }
};

/**
 * @desc    Dismiss/delete an alert
 * @route   DELETE /api/alerts/:id
 * @access  Public
 */
export const dismissAlert = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { isDismissed: true },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        res.status(200).json({ message: "Alert dismissed", alert });
    } catch (error) {
        res.status(500).json({ message: "Failed to dismiss alert", error: error.message });
    }
};

/**
 * @desc    Get alert statistics
 * @route   GET /api/alerts/stats
 * @access  Public
 */
export const getAlertStats = async (req, res) => {
    try {
        const { catId } = req.query;
        const query = catId ? { catId } : {};

        const total = await Alert.countDocuments(query);
        const active = await Alert.countDocuments({ ...query, isRead: false, isDismissed: false });
        const critical = await Alert.countDocuments({ ...query, severity: 'critical', isDismissed: false });
        const warning = await Alert.countDocuments({ ...query, severity: 'warning', isDismissed: false });

        res.status(200).json({
            total,
            active,
            bySeverity: {
                critical,
                warning,
                info: active - critical - warning
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch alert stats", error: error.message });
    }
};
