const express = require('express');
const router = express.Router();
const { Comment, SignUp, Attendance, Sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const authenticateToken = require('../middleware/authenticateToken ');

router.post('/', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id; // Assume user is authenticated and userId is in the token
  
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
  
    try {
      const newComment = await Comment.create({ userId, content });
      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ message: 'Could not post comment' });
    }
  });

router.get('/', async (req, res) => {
try {
    const comments = await Comment.findAll({
        include: [
            {
                model: SignUp, // Include the associated model
                as: "user", // Alias must match the one defined in the association
                attributes: ['firstName'], // Specify the fields you want to include
            },
        ],
        order: [['createdAt', 'DESC']], // Sort comments by creation date
    });
    res.status(200).json(comments);
} catch (error) {
    res.status(500).json({ message: 'Could not fetch comments' });
}
});

router.post("/attendance", authenticateToken, async(req, res) =>{
  const { id: userId, firstName, lastName, zone, email } = req.user; // Extracted from token
  const { page } = req.body;
  try {

    const user = await Attendance.findOne({
          where: {
            [Sequelize.Op.or]: [{ userId }]
          }
        });
        
        if (user) {
          return res.status(400).json({ error: 'Already Registered' });
        }

    await Attendance.create({
      userId,
      firstName,
      lastName,
      zone,
      page,
      email,
      timestamp: new Date(),
      ipAddress: req.ip, // Optional
    });

    res.status(200).json({ message: "Attendance recorded successfully" });

  } catch (error) {
    console.error("Error recording attendance:", error);
    res.status(500).json({ message: "Failed to record attendance" });
  }

})

router.post("/update", authenticateToken, async(req, res) => {
  try {
    const { groupParticipation } = req.body;
    const {id: userId} = req.user; // Retrieved from middleware

    // Find the attendance record for the user
    const attendance = await Attendance.findOne({ where: { userId } });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Update the attendance record
    await attendance.update({ groupParticipation: groupParticipation || attendance.groupParticipation });

    res.status(200).json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    console.error("Error updating Attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
} )

module.exports = router;