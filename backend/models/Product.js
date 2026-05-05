// product.js

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Prevent OverwriteModelError (important for development)
const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;