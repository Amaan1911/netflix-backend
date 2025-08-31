import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },   // changed
  genre: { type: String, required: true }       // changed
});

export default mongoose.model("Profile", ProfileSchema);
