import Razorpay from "razorpay";
const instance = new Razorpay({
  // key_id: "rzp_test_ONJwUuwS2StVVR", //test
  key_id: "rzp_live_MigiyKCfLulpBY", //Live
  // key_secret: "4BHJGpBdDdJvhs0g7Bzvvi2B", //test
  key_secret: "B7nYrHQma2fcEl8AZPdKFP4W", //LIVE
});

import crypto from 'crypto';

import razorpayModel from "../models/razorPay.js";
export const checkout = async (req, res) => {
  try {
    const { amount } = req.body;
    const option = {
      amount: +amount * 100,
      currency: "INR",
    };
    const order = await instance.orders.create(option);

    console.log(`order----14-----,paymentCtrl------>`, order);
    // req.user._id
    razorpayModel.create({
      user: req.user._id,
      amount: order.amount / 100,
      created_at: order.created_at,
      orderId: order.id,
      status: order.status,
    })
    res.json({
      success: true,
      order,
    });
  } catch (error) {

    console.log(`error----23-----,paymentCtrl------>`, error);
    res.status(500).json({ message: "Something went wrong", error: error })
  }

};

export const paymentVerification = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  try {
    // Create Sign
    const sign = razorpayOrderId + "|" + razorpayPaymentId;

    // Create ExpectedSign
    const expectedSign = crypto.createHmac("sha256", 'B7nYrHQma2fcEl8AZPdKFP4W')
      .update(sign.toString())
      .digest("hex");

    // Create isAuthentic
    const isAuthentic = expectedSign === razorpaySignature;

    // Condition 
    if (isAuthentic) {
      // Send Message 
      res.json({
        status: true,
        message: "Payment Successfully"
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  }

};


//refund
export const refund = async (req, res) => {
  const { orderId } = req.params;
  const { amount } = req.body;

  try {
    const order = await order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    } 

    const refund = await instance.payments.refund({
      payment_id: order.paymentId,
      amount: amount,
      speed: "normal",
    }); 
    console.log(`refund----107-----,paymentCtrl------>`, refund);
    res.status(200).json({
      success: true,
      refund
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error!" });
    console.log(error);
  } 
}

