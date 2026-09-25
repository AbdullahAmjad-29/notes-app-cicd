const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/notesdb";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    tag: { type: String, default: "General" }
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

app.get("/api/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: "Failed to create note" });
  }
});

app.put("/api/notes/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(note);
  } catch (error) {
    res.status(400).json({ error: "Failed to update note" });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete note" });
  }
});

app.patch("/api/notes/:id/pin", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.pinned = !note.pinned;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(400).json({ error: "Failed to update pin status" });
  }
});

app.patch("/api/notes/:id/favorite", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    note.favorite = !note.favorite;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(400).json({ error: "Failed to update favorite status" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Notes API running on port ${PORT}`);
});
