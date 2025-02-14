const jwt = require('jsonwebtoken');
require("dotenv").config();

const authorMiddleware = (req, res, next) => {
  let token = req.headers?.authorization?.split(" ")[1];
  if (!process.env.SECRET) {
    console.error("SECRET is not defined in environment variables");
    return res.status(500).send({ msg: "Internal Server Error!!" });
  }
  if (token) {
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        console.error("Token verification error:", err); // Логируем ошибку верификации токена
        res.status(400).send({ msg: "Token Expired, Login Please!!" });
      } else {
        console.log("Decoded token:", decoded); // Логируем декодированный токен
        req.body = { ...req.body, author_id: decoded.author_id, author_name: decoded.author_name };
        next();
      }
    });
  } else {
    console.error("No token provided"); // Логируем отсутствие токена
    res.status(400).send({ msg: "Token Expired, Login Please!!" });
  }
};

module.exports = { authorMiddleware };