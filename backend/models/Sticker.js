// models/Sticker.js
import mongoose from "mongoose";

const stickerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary public ID
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["Trending", "New", "Animals", "Food", "Cute", "Funny"],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Text index for search
stickerSchema.index({ title: "text", description: "text", category: "text" });

const Sticker = mongoose.model("Sticker", stickerSchema);
export default Sticker;
