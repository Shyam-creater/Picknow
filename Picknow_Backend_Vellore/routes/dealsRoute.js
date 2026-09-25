import express from "express";
import { adddeals, getAlldeals, getdealsById, updatedeals, deletedeals } from "../controllers/DealsControllers.js";
import { isAdminAuth } from "../middelware/isAdminAuth.js";
import { uploadDealsImage, handleDealsMulterError } from "../middelware/dealsMulter.js";

const router = express.Router();

router.post('/add/deals', isAdminAuth, uploadDealsImage, handleDealsMulterError, adddeals);
router.get('/all/deals', getAlldeals);
router.get('/deals/:dealsId', getdealsById);
router.put('/update/deals/:dealsId', isAdminAuth, uploadDealsImage, handleDealsMulterError, updatedeals);
router.delete('/delete/deals/:dealsId', isAdminAuth, deletedeals);

export default router; 