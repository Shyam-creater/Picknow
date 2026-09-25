import express from "express";
import { getIncomeStats } from "../controllers/dashboard.js";
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";

const router = express.Router();

// Income statistics route - protected for admin only
router.get("/income-stats", isAdminAuth, isAdmin, getIncomeStats);

export default router;

