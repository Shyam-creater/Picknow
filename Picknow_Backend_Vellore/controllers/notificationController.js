import Notification from "../models/Notification.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { sendPushNotification } from "../utils/pushNotification.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    const objectId = userId && mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : null;

    const query = objectId ? { $or: [{ userId: objectId }, { userId: null }] } : { userId: null };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    // Process notifications to reflect read status for the specific user
    const processedNotifications = notifications.map(notif => {
      const isRead = notif.userId 
        ? notif.isRead 
        : (objectId && notif.readBy && notif.readBy.some(id => id.toString() === userId)) || false;
      return { ...notif.toObject(), isRead };
    });

    let unreadCount = 0;
    if (objectId) {
      unreadCount = await Notification.countDocuments({
        $or: [
          { userId: objectId, isRead: false },
          { 
            userId: null, 
            $or: [
              { readBy: { $exists: false } },
              { readBy: { $nin: [objectId] } }
            ]
          }
        ]
      });
    } else {
      // Guests see all global notifications as unread
      unreadCount = await Notification.countDocuments({ userId: null });
    }

    res.status(200).json({
      success: true,
      notifications: processedNotifications,
      unreadCount,
    });
    console.log(`System: Fetched notifications for user ${userId || 'Guest'}. Unread count: ${unreadCount}`);
  } catch (error) {
    console.error("System: getNotifications error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    const objectId = userId && mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : null;
    
    if (notificationId === "all") {
      if (objectId) {
        // Mark user-specific notifications as read
        await Notification.updateMany({ userId: objectId, isRead: false }, { isRead: true });
        // Add user to readBy for global notifications
        await Notification.updateMany(
          { userId: null, readBy: { $nin: [objectId] } },
          { $addToSet: { readBy: objectId } }
        );
      } else {
        await Notification.updateMany({ userId: null }, { isRead: true });
      }
    } else {
      const notif = await Notification.findById(notificationId);
      if (notif) {
        if (notif.userId) {
          notif.isRead = true;
        } else if (objectId) {
          if (!notif.readBy) notif.readBy = [];
          if (!notif.readBy.some(id => id.toString() === userId)) {
            notif.readBy.push(objectId);
          }
        } else {
          notif.isRead = true;
        }
        await notif.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
};

export const createNotification = async (notifData) => {
  try {
    const notification = new Notification(notifData);
    await notification.save();

    // Trigger Push Notification
    await sendPushNotification(
      notifData.userId, 
      notifData.title, 
      notifData.message, 
      { id: notification._id, type: notifData.type }
    );

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const updatePushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;
    if (!userId || !pushToken) {
      return res.status(400).json({ success: false, message: "Missing userId or pushToken" });
    }

    await User.findByIdAndUpdate(userId, { pushToken });
    
    res.status(200).json({
      success: true,
      message: "Push token updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating push token",
      error: error.message,
    });
  }
};
