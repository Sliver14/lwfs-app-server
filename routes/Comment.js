const express = require('express');
const router = express.Router();
const { Comment, SignUp} = require('../models');
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

module.exports = router;