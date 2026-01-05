import Cat from "../models/Cat.js";
import Visit from "../models/Visit.js";

/**
 * @desc    Get all cats
 * @route   GET /api/cats
 * @access  Public
 */
export const getCats = async (req, res) => {
  try {
    const cats = await Cat.find().sort({ createdAt: -1 });

    // Calculate dynamic weight for each cat based on last 5 GLOBAL visits
    const catsWithAvgWeight = await Promise.all(cats.map(async (cat) => {
      // For single-cat mode, we pull the last 5 visits from the entire collection
      const lastVisits = await Visit.find()
        .sort({ entryTime: -1 })
        .limit(5);

      if (lastVisits.length > 0) {
        const totalWeight = lastVisits.reduce((sum, v) => sum + v.weightIn, 0);
        const avgWeight = totalWeight / lastVisits.length;
        // Return cat object with computed weight (converts mongoose doc to object)
        return { ...cat.toObject(), currentWeight: parseFloat(avgWeight.toFixed(2)) };
      }

      return cat;
    }));

    res.status(200).json(catsWithAvgWeight);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cats", error: error.message });
  }
};

/**
 * @desc    Get single cat by ID
 * @route   GET /api/cats/:id
 * @access  Public
 */
export const getCatById = async (req, res) => {
  try {
    const cat = await Cat.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Cat not found" });
    }
    res.status(200).json(cat);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cat", error: error.message });
  }
};

/**
 * @desc    Create new cat
 * @route   POST /api/cats
 * @access  Public
 */
export const createCat = async (req, res) => {
  try {
    const { name, breed, age, gender, color, currentWeight, owner } = req.body;



    // Simplified: No user ID from request, just use body or default
    const cat = await Cat.create({
      name,
      breed,
      age,
      gender,
      color,
      currentWeight,
      owner: req.body.owner || "Me",
    });
    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ message: "Failed to create cat", error: error.message });
  }
};

/**
 * @desc    Update a cat's information
 * @route   PUT /api/cats/:id
 * @access  Public
 */
export const updateCat = async (req, res) => {
  try {
    const cat = await Cat.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Cat not found" });
    }

    // Prevent manual weight override
    const { currentWeight, ...updateData } = req.body;

    const updatedCat = await Cat.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedCat);
  } catch (error) {
    res.status(500).json({ message: "Failed to update cat", error: error.message });
  }
};

/**
 * @desc    Delete a cat
 * @route   DELETE /api/cats/:id
 * @access  Public
 */
export const deleteCat = async (req, res) => {
  try {
    const cat = await Cat.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Cat not found" });
    }

    await cat.deleteOne();
    res.status(200).json({ message: "Cat removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete cat", error: error.message });
  }
};

/**
 * @desc    Update the main (singleton) cat's weight
 * @route   POST /api/cats/weight
 * @access  Public
 */
export const updateMainCatWeight = async (req, res) => {
  try {
    const { weight } = req.body;

    if (weight === undefined || weight === null) {
      return res.status(400).json({ message: "Weight is required" });
    }

    // Find the first cat, or create one if none exists
    let cat = await Cat.findOne();

    if (!cat) {
      cat = new Cat({
        name: "My Cat",
        currentWeight: weight,
        lastVisit: {
          entryTime: new Date(),
          weightIn: weight,
          weightOut: weight,
        },
      });
    } else {
      cat.currentWeight = weight;
      cat.lastVisit = {
        entryTime: new Date(),
        weightIn: weight,
        weightOut: weight, // Simple assumption for now
      };
    }

    await cat.save();

    // Create a Visit log
    await Visit.create({
      catId: cat._id,
      entryTime: new Date(),
      weightIn: weight,
      weightOut: weight, // Assuming no waste change for now
    });

    res.status(200).json(cat);
  } catch (error) {
    res.status(500).json({ message: "Failed to update weight", error: error.message });
  }
};

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

        // Waste Logic:
        // 10% chance: Just checking (0 waste)
        // 60% chance: Pee (30-60g)
        // 30% chance: Poop (60-120g)

        let wasteWeight = 0;
        const rand = Math.random();

        if (rand < 0.1) {
          wasteWeight = 0;
        } else if (rand < 0.7) {
          wasteWeight = 30 + (Math.random() * 30);
        } else {
          wasteWeight = 60 + (Math.random() * 60);
        }

        visits.push({
          entryTime: visitTime,
          weightIn: parseFloat(weightIn.toFixed(2)),
          weightOut: parseFloat(weightIn.toFixed(2)),
          wasteWeight: Math.round(wasteWeight)
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
        weightIn: sample.weightIn,
        wasteWeight: sample.wasteWeight
      },
      totalVisits: visits.length
    });
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    res.status(500).json({ message: "Failed to seed visits", error: error.message });
  }
};
