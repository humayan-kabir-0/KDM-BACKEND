// backend/routes/projectRoutes.js
// backend/routes/projectRoutes.js
import express       from "express";
import multer        from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier   from "streamifier";
import Project       from "../models/Project.js";

const router = express.Router();

// ── Cloudinary config (reads from .env) ──────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Multer: memory storage (buffer → Cloudinary stream) ──────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// ── Helper: upload buffer to Cloudinary ──────────────────────
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "kdm-projects", resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/* ─────────────────────────────────────────────────────────────
   GET /api/projects  — all projects newest first
───────────────────────────────────────────────────────────── */
router.get("/", async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("[GET /api/projects]", err.message);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/projects/:id  — single project
───────────────────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ message: "Project not found" });
    console.error("[GET /api/projects/:id]", err.message);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/projects  — create with image upload
───────────────────────────────────────────────────────────── */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, link, technologies } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Upload image if provided
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    // technologies comes as JSON string from FormData
    let techArray = [];
    if (technologies) {
      try {
        techArray = JSON.parse(technologies);
      } catch {
        techArray = technologies.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    const project = new Project({
      title:        title.trim(),
      description:  description?.trim() || "",
      technologies: techArray,
      link:         link?.trim() || "",
      image:        imageUrl,
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error("[POST /api/projects]", err.message);
    res.status(400).json({ message: err.message || "Failed to create project" });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/projects/:id  — update
───────────────────────────────────────────────────────────── */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      updates.image = await uploadToCloudinary(req.file.buffer);
    }
    if (updates.technologies && typeof updates.technologies === "string") {
      try {
        updates.technologies = JSON.parse(updates.technologies);
      } catch {
        updates.technologies = updates.technologies.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Project not found" });
    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ message: "Project not found" });
    console.error("[PUT /api/projects/:id]", err.message);
    res.status(400).json({ message: err.message || "Failed to update project" });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/projects/:id
───────────────────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") return res.status(404).json({ message: "Project not found" });
    console.error("[DELETE /api/projects/:id]", err.message);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

export default router;









