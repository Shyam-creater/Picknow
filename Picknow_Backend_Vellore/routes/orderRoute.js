// import express from "express";
// import { isAuth } from "../middelware/isAuth.js";
// import {
//     createDirectOrder,
//     createCartOrder,
//     getUserOrders,
//     getOrderById,
//     cancelOrder,
//     getAllOrders,
//     getAllOrderss,
//     updateOrderStatus,
//     returnOrderItem,
//     getReturnProductsByid,
//     getAllReturnProducts
// } from "../controllers/orderController.js";
// import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";


// const router = express.Router();

// // Order creation routes
// router.post("/order/direct", isAuth, createDirectOrder);
// router.post("/order/cart", isAuth, createCartOrder);

// //admin routes
// router.get("/admin/orders", isAdminAuth, isAdmin, getAllOrders);
// router.get("/admin/order/:id", isAdminAuth, isAdmin, getOrderById);
// router.post("/admin/order/:id/cancel", isAdminAuth, isAdmin, cancelOrder);
// router.put("/status/:id", isAdminAuth, isAdmin, updateOrderStatus);
// // router.get("/admin/totAmountSpendByorder", isAdminAuth, isAdmin, getTotAmountSpendByorder);

// // Order management routes
// router.get("/orders", isAuth, getUserOrders);
// router.get("/order/:id", isAuth, getOrderById);
// router.post("/order/:id/cancel", isAuth, cancelOrder);
// router.post("/order/:id/return", isAuth, returnOrderItem);
// router.get("/order/:id/returns", isAuth, getReturnProductsByid);
// router.get("/admin/returns", isAdminAuth, isAdmin, getAllReturnProducts);

// //CRM
// router.get("/crm/orders",  getAllOrderss);

// export default router; 

import express from "express";
import { isAuth } from "../middelware/isAuth.js";
import {
    createDirectOrder,
    createCartOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    returnOrderItem,
    getReturnProductsByid,
    getAllReturnProducts,
    updateReturnStatus
} from "../controllers/orderController.js";
import { isAdminAuth, isAdmin } from "../middelware/isAdminAuth.js";


const router = express.Router();

// Order creation routes
router.post("/direct", isAuth, createDirectOrder);
router.post("/cart", isAuth, createCartOrder);

//admin routes
router.get("/admin/orders", isAdminAuth, isAdmin, getAllOrders);
router.get("/admin/order/:id", isAdminAuth, isAdmin, getOrderById);
router.post("/admin/order/:id/cancel", isAdminAuth, isAdmin, cancelOrder);
router.put("/status/:id", isAdminAuth, isAdmin, updateOrderStatus);
// router.get("/admin/totAmountSpendByorder", isAdminAuth, isAdmin, getTotAmountSpendByorder);

// Order management routes
router.get("/orders", isAuth, getUserOrders);
router.get("/:id", isAuth, getOrderById);
router.post("/:id/cancel", isAuth, cancelOrder);
router.post("/:id/return", isAuth, returnOrderItem);
router.get("/:id/returns", isAuth, getReturnProductsByid);
router.get("/admin/returns", isAdminAuth, isAdmin, getAllReturnProducts);
router.put("/admin/return/status", isAdminAuth, isAdmin, updateReturnStatus);

//CRM
router.get("/crm/orders", getAllOrders);

export default router;