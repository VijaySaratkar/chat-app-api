const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, "2118a94d32d584305bbdeb735c6dc52196941354808cde7da2d6ca5030260dad", {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
