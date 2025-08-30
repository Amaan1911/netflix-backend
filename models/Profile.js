// models/Profile.js
import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  userId: String,         // Firebase UID or some identifier
  name: String,
  email: String,
  preferredGenre: String, // e.g., "Action", "Thriller"
});

export default mongoose.model("Profile", ProfileSchema);
