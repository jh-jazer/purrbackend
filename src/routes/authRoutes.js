import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }   

    if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    //check if user exists

    // const existingUser = await User.findOne({ $or: [{ email }, { username }] }
    // if (existingUser) {
    
    const exisinEmail = await User.findOne({ email });
    if (exisinEmail) {
        return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
    }  

    //get random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

     

    const user = new User({ 
        email, 
        username, 
        password,
        profileImage,
     });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        },
    });
  } catch (error) {
    console.log("Error registering user", error);
    res.status(500).json({ message: "Server error" });
  }

});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        //check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }   

        //generate token
        const token = generateToken(user._id);

        res.status(200).json({
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        },
    });
} catch (error) {
    console.log("Error logging in user", error);
    res.status(500).json({ message: "Server error" });  
}
});

export default router;
