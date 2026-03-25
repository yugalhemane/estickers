import Sticker from "../models/Sticker.js";
import { stickerSchema } from "../validators/stickerValidation.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// GET all stickers (Public)
export const getAllStickers = async (req, res) => {
  try {
    const { category, q, page = 1, limit = 12, sort } = req.query; // category + search + pagination/sort
    const filter = category ? { category } : {};
    if (q) {
      filter.$text = { $search: q };
    }

    // Build sort object, default newest first
    let sortObj = { createdAt: -1 };
    if (typeof sort === "string" && sort.includes(":")) {
      const [field, dir] = sort.split(":");
      sortObj = { [field]: dir === "asc" ? 1 : -1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, stickers] = await Promise.all([
      Sticker.countDocuments(filter),
      Sticker.find(filter).sort(sortObj).skip(skip).limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      count: stickers.length,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      data: stickers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stickers",
    });
  }
};

// GET sticker by ID (Public)
export const getStickerById = async (req, res) => {
  try {
    const { id } = req.params;
    const sticker = await Sticker.findById(id);

    if (!sticker) {
      return res.status(404).json({
        success: false,
        message: "Sticker not found",
      });
    }

    res.status(200).json({
      success: true,
      data: sticker,
    });
  } catch (err) {
    console.error("Get Sticker by ID Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sticker details",
    });
  }
};

// ADD new sticker (Admin Only, with image upload)
// controllers/stickerController.js
export const addSticker = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!req.file?.path) {
      return res.status(400).json({ error: "Image is required" });
    }

    const newSticker = new Sticker({
      title,
      description,
      price,
      category,
      imageUrl: req.file.path, // Cloudinary or local upload
      publicId: req.file.filename || "default", // Cloudinary publicId
      uploadedBy: req.user?._id || null,
    });

    await newSticker.save();
    res.status(201).json({ success: true, sticker: newSticker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// controllers/stickerController.js
export const updateSticker = async (req, res) => {
  try {
    let { title, description, price, category } = req.body;

    if (price) {
      price = Number(price);
    }

    const validatedData = stickerSchema.parse({
      title,
      description,
      price,
      category,
    });

    // Remove undefined fields so they don’t overwrite existing ones
    const updateFields = Object.fromEntries(
      Object.entries(validatedData).filter(([_, v]) => v !== undefined)
    );

    // If a new image is uploaded, replace existing Cloudinary asset
    if (req.file?.path) {
      const existing = await Sticker.findById(req.params.id);
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Sticker not found" });
      }
      if (existing.publicId) {
        try {
          await cloudinary.uploader.destroy(existing.publicId);
        } catch (e) {
          // proceed even if delete fails
        }
      }
      updateFields.imageUrl = req.file.path;
      updateFields.publicId = req.file.filename || existing.publicId || "";
    }

    const updatedSticker = await Sticker.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    res.json({
      success: true,
      message: "Sticker updated successfully",
      data: updatedSticker,
    });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: error.errors || error.message });
  }
};

// DELETE sticker (Admin Only)
export const deleteSticker = async (req, res) => {
  const { id } = req.params;
  try {
    const sticker = await Sticker.findById(id);
    if (!sticker) return res.status(404).json({ message: "Sticker not found" });

    // Delete image from Cloudinary
    if (sticker.publicId) {
      await cloudinary.uploader.destroy(sticker.publicId);
    }

    // Delete from DB
    await Sticker.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Sticker deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete sticker" });
  }
};

// (removed stray frontend-like helper)
