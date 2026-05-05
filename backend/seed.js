// backend/utils/seed.js -
import mongoose from "mongoose";
import Project from "./models/Project.js";
import "dotenv/config"; 

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("🌱 Seeding projects...");

    // Clear existing projects
    await Project.deleteMany({});

    // Add sample projects
    await Project.insertMany([
      {
        title: "E-Commerce Dashboard",
        description:
          "Full-stack React + Node.js dashboard with real-time analytics",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500",
        technologies: ["React", "Node.js", "MongoDB", "Tailwind"],
      },
      {
        title: "AI Chatbot Interface",
        description: "Modern conversational UI with voice integration",
        image:
          "https://images.unsplash.com/photo-1687360440546-dbb9f0fd0f83?w=500",
        technologies: ["Next.js", "OpenAI", "WebSockets"],
      },
      {
        title: "Your Portfolio",
        description: "This very website - React + Tailwind + Node.js",
        image:
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500",
        technologies: ["React", "Tailwind", "Node.js", "MongoDB"],
      },
    ]);

    console.log("✅ 3 projects added!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
