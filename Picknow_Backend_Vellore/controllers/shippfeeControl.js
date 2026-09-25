import mongoose from "mongoose";
import { shippingFee } from "../models/shipfee";

// const addshipfee = async (req, res) => {
//   try {
//     if (!req.user || !req.user.role) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required"
//       });
//     }

//     // Check if user has appropriate role
//     if (req.user.role !== "admin" && req.user.role !== "super_admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized Access"
//       });
//     }
//     const { state, productfee, comboofee } = req.body;
//     const newShipfee = new Shipfee({
//       state,
//       productfee,
//       comboofee,
//       created_at: new Date(),
//     });
//   } catch (err) {

//   }
// }

export const getshipfee = async (req, res) => {
  var data = await shippingFee.find().exec()
  return res.status(200).json({
    success: true,
    data
  });
} 