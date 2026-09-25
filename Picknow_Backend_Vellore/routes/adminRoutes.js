import express from "express";
import { 
    registerAdmin, 
    loginAdmin, 
    myProfile,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin 
} from "../controllers/adminController.js";

const router = express.Router();

// Admin management routes
router.get("/users", getAllAdmins);
router.post("/users", createAdmin);
router.put("/users/:id", updateAdmin);
router.delete("/users/:id", deleteAdmin);

// Auth routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", myProfile);

export default router; 