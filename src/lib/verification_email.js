import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendEmail } from "./email.js";

dotenv.config();

function getAppUrl() {
  const configuredUrl = process.env.APP_URL;
  return configuredUrl && /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl.replace(/\/$/, '')
    : `http://localhost:${process.env.PORT}`;
}

export async function sendVerificationEmail(user) {
  const verifyToken = jwt.sign(
    {
      sub: user.id,
      purpose: "email-verification",
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1d" }
  );

  const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;
  const name = user.firstName || "there";

  await sendEmail(
    user.email,
    "Verify your Smart Hospital account",
    `<p>Hello ${name},</p>
     <p>Your Smart Hospital account has been created. Please verify your email address before logging in.</p>
     <p><a href="${verifyUrl}">Verify your email address</a></p>
     <p>This link expires in 24 hours.</p>`
  );
}