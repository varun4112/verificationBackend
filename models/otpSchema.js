const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    default: "",
  },
  otp: {
    type: String,
    default: "",
  },
  createdAt: Date,
  expiresAt: Date,
});

module.exports = mongoose.model("otp", otpSchema);
module.exports.otp;
