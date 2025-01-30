const jwt = require("jsonwebtoken");
const { SignUp } = require("../models"); // Adjust the path based on your project structure

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.authToken; // Get the token from cookies

    if (!token) {
      return res.status(403).json({ error: "Access denied. No token provided." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database
    const email = decoded.email;
    const user = await SignUp.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Attach user data to the request object
    req.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      zone: user.zone,
      email: user.email,

    };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = authenticateToken;
