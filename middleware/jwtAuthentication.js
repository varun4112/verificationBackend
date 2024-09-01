const jwt = require("jsonwebtoken");

// MIDDLEWARE TO VERIFY JWT TOKEN 
const jwtMiddleware = (req, res, next) => {
  //extracting token from header
  const token = req.headers["authorization"].split(" ")[1];
  try {
    //verifying token
    const jwtResponse = jwt.verify(token, "secretkey123");
    req.payload = jwtResponse.userId;
    next();
  } catch (err) {
    res.status(401).json("Authorization Failed! Please Login");
  }
};
module.exports = jwtMiddleware;
