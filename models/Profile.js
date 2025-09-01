import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },   
  genre: { type: String, required: true }       
});

export default mongoose.model("Profile", ProfileSchema);
