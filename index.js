const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const db = require("./models");

// Routers
const AuthRouter = require("./routes/Auth");
app.use("/auth", AuthRouter);

const PostRouter = require("./routes/Posts");
app.use("/posts", PostRouter);


const PORT = process.env.PORT || 3001; // Use PORT from environment or default to 3001

db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});