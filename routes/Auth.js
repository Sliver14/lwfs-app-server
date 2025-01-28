const express = require('express');
const router = express.Router();
const { SignUp, VerificationCode, Sequelize } = require('../models'); // Adjust path as necessary
const {sign, verify} = require("jsonwebtoken");
const jwt = require('jsonwebtoken');
// Secret key for token generation (store securely in environment variables)
const bcrypt = require('bcryptjs');
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");

// const rateLimit = require("express-rate-limit");

// const verifyLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 requests per windowMs
//   message: { error: "Too many requests, please try again later." },
// });



// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, countryCode, phoneNumber, zone, church, email } = req.body;

    // Basic validation
    if (!firstName || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const user = await SignUp.findOne({
      where: {
        [Sequelize.Op.or]: [{ email }, { phoneNumber }]
      }
    });
    
    if (user) {
      return res.status(400).json({ error: 'Already Registered' });
    }

    // Create a new user
    const newUser = await SignUp.create({ firstName, lastName, countryCode, phoneNumber, zone, church, email });

    // Generate a 6 didgits verification code
    const generateVerificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
      
    // Hash the verification code before saving
    const hashedCode = bcrypt.hashSync(generateVerificationCode, 10);
    
    // Delete expired verification codes before generating a new one
    await VerificationCode.destroy({
      where: {
        email,
        // expiresAt: { [Sequelize.Op.lt]: Date.now() }, // Expired codes
      },
    });

    // Save the code to the database
    const verificationCode = await VerificationCode.create({
      email,
      code: hashedCode,
      // code : generateVerificationCode,
      expiresAt: expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes expiry
     }) 

    // Send the code via email
    const transporter = nodemailer.createTransport({
      service: "gmail", // or another email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // consider using environment variables
      },
    });

    // transport the code via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Verification Code",
      // text: `Your verification code is: ${generateVerificationCode}`,
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
        <p class="code">${generateVerificationCode}</p>
        <p>Please use this code within 15 minutes to verify your email address.</p>
        <p>Thanks,<br>Loveworld Foundation School Inc.</p>
      </body>
      </html>
    `,
    });

    // Respond with the created user data
    res.status(201).json({ message: 'Check your email for verification code'});
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

      // Generate a 6 didgits verification code
      const generateVerificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
      
      // Hash the verification code before saving
      const hashedCode = bcrypt.hashSync(generateVerificationCode, 10);
   
      // Delete expired verification codes before generating a new one
      await VerificationCode.destroy({
        where: {
          email
          // expiresAt: { [Sequelize.Op.lt]: Date.now() }, // Expired codes
        },
      });

      // Save the code to the database
      const verificationCode = await VerificationCode.create({
        email,
        code: hashedCode,
        // code : generateVerificationCode,
        expiresAt: expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes expiry
       }) 

      // Send the code via email
      const transporter = nodemailer.createTransport({
        service: "gmail", // or another email provider
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // consider using environment variables
        },
      });

      // transport the code via email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Verification Code",
        // text: `Your verification code is: ${generateVerificationCode}`,
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
          <p class="code">${generateVerificationCode}</p>
          <p>Please use this code within 15 minutes to verify your email address.</p>
          <p>Thanks,<br>Loveworld Foundation School Inc.</p>
        </body>
        </html>
      `,
      });

    //   // Generate token using destructured `sign`
    // const token = sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    
      res.status(200).json({
        message: 'Check your email for verification code',
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// verify code & signup
router.post("/verify-signup", async (req, res) => {
  const { email, code } = req.body;

  try {
    // Find the record based on email and code
    const record = await VerificationCode.findOne({ where: { email } });

    // Check if the record exists and if the code is not expired
    if (!record || new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    // compare provided code
    const isMatch = bcrypt.compareSync(code, record.code);

    if (!isMatch){
      return res.status(400).json({error: 'invalid code'});
    }

     //set data to null
     await VerificationCode.update(
      {code: "", expiresAt:0},
      {where:{email}}
    )
    
    // Send success response
    res.status(200).json({ message: "Signup was Successfull!"});
  } catch (error) {
    console.error("Error during code verification:", error);
    res.status(500).json({ error: "An error occurred during verification" });
  }
});

// verify code & sign in
router.post("/verify-signin", async (req, res) => {
  const { email, code } = req.body;

  try {
    // Find the record based on email and code
    const record = await VerificationCode.findOne({ where: { email } });

    // Check if the record exists and if the code is not expired
    if (!record || new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    // compare provided code
    const isMatch = bcrypt.compareSync(code, record.code);

    if (!isMatch){
      return res.status(400).json({error: 'invalid code'});
    }

    // Generate a JWT token
    const token = jwt.sign({ id: record.id, email: record.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Send the token as a secure HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true, // Prevent access from JavaScript
      secure: process.env.NODE_ENV === "production",   // Use HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //set data to null
    await VerificationCode.update(
      {code: "", expiresAt:0},
      {where:{email}}
    )

    // Send success response
    res.status(200).json({ message: "Signin was Successful!", token });
  } catch (error) {
    console.error("Error during code verification:", error);
    res.status(500).json({ error: "An error occurred during verification" });
  }
});

// verify token route
// router.post("/verify", (req, res) => {
//   // Extract the token from cookies
//   const token = req.cookies.authToken; // Assuming the cookie is named 'authToken'
//   console.log("Extracted Token from Cookie:", token);

//   if (!token) {
//     return res.status(400).json({ error: "Token is required" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded Token:", decoded); // Log the decoded token for debugging
//     res.status(200).json({ message: "Token is valid", user: decoded });
//   } catch (error) {
//     console.error("Token verification failed:", error.message); // Log error without revealing details
//     res.status(401).json({ error: "Invalid or expired token" });
//   }
// });

// Token verification rojte
router.get("/verify", async (req, res) => {
  const token = req.cookies.authToken; // Get token from the cookie

  if (!token) {
    return res.status(400).json({ valid: false, error: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await SignUp.findOne({where:{email}});
    
    if (!user) {
      return res.status(404).json({message: 'user not found'});
    }

    res.status(200).json({valid: true, user:{ id: user.id, firstName: user.firstName, email: user.email } });
  } catch (error) {
    res.status(403).json({ valid: false, error: "Invalid or expired token" });
  }
});


module.exports = router;
