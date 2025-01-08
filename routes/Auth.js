const express = require('express');
const router = express.Router();
const { SignUp } = require('../models'); // Adjust path as necessary
const {sign, verify} = require("jsonwebtoken");
// Secret key for token generation (store securely in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "my_mostrandom_secrete123";
const cookieParser = require("cookie-parser");




// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, countryCode, phoneNumber, zone, church, email } = req.body;

    // Basic validation
    if (!firstName || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // Create a new user
    const newUser = await SignUp.create({ firstName, lastName, countryCode, phoneNumber, zone, church, email });

    // Respond with the created user data
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    // Handle errors (e.g., duplicate email, validation errors)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'User already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signin route
router.post('/signin', async (req, res) => {
    try {
      const { email } = req.body;
  
      // Basic validation
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }
  
      // Find the user by email
      const user = await SignUp.findOne({ where: { email } });
  
      // If user doesn't exist
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      } 

      // Generate token using destructured `sign`
    const token = sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    // Set the token as an HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Enable secure cookies in production
      sameSite: "strict",
      maxAge: 3600000, // 1 hour in milliseconds
    });
  
      // Respond with the token
      res.status(200).json({
        message: 'Sign-in successful', token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// verify token raoute
router.post("/verify", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const decoded = verify(token, JWT_SECRET);
    res.status(200).json({ message: "Token is valid", user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});
  


module.exports = router;
