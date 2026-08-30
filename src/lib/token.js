import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

export function createAccessToken(
  userId,
  role,
  tokenVersion
) {
  const payload = { sub: userId, role, tokenVersion };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "30m",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET) ;
}

export function createRefreshToken(userId, tokenVersion) {
  const payload = { sub: userId, tokenVersion };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET); 
}
