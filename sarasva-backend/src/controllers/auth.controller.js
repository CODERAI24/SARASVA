import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

function signToken(id) {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function sendToken(user, statusCode, res) {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:       user._id,
      name:     user.name,
      email:    user.email,
      course:   user.course,
      semester: user.semester,
      settings: user.settings,
    },
  });
}

// POST /api/v1/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password, course, semester } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "Email already in use.");

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook hashes this
      course:   course   || "",
      semester: semester || "",
    });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, "Email and password are required.");

    // passwordHash is select:false — re-add it explicitly
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) throw new ApiError(401, "Invalid credentials.");

    const match = await user.comparePassword(password);
    if (!match) throw new ApiError(401, "Invalid credentials.");

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/auth/me
export async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

// GET /api/v1/user/profile
export async function getProfile(req, res) {
  res.json({ success: true, user: req.user });
}

// PATCH /api/v1/user/profile
export async function updateProfile(req, res, next) {
  try {
    const { name, course, semester } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, course, semester },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/user/settings
export async function getSettings(req, res) {
  res.json({ success: true, settings: req.user.settings });
}

// PATCH /api/v1/user/settings
export async function updateSettings(req, res, next) {
  try {
    const allowed = [
      "focusModeEnabled",
      "strictFocusEnabled",
      "motivationEnabled",
      "analyticsEnabled",
      "safeModeEnabled",
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[`settings.${key}`] = req.body[key];
      }
    });

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ success: true, settings: updated.settings });
  } catch (err) {
    next(err);
  }
}
