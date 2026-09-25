import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    returnedItems: [
      { 
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariant",
        },
        quantity: Number,
        reason: String,
        requestedAt: { type: Date, default: Date.now },
        refundedAt: Date,
      },
    ],
    items: { type: Array },
    returnStatus: { type: Boolean, default: false },
    shippingAddress: {
      name: { type: String },

      address: {
        type: String
        // required: true
      },
      contact: {
        type: String
      },

      PaymentId: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        // required: true
      },
      pincode: {
        type: String,
        // required: true,
      },
      country: {
        type: String,
        default: "India",
      },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY", "VOUCHER", "RAZORPAY/VOUCHER"],
      // required: true
      default: "RAZORPAY",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: [
        "ORDER PLACED",
        "CONFIRMED",
        "SHIPPED",
        "DISPATCHED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "ORDER PLACED",
    },
    trackingInfo:{
      trackingNumber: String,
    },
    PaymentId: { type: String, default: "" },
    totalAmount: {
      type: Number,
      required: true,
    },
    kaitCoinsUsed: {
      type: Number,
      default: 0,
    },
    useKaitCoins: {
      type: Boolean,
      default: false,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    orderNotes: String,
    refundStatus: {
      type: String,
    },
    refundId: String,
       reviewmade: {
      type: Boolean,
      required: false,
    },
    cashPayment: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
