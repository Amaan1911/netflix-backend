// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Profile from "./models/Profile.js";
import { movies } from "./moviesData.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const mongoURI = process.env.MONGO_URL;
if (!mongoURI) {
  console.error("❌ MONGO_URI is not defined! Check your .env file.");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ MongoDB connection error:", err));


app.post("/seed_movies", async (req, res) => {
  try {
    const moviesCollection = mongoose.connection.collection("movies");

    for (let genre in movies) {
      for (let movie of movies[genre]) {
        movie.genre = genre;
        await moviesCollection.insertOne(movie);
      }
    }

    res.json({ success: true, message: "Movies seeded!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get all movies (includes old API movies)
app.get("/movies", async (req, res) => {
  const moviesCollection = mongoose.connection.collection("movies");
  const allMovies = await moviesCollection.find({}).toArray();
  res.json({ success: true, movies: allMovies });
});

// 3. Create user profile
app.post("/profiles", async (req, res) => {
  try {
    const { userId, username, genre } = req.body;

    if (!userId || !username || !genre)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const existing = await Profile.findOne({ userId });
    if (existing) return res.status(400).json({ success: false, message: "Profile already exists" });

    const profile = new Profile({ userId, username, genre });
    await profile.save();

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get user profile
app.get("/profiles/:userId", async (req, res) => {
  const { userId } = req.params;
  const profile = await Profile.findOne({ userId });
  if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
  res.json({ success: true, profile });
});

// 5. Get static movies by user preference
// Get static movies by user preference (with genre added dynamically)
app.get("/user-movies/:userId", async (req, res) => {
  const { userId } = req.params;
  const profile = await Profile.findOne({ userId });

  if (!profile) 
    return res.status(404).json({ success: false, message: "Profile not found" });

  const preferredGenre = profile.genre;
  let preferredMovies = movies[preferredGenre] || [];

  // Add genre field dynamically (optional, in case your frontend needs it)
  preferredMovies = preferredMovies.map(movie => ({ ...movie, genre: preferredGenre }));

  res.json({ success: true, movies: preferredMovies });
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
