import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: ObjectId,
      ref: "products",
      required: true,
    },

    attributes: {
      size: { type: String },     // Shoes / Dress → "7", "M"
      color: { type: String },    // Shoes / Dress → "Red"
      weight: { type: String },
      shoe: { type: String },
      belt: { type: String },  // Rice → "500gm", "1kg"
      hex: { type: String }    // Rice → "500gm", "1kg"
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock must be greater than or equal to 0"],
    },
    totalStock: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Total stock must be greater than or equal to 0"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be greater than 0"],
    },
    previousPrice: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Previous price must be greater than or equal to 0"],
    },
    offer: {
      type: Number,
      required: false,
      default: 0,
      min: [0, "Offer must be greater than or equal to 0"],
    },
    pvCanonicalUrl: {
      type: String,
      required: true,
    },
    pvSchemaMarkup: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    min: {
      type: Number,
      default: 1,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Add index for productId to improve query performance
productVariantSchema.index(
  {
    productId: 1,
    "attributes.size": 1,
    "attributes.color": 1,
    "attributes.weight": 1,
    "attributes.shoe": 1,
    "attributes.belt": 1,
  },
  { unique: true }
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
