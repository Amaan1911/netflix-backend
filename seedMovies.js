import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Initialize Firebase
import serviceAccount from "./firebase-service-account.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read movies.json
const moviesPath = path.join(process.cwd(), "movies.json");
const movies = JSON.parse(fs.readFileSync(moviesPath, "utf-8"));

async function seedMovies() {
  try {
    const batch = db.batch();

    movies.forEach((movie) => {
      const movieRef = db.collection("movies").doc(); // auto ID
      batch.set(movieRef, movie);
    });

    await batch.commit();
    console.log("✅ Movies uploaded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error uploading movies:", err);
    process.exit(1);
  }
}

seedMovies();
