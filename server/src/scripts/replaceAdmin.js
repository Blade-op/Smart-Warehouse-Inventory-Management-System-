import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

dotenv.config();

/**
 * Replace admin account(s) in MongoDB when you are locked out or need a new admin.
 *
 * Required env:
 *   NEW_ADMIN_EMAIL
 *   NEW_ADMIN_PASSWORD
 *
 * Optional:
 *   NEW_ADMIN_NAME — default "Administrator"
 *   OLD_ADMIN_EMAIL — delete only this user (any role). If unset, deletes every user with role "admin".
 *
 * Examples (PowerShell):
 *   $env:NEW_ADMIN_EMAIL="you@company.com"; $env:NEW_ADMIN_PASSWORD="SecurePass1!"; node src/scripts/replaceAdmin.js
 *   $env:OLD_ADMIN_EMAIL="admin@wareflow.com"; $env:NEW_ADMIN_EMAIL="you@company.com"; ...
 */

const requireEnv = (name, value) => {
  if (!value || String(value).trim() === "") {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
};

async function main() {
  const newEmail = process.env.NEW_ADMIN_EMAIL?.trim().toLowerCase();
  const newPassword = process.env.NEW_ADMIN_PASSWORD;
  const newName = (process.env.NEW_ADMIN_NAME?.trim() || "Administrator");
  const oldEmail = process.env.OLD_ADMIN_EMAIL?.trim().toLowerCase();

  requireEnv("NEW_ADMIN_EMAIL", newEmail);
  requireEnv("NEW_ADMIN_PASSWORD", newPassword);

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/warehouse";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  try {
    if (oldEmail) {
      const deleted = await User.findOneAndDelete({ email: oldEmail });
      if (deleted) {
        console.log(`Deleted user with email: ${oldEmail}`);
      } else {
        console.log(`No user found with email: ${oldEmail}`);
      }
    } else {
      const result = await User.deleteMany({ role: "admin" });
      console.log(`Deleted ${result.deletedCount} admin user(s).`);
    }

    const clash = await User.findOne({ email: newEmail });
    if (clash) {
      console.error(
        `A user with email "${newEmail}" still exists. Remove or rename that account, then run again.`
      );
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.create({
      name: newName,
      email: newEmail,
      password: hashedPassword,
      provider: "local",
      role: "admin",
    });

    console.log("");
    console.log("New admin created.");
    console.log(`  Email: ${newEmail}`);
    console.log(`  Name:  ${newName}`);
    console.log("");
    console.log("Log in at your app with the password you set in NEW_ADMIN_PASSWORD.");
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
