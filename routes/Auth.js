const express = require('express');
const router = express.Router();
const { SignUp, VerificationCode } = require('../models'); // Adjust path as necessary
const {sign, verify} = require("jsonwebtoken");
// Secret key for token generation (store securely in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "my_mostrandom_secrete123";
const EMAIL_PASS = process.env.EMAIL_PASS || 'nixh pfxb wdqp fyxg';
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");


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
      maxAge: 2592000000, // 30days in milliseconds
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
  
// Example with Node.js
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit number
};

const storeVerificationCode = async (userEmail) => {
  const verificationCode = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Code valid for 15 minutes

  // Save the code to the database
  await VerificationCode.create({
    email: userEmail,
    code: verificationCode.toString(),
    expiresAt: expiresAt,
  });

  return verificationCode; // Return the code to send it via email
};

const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or another email provider
    auth: {
      user: "silverchristopher12@gmail.com",
      pass: EMAIL_PASS, // consider using environment variables
    },
  });

  const mailOptions = {
    from: "silverchristopher12@gmail.com",
    to: email,
    subject: "Your Verification Code",
    // text: `Your verification code is: ${code}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        .code {
          font-size: 20px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <p class="code">${code}</p>
      <p>Please use this code within 15 minutes to verify your email address.</p>
      <p>Thanks,<br>The SummitFlyer Team</p>
    </body>
    </html>
  `,
  };

  await transporter.sendMail(mailOptions);

};

 // /send-code endpoint
 router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const code = await storeVerificationCode(email);
    await sendVerificationEmail(email, code);
    res.status(200).json({ message: "Verification code sent" });
  } catch (err) {
    console.error("Error sending code:", err);
    res.status(500).json({ message: "Failed to send verification code" });
  }
});
// Using Sequelize
// await VerificationCode.create({
//   email: userEmail,
//   code: verificationCode,
//   expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
// });



// verify-code
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  const record = await VerificationCode.findOne({ where: { email, code } });
  if (record && record.expiresAt > new Date()) {
    return res.status(200).json({ message: "Code verified!" });
  }

  res.status(400).json({ message: "Invalid or expired code" });
});

module.exports = router;
