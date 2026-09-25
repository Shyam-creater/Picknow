import express from "express";
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";
import { uploadComboFiles } from "../middelware/comboMulter.js";
import { uploadFiles2 } from "../middelware/categoryMulter.js";
import {
    createCombo,
    getAllCombos,
    getComboById,
    updateCombo,
    deleteCombo,
    getProductsByCombo
} from "../controllers/comboController.js";

const router = express.Router();

// Admin routes (protected)
router.post("/admin/combo/create", isAdminAuth, isAdmin, uploadFiles2, createCombo);
router.get("/admin/combo/all", isAdminAuth, isAdmin, getAllCombos);
router.get("/admin/combo/:id", isAdminAuth, isAdmin, getComboById);
router.put("/admin/combo/update", isAdminAuth, isAdmin, uploadFiles2, updateCombo);
router.delete("/admin/combo/delete", isAdminAuth, isAdmin, deleteCombo);

//public routes
router.get("/combo/all", getAllCombos);
router.get("/combo/:id", getComboById);
router.get("/combo/:id/products", getProductsByCombo);

export default router; 