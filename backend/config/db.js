// backend/config/db.js
import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info(`MongoDB connected → ${conn.connection.host}`);
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed");
    throw err; // server.js catches this and calls process.exit(1)
  }
};

export default connectDB;
