const express = require("express");
const router = new express.Router();
const userController = require("../controller/userController");
const verificationController = require("../controller/verificationController");
const jwtMiddleware = require("../middleware/jwtAuthentication");

// ROUTES FOR REGISTRATION AND LOGIN
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/user", jwtMiddleware, userController.getUser);

// ROUTES FOR PHONE AND EMAIL VERIFICATION
router.post("/genOtp", verificationController.genOtp);
router.post("/verOtp", verificationController.verOtp);
router.post("/phoneGenOtp", verificationController.sendPhoneOtp);
router.post("/phoneVerOtp", verificationController.verOtp);

// GST Verification
router.get("/gst/:gstin", jwtMiddleware, verificationController.gstVerification);

//Pincode verification
router.get("/pincode/:pin", jwtMiddleware, verificationController.pincode);

// Bank Verification
router.post(
  "/bankVerification",
  jwtMiddleware,
  verificationController.bankDetails
);

// Pan verification
router.get(
  "/panVerification/:id",
  jwtMiddleware,
  verificationController.panVerification
);

// aadhaar verification
router.get(
  "/aadhaarVerification/:id",
  jwtMiddleware,
  verificationController.aadhaar
);

//Pincode Lookup
router.get("/pincodeLookup/:pin", jwtMiddleware, verificationController.pincodeLookup);

module.exports = router;
