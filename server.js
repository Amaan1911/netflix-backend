// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import admin from "firebase-admin"; 
import Profile from "./models/Profile.js";
import { movies } from "./moviesData.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const serviceAccountPath = join(__dirname, 'firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));


if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase Admin Initialized");


const mongoURI = process.env.MONGO_URL;
if (!mongoURI) {
  console.error("❌ MONGO_URL is not defined! Check your .env file.");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });



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
    console.error("❌ Seeding Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/movies", async (req, res) => {
  try {
    const moviesCollection = mongoose.connection.collection("movies");
    const allMovies = await moviesCollection.find({}).toArray();
    res.json({ success: true, movies: allMovies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Profile
app.post("/profiles", async (req, res) => {
  try {
    const { userId, username, genre } = req.body;

    if (!userId || !username || !genre) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existing = await Profile.findOne({ userId });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Profile already exists" });
    }

    const profile = new Profile({ userId, username, genre });
    await profile.save();

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/profiles/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get("/user-movies/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    const preferredGenre = profile.genre;
    let preferredMovies = movies[preferredGenre] || [];

    preferredMovies = preferredMovies.map((movie) => ({
      ...movie,
      genre: preferredGenre,
    }));

    res.json({ success: true, movies: preferredMovies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* -------------------- 🚀 Start Server -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
