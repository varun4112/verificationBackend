const express = require("express");
const users = require("../models/userSchema");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const axios = require("axios");

//CREATING CLIENT FOR TWILIO
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

//GENERATING OTP FOR EMAIL VERIFICATION USING NODEMAILER
exports.genOtp = async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

    // Store OTP in session
    req.session.otp = { value: otp, expiresAt };

    // Configure the email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: "Your verification OTP",
      html: `<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; color: #4CAF50;">Verify Your Email Address</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Thank you for signing up. Please use the following OTP to complete your registration:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; padding: 10px 20px; font-size: 24px; font-weight: bold; color: #4CAF50; border:2px solid #4CAF50; border-radius: 5px;">${otp}</span>
            </div>
          </div>
        </body>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Respond to the client
    res.status(200).send({ message: "OTP generated" });
  } catch (error) {
    console.error("Error generating or sending OTP:", error);
  }
};

// CONTROLLER TO VERIFY OTP GENERATED
exports.verOtp = (req, res) => {
  const { otp } = req.body;
  // Check if OTP is provided
  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  try {
    // Validate OTP
    if (
      req.session.otp &&
      req.session.otp.value == otp &&
      req.session.otp.expiresAt > Date.now()
    ) {
      // OTP is valid
      res.status(200).send("OTP verified successfully");
    } else {
      // OTP is invalid or expired
      res.status(400).json({ message: "Invalid or expired OTP" });
    }
  } catch (error) {
    // Log error for debugging
    console.error("Error verifying OTP:", error);

    // Respond with a generic error message
    res.status(500).json({
      message: "An error occurred while verifying OTP. Please try again later.",
    });
  }
};

// GENERATING PHONE OTP USING TWILIO
exports.sendPhoneOtp = async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
  const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
  const { phone } = req.body;
  // Store OTP in session
  req.session.otp = { value: otp, expiresAt };

  try {
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: "+14157544734",
      to: `+91${phone}`,
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    return res
      .status(500)
      .json({ message: "Error sending OTP", error: err.message });
  }
};

// GST VERIFICATION
exports.gstVerification = async (req, res) => {
  const gstin = req.params.gstin;
  const userId = req.payload;

  // verifying picode
  if (!gstin || !userId) {
    return res.status(400).json({ message: "gstin or User ID is Invalid" });
  }

  const options = {
    method: "POST",
    url: "https://gst-verification.p.rapidapi.com/v3/tasks/sync/verify_with_source/ind_gst_certificate",
    headers: {
      "x-rapidapi-key": "1eeb5c34f9msh1d356ce76e338bbp154d8bjsnc5df26c7e19e",
      "x-rapidapi-host": "gst-verification.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      task_id: process.env.task_id,
      group_id: process.env.group_id,
      data: {
        gstin: gstin,
      },
    },
  };

  try {
    const response = await axios.request(options);
    if (response) {
      const updatedUser = await users.findByIdAndUpdate(
        userId,
        { gstin },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res
        .status(200)
        .json({ message: "GST Number added successfully", user: updatedUser });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", Error: error });
  }
};

//PINCODE VERIFIACTION
exports.pincode = async (req, res) => {
  const pincode = req.params.pin;
  const userId = req.payload;

  // verifying picode
  if (pincode.length != 6 || !userId) {
    return res.status(400).json({ message: "Pincode or User ID is Invalid" });
  }

  const options = {
    method: "GET",
    url: `https://india-pincode-with-latitude-and-longitude.p.rapidapi.com/api/v1/pincode/${pincode}`,
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host":
        "india-pincode-with-latitude-and-longitude.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    if (response) {
      if (response.data.length == 0) {
        res.status(404).json(`Location: ${pincode} Not Found`);
      } else {
        // Updating location in database
        const firstLocation = response.data[0];
        const updatedUser = await users.findByIdAndUpdate(
          userId,
          { pincode, location: firstLocation },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
          message: "Pincode Verified successfully",
          location: updatedUser.location,
        });
      }
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", Error: error });
  }
};

// BANK DETAILS
exports.bankDetails = async (req, res) => {
  const { ifsc, accountDetails } = req.body;
  const userId = req.payload;

  if (!ifsc || !accountDetails) {
    return res
      .status(400)
      .json({ message: "IFSC code and account details are required" });
  }

  const options = {
    method: "POST",
    url: "https://indian-bank-account-verification.p.rapidapi.com/v3/tasks/async/verify_with_source/validate_bank_account",
    headers: {
      "x-rapidapi-key": "f1a8304e44mshb99b7af6784fb28p1a817ajsn580087d49d1f", // Use environment variables for sensitive data
      "x-rapidapi-host": "indian-bank-account-verification.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      task_id: "123", // Ideally, these should be dynamically generated
      group_id: "1234", // Adjust as needed
      data: {
        bank_account_no: accountDetails, // Pass account details from the request body
        bank_ifsc_code: ifsc, // Pass IFSC from the request body
      },
    },
  };

  try {
    const response = await axios.request(options);
    const requestId = response.data.request_id;

    if (!requestId) {
      return res
        .status(400)
        .json({ message: "Failed to initiate bank verification" });
    }

    const options2 = {
      method: "GET",
      url: "https://indian-bank-account-verification.p.rapidapi.com/v3/tasks",
      params: {
        request_id: requestId,
      },
      headers: {
        "x-rapidapi-key": "f1a8304e44mshb99b7af6784fb28p1a817ajsn580087d49d1f", // Use environment variables for sensitive data
        "x-rapidapi-host": "indian-bank-account-verification.p.rapidapi.com",
      },
    };

    const response2 = await axios.request(options2);
    if (response2.status == "200") {
      const updatedUser = await users.findByIdAndUpdate(
        userId,
        { bankIfsc: ifsc, bankAc: accountDetails },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Bank details verified successfully",
        user: updatedUser,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Bank verification failed", details: response2.data });
    }
  } catch (error) {
    console.error("Bank verification error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// AAdhaar Verification
exports.aadhaar = async (req, res) => {
  const aadhaar = req.params.id;
  const userId = req.payload;

  // Validate input
  if (!aadhaar || !userId) {
    return res
      .status(400)
      .json({ message: "Aadhaar number and UserId is required" });
  }

  const options = {
    method: "POST",
    url: "https://api.apyhub.com/validate/aadhaar",
    headers: {
      "apy-token": process.env.APY_TOKEN,
      "Content-Type": "application/json",
    },
    data: { aadhaar: aadhaar },
  };

  try {
    const response = await axios.request(options);
    if (response.data.data == true) {
      const updatedUser = await users.findByIdAndUpdate(
        userId,
        { isAadhaarVerified: true },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({
        message: "Aadhaar Verified Successfully",
        updatedUser: updatedUser,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "An error occurred while verifying Aadhaar",
      error: err.message,
    });
  }
};

// Pan Verification
exports.panVerification = async (req, res) => {
  const pan = req.params.id;
  const userId = req.payload;

  // validating pan
  if (!pan || !userId) {
    return res.status(400).json({ message: "PAN or User ID is Missing" });
  }

  // Creating options to make axios request to rapid api
  const optionsPan = {
    method: "POST",
    url: "https://aadhaar-number-verification-api-using-pan-number.p.rapidapi.com/api/validation/pan_to_aadhaar",
    headers: {
      "x-rapidapi-key": "aabb3b3740msh21b2dee51303960p1dc81bjsn605daa68d6d2",
      "x-rapidapi-host":
        "aadhaar-number-verification-api-using-pan-number.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    // Request body for rapid api
    data: {
      pan: pan,
      consent: "y",
      consent_text:
        "I hear by declare my consent agreement for fetching my information via AITAN Labs API",
    },
  };

  try {
    const response = await axios.request(optionsPan);
    if (response.status == 200) {
      const updatedUser = await users.findByIdAndUpdate(
        userId,
        { PAN: pan },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Verification SUCESSFULL" });
    }
  } catch (error) {
    res.status(500).json(`Verification Failed: ${error}`);
    console.error(error);
  }
};

//PINCODE LOOKUP
exports.pincodeLookup = async (req, res) => {
  const pincode = req.params.pin;
  const userId = req.payload;

  // verifying picode
  if (pincode.length != 6 || !userId) {
    return res.status(400).json({ message: "Pincode or User ID is Invalid" });
  }

  const options = {
    method: "GET",
    url: `https://india-pincode-with-latitude-and-longitude.p.rapidapi.com/api/v1/pincode/${pincode}`,
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host":
        "india-pincode-with-latitude-and-longitude.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    if (response.data.length != 0) {
      res.status(200).json({ message: "Success", Data: response.data });
    } else {
      res.status(404).json({ message: "Pincode Not Found" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", Error: error });
  }
};
