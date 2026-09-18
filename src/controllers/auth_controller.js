import express from "express";
import { registerValidator, loginValidator } from "../validators/auth_validator.js";
import jwt from 'jsonwebtoken';
import { prisma } from "../config/db.js";
import { hashPassword, checkPassword } from "../lib/hash.js";
import dotenv from "dotenv";
import { sendEmail } from "../lib/email.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import * as OTPLib from 'otplib';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../lib/token.js";

dotenv.config();

const { authenticator } = OTPLib;

function getAppUrl() {
  return process.env.APP_URL || `http://localhost:${process.env.PORT}`;
}

function getFrontendLoginUrl() {
  const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:5500";
  return `${frontendUrl.replace(/\/$/, "")}/login.html`;
}

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error("Google client id and secret both are missing");
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });
}


export const registerController = async(req , res , next )=>{
    try {
        const result = registerValidator.safeParse(req.body);

        if (!result.success) {
        return res.status(400).json({
            message: "Invalid data!",
            errors: result.error.flatten(),
        });
        }

        const { firstName, lastName, otherNames, email, password } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ 
        where: {email: normalizedEmail} });

    if (existingUser) {
    return res.status(409).json({
        message: "Email is already in use! Please try with a different email",
    });
    }
    const passwordHash = await hashPassword(password);

    const newlyCreatedUser = await prisma.user.create({
      data : {
    email: normalizedEmail,
    password: passwordHash,
    role: "PATIENT",
    isEmailVerified: false,
    twoFactorEnabled: false,
    firstName,
    lastName,
    otherNames,
    patient: {
      create: {}
    }
        }
    });

    // email verification part

    const verifyToken = jwt.sign(
    {
        sub: newlyCreatedUser.id,
    },
    process.env.JWT_ACCESS_SECRET,
    {
        expiresIn: "1d",
    }
    );

    const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;

    await sendEmail(
    newlyCreatedUser.email,
    "Verify your email",
    `<p>please verify your emal by clicking this link:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        `
    );

    return res.status(201).json({
    message: "User registered",
    user: {
        id: newlyCreatedUser.id,
        email: newlyCreatedUser.email,
        role: newlyCreatedUser.role,
        isEmailVerified: newlyCreatedUser.isEmailVerified,
    },
    });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: "Registration failed. Please try again later.",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        }); 
    }
}

export async function verifyEmailController(req, res, next) {
    const token = req.query.token;
  const frontendLoginUrl = getFrontendLoginUrl();

    if (!token) {
        return res.status(400).json({ 
            message: "Verification token is missing" 
        });
    }

    try {
        // Verify the token
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        console.log('Token payload:', payload); // Debug log

        // Find the user by ID
        const user = await prisma.user.findUnique({
            where: { id: payload.sub }
        });

        if (!user) {
            return res.status(400).json({ 
                message: "User not found" 
            });
        }

        if (user.isEmailVerified) {
            // Return HTML response for already verified
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Email Already Verified</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                        .icon { font-size: 60px; margin-bottom: 20px; }
                        h1 { color: #2c3e50; margin-bottom: 10px; }
                        p { color: #666; margin-bottom: 20px; }
                        .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">✅</div>
                        <h1>Email Already Verified</h1>
                        <p>Your email address has already been verified.</p>
                        <a href="${frontendLoginUrl}" class="btn">Go to Login</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Update user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true }
        });

        // Return success HTML page
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Verified Successfully</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                    .icon { font-size: 60px; margin-bottom: 20px; }
                    h1 { color: #27ae60; margin-bottom: 10px; }
                    p { color: #666; margin-bottom: 20px; }
                    .btn { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">🎉</div>
                    <h1>Email Verified Successfully!</h1>
                    <p>Your email address has been confirmed. You can now log in to your account.</p>
                    <a href="${frontendLoginUrl}" class="btn">Go to Login</a>
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        console.error('Verification error:', err);
        
        // Handle token expiration
        if (err.name === 'TokenExpiredError') {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Verification Link Expired</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                        .icon { font-size: 60px; margin-bottom: 20px; }
                        h1 { color: #e74c3c; margin-bottom: 10px; }
                        p { color: #666; margin-bottom: 20px; }
                        .btn { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">⏰</div>
                        <h1>Verification Link Expired</h1>
                        <p>The verification link has expired. Please request a new one.</p>
                        <a href="/resend-verification" class="btn">Resend Verification Email</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Handle invalid token
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invalid Verification Link</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                    .icon { font-size: 60px; margin-bottom: 20px; }
                    h1 { color: #e74c3c; margin-bottom: 10px; }
                    p { color: #666; margin-bottom: 20px; }
                    .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">❌</div>
                    <h1>Invalid Verification Link</h1>
                    <p>The verification link is invalid or has been tampered with.</p>
                    <a href="/register" class="btn">Back to Registration</a>
                </div>
            </body>
            </html>
        `);
    }
}
export async function resendVerificationController(req, res, next) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // Create new verification token
        const verifyToken = jwt.sign(
            { sub: user.id },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "1d" }
        );

        const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;

        await sendEmail(
            user.email,
            "Verify your email - Resend",
            `<p>Please verify your email by clicking this link:</p>
             <p><a href="${verifyUrl}">${verifyUrl}</a></p>`
        );

        return res.json({
            message: "Verification email has been resent. Please check your inbox."
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({
            message: "Failed to resend verification email"
        });
    }
}
export async function loginController(req, res, next){
try {
    const result = loginValidator.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid data!",
        errors: result.error.flatten(),
      });
    }

    const { email, password, twoFactorCode } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
        where:{ email: normalizedEmail} });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const ok = await checkPassword(password, user.password);

    if (!ok) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (!user.isEmailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in..." });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode || typeof twoFactorCode !== "string") {
        return res.status(400).json({
          message: "Two factor code is required",
        });
      }

      if (!user.twoFactorSecret) {
        return res.status(400).json({
          message: "Two factor miscofigured for this accounr",
        });
      }

      //  verify the code using otpLib

      const isValidCode = authenticator.check(
        twoFactorCode,
        user.twoFactorSecret
      );

      if (!isValidCode) {
        return res.status(400).json({
          message: "Invalid two factor code",
        });
      }
    }

    const accessToken = createAccessToken(
      user.id,
      user.role,
      user.tokenVersion
    );

    const refreshToken = createRefreshToken(user.id, user.tokenVersion);

    const isProd = process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 30 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Login successfully done",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function refreshController(req,res,next){
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
        return res.status(401).json({ message: "Refresh token missing" });
        }

        const payload = verifyRefreshToken(token);

        const user = await prisma.user.findUnique({
          where: { id: payload.sub }
      });

        if (!user) {
        return res.status(401).json({ message: "User not found" });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
        return res.status(401).json({ message: "Refresh token invalidated" });
        }

        const newAccessToken = createAccessToken(
        user.id,
        user.role,
        user.tokenVersion
        );

        const newRefreshToken = createRefreshToken(user.id, user.tokenVersion);

        const isProd = process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://");

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
          maxAge: 30 * 60 * 1000,
          path: "/"
        });

        return res.status(200).json({
        message: "Token refreshed",
        accessToken: newAccessToken,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
        },
        });
    } catch (err) {
        console.log(err);

        return res.status(500).json({
        message: "Internal server error",
        });
    }
}

export async function logoutController(req, res) {
    const isProd = process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://");

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/"
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}

export async function forgotPasswordController(req, res, next) {
    const { email } = req.body ;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findFirst({
        where: {email: normalizedEmail }});

    if (!user) {
      return res.json({
        message:
          "A reset link will be sent to ur email",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
          resetPasswordToken: tokenHash,
          resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000)
      }
  });

    const resetUrl = `${getAppUrl()}/auth/reset-password?token=${rawToken}`;

    await sendEmail(
      user.email,
      "Reset your password",
      `
        <p>You requested password reset.Click on the below link to reset the password</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        `
    );

    return res.json({
      message:
        "If an account with this email exists, we will send you a reset link",
    });
  } catch (e) {
    console.log(e);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function resetPasseordController(req, res, next){
    const { token, password } = req.body ;

    if (!token) {
        return res.status(400).json({ message: "Reset token is missing" });
    }

    if (!password || password.length < 6) {
        return res
        .status(400)
        .json({ message: "Password must be atleast 6 char long" });
    }

    try {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await prisma.user.findFirst({
          where: {
              resetPasswordToken: tokenHash,
              resetPasswordExpires: { gt: new Date() }
          }
      });

        if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
        }

        const newPasswordHash = await hashPassword(password);
        // user.passwordHash = newPasswordHash;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.tokenVersion = user.tokenVersion + 1;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: newPasswordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                tokenVersion: user.tokenVersion + 1
            }
        });

        return res.json({
        message: "Password reset successfully!",
        });
    } catch (err) {
        return res.status(500).json({
        message: "Internal server error",
        });
    }
}

export async function googleAuthStartController(req,res, next){
    try {
    const client = getGoogleClient();

    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });

    return res.redirect(url);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }

}

export async function googleAuthCallBackController(req, res, next){
    const code = req.query.code;

  if (!code) {
    return res.status(400).json({
      message: "Missing code in callback",
    });
  }

  try {
    const client = getGoogleClient();

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).json({
        message: "No googles id_token is present",
      });
    }

    //verify id tokena and read the user info from it
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID ,
    });

    const payload = ticket.getPayload();

    const email = payload?.email;
    const emailVerified = payload?.email_verified;

    if (!email || !emailVerified) {
      return res.status(400).json({
        message: "Google email account is not verified",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findFirst({
        where: { email: normalizedEmail }});

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
    data: {
        email: normalizedEmail,
        password: passwordHash,
        firstName: payload.given_name || "Google",
        lastName: payload.family_name || "User",
        role: "PATIENT",
        isEmailVerified: true,
        twoFactorEnabled: false
    }
});
    } else {
      if (!user.isEmailVerified) {
        await prisma.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true }
        });
      }
    }

    const accessToken = createAccessToken(
      user.id,
      user.role ,
      user.tokenVersion
    );

    const refreshToken = createRefreshToken(user.id, user.tokenVersion);

    const isProd = process.env.NODE_ENV === "production" || process.env.APP_URL?.startsWith("https://");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/"
    });

    return res.json({
      message: "Google login successfully",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function twoFactorAuthenticationSetupController(req, res, next){
    const authReq = req ;
  const authUser = authReq.user;

  if (!authUser) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  try {
    const user = await prisma.user.findUnique({
        where: { id: authUser.id }
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const secret = authenticator.generateSecret();

    const issuer = "NodeAdvancedAuthApp";

    const otpAuthUrl = authenticator.keyuri(user.email, issuer, secret);

    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;

    await prisma.user.update({
      where: { id: user.id },
      data: {
          twoFactorSecret: secret,
          twoFactorEnabled: false
      }
  });

    return res.json({
      message: "2FA setup is done",
      otpAuthUrl,
      secret,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
export async function twoFactorAuthenticationverificationController(req, res){
    const authReq = req ;
  const authUser = authReq.user;

  if (!authUser) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  const { code } = req.body ;

  if (!code) {
    return res.status(400).json({
      message: "Two factor code is required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id }
  });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        message: "You dont have 2fa setup yet.",
      });
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid two factor code",
      });
    }

    user.twoFactorEnabled = true;
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    return res.json({
      message: "2FA enabled successfully",
      twoFactorEnabled: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}