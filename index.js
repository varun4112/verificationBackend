const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();
require("./DbConnection/DbConnections"); //Connecting to the database
const router = require("./router/router");

const server = express();
server.use(
  cors({
    origin: process.env.clientUrl, // Allow requests from this origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true, // Allow cookies to be sent with requests
  })
);

server.use(express.json());
server.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 60000,
    },
  })
);

server.get("/", (req, res) => {
  res.send("<h1>Server Is Running :)</h1>");
});

// Use the router for other routes
server.use(router);

const PORT = process.env.PORT || 4000; // Optionally use an environment variable for PORT

server.listen(PORT, () => {
  console.log(`Server is running on PORT : ${PORT}`);
});
