import Visit from "../models/Visit.js";


/**
 * @desc    Get all visits (activity logs)
 * @route   GET /api/cats/visits
 * @access  Public
 */
export const getVisits = async (req, res) => {
  try {
    const visits = await Visit.find().sort({ entryTime: -1 });
    res.status(200).json(visits);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch visits", error: error.message });
  }
};

/**
 * @desc    Seed database with varied visit data
 * @route   POST /api/cats/seed
 * @access  Public
 */
export const seedVisits = async (req, res) => {
  try {
    console.log("🌱 Starting seed process...");

    // 1. Clear existing visits
    const deleteResult = await Visit.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} old visits`);

    // 2. Generate Visits for last 30 days
    const visits = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Randomly determine number of visits per day (3 to 5 visits)
      const dailyVisits = Math.floor(Math.random() * 3) + 3;

      for (let v = 0; v < dailyVisits; v++) {
        const visitTime = new Date(d);
        // Random hour between 5 AM and 11 PM
        const hour = 5 + Math.floor(Math.random() * 19);
        const minute = Math.floor(Math.random() * 60);
        visitTime.setHours(hour, minute);

        // Fluctuate weight slightly around 4.5kg (4.3 to 4.7)
        let weightIn = 4.3 + (Math.random() * 0.4);



        visits.push({
          entryTime: visitTime,
          weightIn: parseFloat(weightIn.toFixed(2))
        });
      }
    }

    console.log(`📊 Generated ${visits.length} visits`);

    await Visit.insertMany(visits);
    console.log(`✅ Successfully seeded ${visits.length} varied visits!`);

    // Verify a sample
    const sample = await Visit.findOne().sort({ entryTime: -1 });

    res.status(200).json({
      message: `Successfully seeded ${visits.length} visits`,
      sample: {
        entryTime: sample.entryTime,
        weightIn: sample.weightIn
      },
      totalVisits: visits.length
    });
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    res.status(500).json({ message: "Failed to seed visits", error: error.message });
  }
};
