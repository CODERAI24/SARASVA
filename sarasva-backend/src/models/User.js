import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const settingsSchema = new mongoose.Schema(
  {
    focusModeEnabled:   { type: Boolean, default: true  },
    strictFocusEnabled: { type: Boolean, default: false },
    motivationEnabled:  { type: Boolean, default: true  },
    analyticsEnabled:   { type: Boolean, default: true  },
    safeModeEnabled:    { type: Boolean, default: true  },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    course:       { type: String, trim: true, default: "" },
    semester:     { type: String, trim: true, default: "" },
    settings:     { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Hash the raw password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Used in auth.controller to verify login credentials
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export default mongoose.model("User", userSchema);
