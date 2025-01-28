const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const allowedOrigins = process.env.ALLOWED_ORIGIN || "http://localhost:5173" // 
const cookieParser = require('cookie-parser');
const CommentRouter = require("./routes/Comment");
const PostRouter = require("./routes/Posts");
const AuthRouter = require("./routes/Auth");
const db = require("./models");

app.use(cookieParser());

app.use(express.json());
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );

// Routers
app.use("/auth", AuthRouter);
app.use("/posts", PostRouter);
app.use("/comment", CommentRouter);


const PORT = process.env.PORT || 3001; // Use PORT from environment or default to 3001

db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});