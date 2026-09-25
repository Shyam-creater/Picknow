import express from "express";
import { getNotifications, markAsRead, updatePushToken } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.put("/mark-read/:notificationId", markAsRead);
router.post("/update-token", updatePushToken);

export default router;
