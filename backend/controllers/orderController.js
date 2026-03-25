import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Sticker from "../models/Sticker.js";

/**
 * ✅ Place an order (COD / other methods)
 */
export const placeOrder = async (req, res) => {
  try {
    console.log("📦 Order request body:", req.body);
    console.log("👤 User from auth:", req.user);

    const { items, total, address, paymentMethod = "COD" } = req.body;

    // Ensure required fields exist
    if (!items || !items.length || !total || !address || !paymentMethod) {
      return res.status(400).json({
        message: "Items, address, total, and paymentMethod are required",
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // Verify prices server-side to prevent tampering
    const stickerIds = items.map((i) => i.sticker);
    const stickers = await Sticker.find({ _id: { $in: stickerIds } });
    const priceMap = new Map(stickers.map((s) => [s._id.toString(), s.price]));

    let serverTotal = 0;
    for (const item of items) {
      const price = priceMap.get(String(item.sticker)) || 0;
      serverTotal += price * Math.max(1, Number(item.quantity) || 1);
    }

    if (Math.round(serverTotal * 100) !== Math.round(Number(total) * 100)) {
      return res.status(400).json({
        message: "Total mismatch. Please refresh the page and try again.",
        expectedTotal: serverTotal,
      });
    }

    const newOrder = new Order({
      user: req.user.id,
      items,
      total: serverTotal,
      address,
      paymentMethod,
      status: "pending",
    });

    console.log("🛠 New Order object:", newOrder);

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("❌ Order save failed:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * ✅ Get orders for the current user
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("📥 Fetching orders for user:", userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({ user: userId })
      .populate("items.sticker")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("❌ GetUserOrders error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ✅ Admin: Get all orders
 */
export const getAllOrders = async (req, res) => {
  try {
    console.log("📥 Admin fetching all orders");

    const orders = await Order.find()
      .populate("items.sticker user")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("❌ GetAllOrders error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ✅ Admin: Update order status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true, runValidators: false }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log(`✅ Order ${orderId} status updated to ${status}`);

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("❌ UpdateOrderStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};
