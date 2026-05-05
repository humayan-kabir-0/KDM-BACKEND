// backend/models/Project.js

import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or fewer"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    // ✅ liveLink — the external URL opened when user clicks "View Project"
    liveLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v),
        message: "liveLink must be a valid http/https URL",
      },
    },
    // Legacy field alias — keep for backward compat with older documents
    link: {
      type: String,
      trim: true,
      default: "",
    },
    technologies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  },
);

// Virtual: expose whichever link field is populated
projectSchema.virtual("resolvedLink").get(function () {
  return this.liveLink || this.link || "";
});

export default mongoose.model("Project", projectSchema);