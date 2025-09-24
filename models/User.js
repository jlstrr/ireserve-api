import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    id_number: { type: String, required: true, unique: true },

    firstname: { type: String, required: true },
    middle_initial: { type: String },
    lastname: { type: String, required: true },

    program_course: { type: String }, // e.g., BSCS, BSIT, etc.

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    user_type: {
      type: String,
      enum: ["student", "faculty"],
      default: "student",
    },

    remaining_time: { type: String, default: null }, // in minutes or hours
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔑 Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
