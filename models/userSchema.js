const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  aadhaarNumber: {
    type: String,
    required: true,
  },
  isAadhaarVerified: {
    type: Boolean,
  },
  PAN: {
    type: String,
    default: "",
  },
  gstin: {
    type: String,
    default: "",
  },
  pincode: {
    type: String,
    default: "",
  },
  location: {
    type: Object,
  },
  bankIfsc: {
    type: String,
    default: "",
  },
  bankAc: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("users", userSchema);
module.exports.users;
