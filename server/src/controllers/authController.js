import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Public registration always creates users with "user" role
    // Only admins can create admin accounts via /api/users endpoint
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "local",
      role: "user", // Always "user" for public registration
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { idToken, accessToken } = req.body;
    
    let email, name, googleId;

    // Try ID token first (preferred)
    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload?.email;
        name = payload?.name;
        googleId = payload?.sub;
      } catch (idTokenError) {
        // If ID token fails, fall back to access token
        if (!accessToken) {
          return res.status(400).json({ message: "Invalid Google token" });
        }
      }
    }

    // If we have access token but no ID token data, fetch user info
    if (accessToken && !email) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user info");
        }
        const userInfo = await response.json();
        email = userInfo.email;
        name = userInfo.name;
        googleId = userInfo.id;
      } catch (fetchError) {
        return res.status(400).json({ message: "Failed to verify Google token" });
      }
    }

    if (!email || !googleId) {
      return res.status(400).json({ message: "Invalid Google token - missing user info" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        provider: "google",
        role: "user",
      });
    } else if (!user.googleId) {
      // Update existing user with Google ID if they didn't have it
      user.googleId = googleId;
      user.provider = "google";
      await user.save();
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


