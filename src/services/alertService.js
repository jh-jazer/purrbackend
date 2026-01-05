import Visit from "../models/Visit.js";
import Alert from "../models/Alert.js";
import Cat from "../models/Cat.js";

/**
 * Alert Service
 * Handles calculation and generation of health monitoring alerts
 */

// Monitoring mode thresholds
const THRESHOLDS = {
    strict: {
        weight: { urgent: 0.02, trend: 0.04, gain: 0.04 },
        frequency: { critical: 2, highPercent: 0.3, lowHours: 24 }
    },
    standard: {
        weight: { urgent: 0.03, trend: 0.05, gain: 0.05 },
        frequency: { critical: 3, highPercent: 0.5, lowHours: 24 }
    },
    kitten: {
        weight: { urgent: 0.04, trend: 0.07, gain: 0.07 },
        frequency: { critical: 5, highPercent: 1.0, lowHours: 36 }
    }
};

/**
 * Get baseline weight for a cat
 */
export const getBaselineWeight = async (catId, days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const visits = await Visit.find({
        catId: catId || { $exists: true }, // Handle single-cat mode
        entryTime: { $gte: cutoffDate }
    }).sort({ entryTime: 1 });

    if (visits.length === 0) return null;

    const totalWeight = visits.reduce((sum, v) => sum + v.weightIn, 0);
    return totalWeight / visits.length;
};

/**
 * Get average daily visit frequency
 */
export const getAverageFrequency = async (catId, days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const visits = await Visit.find({
        catId: catId || { $exists: true },
        entryTime: { $gte: cutoffDate }
    });

    return visits.length / days;
};

/**
 * Calculate weight-based alerts
 */
export const calculateWeightAlerts = async (catId, catName = "Your cat") => {
    const alerts = [];

    // Get cat's monitoring mode
    const cat = await Cat.findById(catId) || await Cat.findOne();
    if (!cat) return alerts;

    const mode = cat.monitoringMode || 'standard';
    const thresholds = THRESHOLDS[mode].weight;

    // Check if baseline is established (need 7 days of data)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oldestVisit = await Visit.findOne().sort({ entryTime: 1 });

    if (!oldestVisit || new Date(oldestVisit.entryTime) > sevenDaysAgo) {
        // Not enough data yet
        return alerts;
    }

    // Get baseline weight (average of days 8-14)
    const baselineStart = new Date();
    baselineStart.setDate(baselineStart.getDate() - 14);
    const baselineEnd = new Date();
    baselineEnd.setDate(baselineEnd.getDate() - 7);

    const baselineVisits = await Visit.find({
        entryTime: { $gte: baselineStart, $lte: baselineEnd }
    });

    if (baselineVisits.length === 0) return alerts;

    const baselineWeight = baselineVisits.reduce((sum, v) => sum + v.weightIn, 0) / baselineVisits.length;

    // 1. Check for URGENT LOSS (>threshold% in 48 hours)
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const recentVisits = await Visit.find({
        entryTime: { $gte: fortyEightHoursAgo }
    }).sort({ entryTime: 1 });

    if (recentVisits.length >= 2) {
        const earliest = recentVisits[0].weightIn;
        const latest = recentVisits[recentVisits.length - 1].weightIn;
        const change = (latest - earliest) / baselineWeight;

        if (change < -thresholds.urgent) {
            alerts.push({
                type: 'weight_urgent',
                severity: 'critical',
                message: `Sudden weight drop detected. ${catName} has lost ${Math.abs(change * 100).toFixed(1)}% in 48 hours. Significant changes can indicate dehydration. Please monitor closely.`,
                triggerData: {
                    baselineWeight: baselineWeight.toFixed(2),
                    currentWeight: latest.toFixed(2),
                    changePercent: (change * 100).toFixed(1),
                    timeframe: '48 hours'
                }
            });
        }
    }

    // 2. Check for TREND WARNING (threshold% over 14-30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last7Days = await Visit.find({
        entryTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (last7Days.length > 0) {
        const recentAvg = last7Days.reduce((sum, v) => sum + v.weightIn, 0) / last7Days.length;
        const trendChange = (recentAvg - baselineWeight) / baselineWeight;

        if (trendChange < -thresholds.trend) {
            alerts.push({
                type: 'weight_trend',
                severity: 'warning',
                message: `${catName} has lost ${Math.abs(trendChange * 100).toFixed(1)}% of their body weight over the last month. This gradual trend often warrants a vet consultation.`,
                triggerData: {
                    baselineWeight: baselineWeight.toFixed(2),
                    currentAverage: recentAvg.toFixed(2),
                    changePercent: (trendChange * 100).toFixed(1),
                    timeframe: '30 days'
                }
            });
        }

        // 3. Check for WEIGHT GAIN
        if (trendChange > thresholds.gain) {
            alerts.push({
                type: 'weight_gain',
                severity: 'info',
                message: `${catName} is trending upward in weight (+${(trendChange * 100).toFixed(1)}%). Consider reviewing their daily calorie intake to maintain ideal joint health.`,
                triggerData: {
                    baselineWeight: baselineWeight.toFixed(2),
                    currentAverage: recentAvg.toFixed(2),
                    changePercent: (trendChange * 100).toFixed(1),
                    timeframe: '30 days'
                }
            });
        }
    }

    return alerts;
};

/**
 * Calculate frequency-based alerts
 */
export const calculateFrequencyAlerts = async (catId, catName = "Your cat") => {
    const alerts = [];

    // Get cat's monitoring mode
    const cat = await Cat.findById(catId) || await Cat.findOne();
    if (!cat) return alerts;

    const mode = cat.monitoringMode || 'standard';
    const thresholds = THRESHOLDS[mode].frequency;

    // 1. Check for CRITICAL HIGH (threshold+ visits in 1 hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const lastHourVisits = await Visit.find({
        entryTime: { $gte: oneHourAgo }
    });

    if (lastHourVisits.length >= thresholds.critical) {
        alerts.push({
            type: 'frequency_critical',
            severity: 'critical',
            message: `Emergency Alert: ${catName} is visiting the box repeatedly in a very short time (${lastHourVisits.length} visits in 1 hour). This may indicate a life-threatening blockage.`,
            triggerData: {
                visitCount: lastHourVisits.length,
                timeframe: '1 hour',
                threshold: thresholds.critical
            }
        });
    }

    // 2. Check for INCREASED ACTIVITY (threshold% above 7-day average)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7DaysVisits = await Visit.find({
        entryTime: { $gte: sevenDaysAgo }
    });

    if (last7DaysVisits.length > 0) {
        const avgDaily = last7DaysVisits.length / 7;

        // Get today's count
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayVisits = await Visit.find({
            entryTime: { $gte: todayStart }
        });

        if (todayVisits.length > avgDaily * (1 + thresholds.highPercent)) {
            alerts.push({
                type: 'frequency_high',
                severity: 'warning',
                message: `${catName} is visiting the box more often than usual today (${todayVisits.length} visits vs. ${avgDaily.toFixed(1)} average). Monitor for signs of discomfort or increased thirst.`,
                triggerData: {
                    todayCount: todayVisits.length,
                    averageCount: avgDaily.toFixed(1),
                    increasePercent: (((todayVisits.length - avgDaily) / avgDaily) * 100).toFixed(0)
                }
            });
        }
    }

    // 3. Check for LOW ACTIVITY (0 visits in threshold hours)
    const lowActivityCutoff = new Date();
    lowActivityCutoff.setHours(lowActivityCutoff.getHours() - thresholds.lowHours);

    const recentVisits = await Visit.find({
        entryTime: { $gte: lowActivityCutoff }
    });

    if (recentVisits.length === 0) {
        alerts.push({
            type: 'frequency_low',
            severity: 'warning',
            message: `No activity detected in the litter box for ${thresholds.lowHours} hours. Please check if ${catName} is hydrated or using a different area.`,
            triggerData: {
                hoursSinceLastVisit: thresholds.lowHours,
                lastVisitTime: null
            }
        });
    }

    return alerts;
};

/**
 * Generate and save all alerts for a cat
 */
export const checkAndGenerateAlerts = async (catId = null) => {
    const cat = catId ? await Cat.findById(catId) : await Cat.findOne();
    if (!cat) return { alerts: [], message: "No cat found" };

    const catName = cat.name || "Your cat";

    // Calculate all alerts
    const weightAlerts = await calculateWeightAlerts(catId, catName);
    const frequencyAlerts = await calculateFrequencyAlerts(catId, catName);

    const allAlerts = [...weightAlerts, ...frequencyAlerts];

    // Save new alerts to database (avoid duplicates)
    const savedAlerts = [];
    for (const alertData of allAlerts) {
        // Check if similar alert exists in last 24 hours
        const existingAlert = await Alert.findOne({
            catId: catId,
            type: alertData.type,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!existingAlert) {
            const alert = await Alert.create({
                catId: catId,
                ...alertData
            });
            savedAlerts.push(alert);
        }
    }

    return {
        alerts: savedAlerts,
        message: `Generated ${savedAlerts.length} new alerts`
    };
};
