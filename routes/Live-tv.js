const express = require('express');
const router = express.Router();
const { Comment, SignUp, Attendance, Sequelize, sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const authenticateToken = require('../middleware/authenticateToken ');
const { where, Op } = require('sequelize');


module.exports = (io) => {
//live-tv comment 
router.post('/comment', authenticateToken, async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id; // Assume user is authenticated and userId is in the token
  
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }
  
    try {
      const newComment = await Comment.create({ userId, content });
      // Emit the new comment event
      io.emit("commentUpdated", newComment);

      res.status(201).json(newComment);

    } catch (error) {
      res.status(500).json({ error: 'Could not post comment' });
    }
});

// Fetch Live-tv comment
router.get('/comment', async (req, res) => {
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

//Live Attendance
router.post("/attendance", authenticateToken, async(req, res) =>{
  const { id: userId, firstName, lastName, zone, email, country } = req.user; // Extracted from token
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
      country,
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

//Update Group Participation
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
})

//ADMIN DASHBOARD
router.get("/dashboardStats", async (req, res) => {
  try {
    const [individualParticipation, groupParticipation, numberOfCenters, numberOfCountries] = await Promise.all([
      Attendance.count(),
      Attendance.sum("groupParticipation"),
      Attendance.count({
        where: {
          groupParticipation: {
            [Op.gt]: 0
          }
        }
      }),

      Attendance.count({
        distinct: true,
        col: "country"
      })
    ]);

    res.status(200).json({
      individualParticipation,
      groupParticipation,
      numberOfCenters,
      numberOfCountries
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Zones Data for Admin Dashboard
router.get("/zonesParticipation", async(req, res) => {
  try {
    const ZonesParticipation = await Attendance.findAll({
      attributes : [
        'zone', 
        [sequelize.fn('COUNT', Sequelize.col('id')), 'individualParticipation'],
        [sequelize.fn('SUM', Sequelize.col('groupParticipation')), 'groupParticipation']
      ],
      group: ['zone'],
      raw: true
      // where: {groupParticipation: 'lagos virtual zone'}
    });
    res.status(200).json(ZonesParticipation);
  } catch(error){
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

//ZONAL PRINCIPAL DASHBOARD
router.get("/userZoneParticipation", authenticateToken, async (req, res) => {
  try {
    // Ensure req.user contains a zone
    const userZone = req.user.zone;

    if (!userZone) {
      return res.status(400).json({ error: "User zone not found" });
    }

    // Fetch individual and group participation based on the user's zone
    const individualParticipation = await Attendance.count({
      where: { zone: userZone }
    });

    const groupParticipation = await Attendance.sum("groupParticipation", {
      where: { zone: userZone }
    });

    res.status(200).json({
      individualParticipation,
      groupParticipation
    });
  } catch (error) {
    console.error("Error fetching user zone participation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




return router;
};