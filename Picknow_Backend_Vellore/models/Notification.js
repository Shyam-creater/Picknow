import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // null for global/system-wide notifications
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["ORDER", "PRODUCT", "PROMOTION", "SYSTEM"],
      default: "SYSTEM",
    },
    link: {
      type: String, // Link to redirect when clicked
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    metadata: {
      type: Object, // To store extra info like orderId, productId, etc.
      required: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
