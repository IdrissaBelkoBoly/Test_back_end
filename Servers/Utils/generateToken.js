// utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Tu peux changer la durée
  );
};

export default generateToken;
