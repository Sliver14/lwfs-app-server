const express = require('express');
const router = express.Router();
const { PostPage, Sequelize } = require('../models');

//post route
router.post("/", async (req, res) => {
    
    try{
        const { postPhoto, postTitle, postBody } = req.body;

        const newPost = await PostPage.create({postPhoto, postTitle, postBody});
        
        res.status(200).json({message: "Posted Successfully"});
    } catch(error){
        res.status(500).json({error: "Failed"})
    }
})

//get route
router.get("/postpage", async(req, res) => {
    try{
        const listOfPosts = await PostPage.findAll();
        res.json(listOfPosts);
    } catch(error){
        res.status(500).json({error: "server error"});
    }
})

module.exports = router;