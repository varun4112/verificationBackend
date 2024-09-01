const mongoose = require("mongoose");
require("dotenv").config();
const connectionString = process.env.DATABASE;
mongoose
  .connect(connectionString)
  .then(() => console.log("Connected to MONGODB"))
  .catch((err) => {
    console.log(err);
  });
