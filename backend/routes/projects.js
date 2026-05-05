// backend/routes/projects.js
// FIXES:
//   - Added GET /:id route — was missing, causing "Route not found" on ProjectDetail
//   - Added DELETE /:id route — was missing from this file
//   - Consistent error handling and status codes across all routes
//   - Uses Project model (adjust import path if your model file differs)

import express from "express";
import Project from "../models/Project.js";

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   GET /api/projects
   Public — fetch all projects, newest first
───────────────────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("[GET /api/projects]", err.message);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/projects/:id
   ✅ ADDED — was missing, caused "Route not found" in ProjectDetail
   Public — fetch single project by MongoDB _id
───────────────────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    // Invalid ObjectId format → treat as not found
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Project not found" });
    }
    console.error("[GET /api/projects/:id]", err.message);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/projects
   Protected — create new project (called from Admin panel)
───────────────────────────────────────────────────────────── */
router.post("/", async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error("[POST /api/projects]", err.message);
    res
      .status(400)
      .json({ message: err.message || "Failed to create project" });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/projects/:id
   Protected — update existing project
───────────────────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Project not found" });
    }
    console.error("[PUT /api/projects/:id]", err.message);
    res
      .status(400)
      .json({ message: err.message || "Failed to update project" });
  }
});

/* ─────────────────────────────────────────────────────────────
   DELETE /api/projects/:id
   Protected — delete project (called from Admin panel)
───────────────────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Project not found" });
    }
    console.error("[DELETE /api/projects/:id]", err.message);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

export default router;
