// backend/routes/ProductRoutes.js 
import express from "express";
import Product from "../models/Product.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public: Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Product.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// Admin only
router.post("/", protect, requireAdmin, async (req, res) => {
  try {
    const newProject = new Product(req.body);
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: "Error creating project" });
  }
});

router.put("/:id", protect, requireAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating project" });
  }
});

router.delete("/:id", protect, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
});

export default router;







