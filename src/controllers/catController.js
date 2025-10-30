import Cat from "../models/Cat.js";

/**
 * @desc    Get all cats
 * @route   GET /api/cats
 * @access  Public
 */
export const getCats = async (req, res) => {
  try {
    const cats = await Cat.find().sort({ createdAt: -1 });
    res.status(200).json(cats);
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
    const { name, rfidTag, breed, age, gender, color, currentWeight, owner } = req.body;

    // Prevent duplicate RFID tags
    const existingCat = await Cat.findOne({ rfidTag });
    if (existingCat) {
      return res.status(400).json({ message: "RFID tag already exists" });
    }

    const newCat = new Cat({
      name,
      rfidTag,
      breed,
      age,
      gender,
      color,
      currentWeight,
      owner,
    });

    const savedCat = await newCat.save();
    res.status(201).json(savedCat);
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

    const updatedCat = await Cat.findByIdAndUpdate(req.params.id, req.body, {
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
