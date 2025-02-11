const express = require("express");
const cors = require("cors");
require("dotenv").config();
const allowedOrigins = "http://localhost:5173" //  process.env.ALLOWED_ORIGIN || 
const cookieParser = require('cookie-parser');
const db = require("./models");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Replace with your frontend URL
        credentials: true
    }
});

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );

const Live_tvRouter = require("./routes/Live-tv")(io);
const PostRouter = require("./routes/Posts");
const AuthRouter = require("./routes/Auth");

// Routers
app.use("/auth", AuthRouter);
app.use("/posts", PostRouter);
app.use("/live-tv", Live_tvRouter);


const PORT = process.env.PORT || 3001; // Use PORT from environment or default to 3001

db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

// Listen for client connections
io.on("connection", (socket) => {
    console.log("A user connected");

    // When a new comment is added, emit an event to update clients
    socket.on("newComment", (comment) => {
        io.emit("commentUpdated", comment);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

