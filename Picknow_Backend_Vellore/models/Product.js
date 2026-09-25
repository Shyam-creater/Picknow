import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const productSchema = new mongoose.Schema(
  {
    pName: {
      type: String,
      required: true,
    },
    pShortDescription: {
      type: String,
      required: true,
    },
    pDescription: {
      type: String,
      required: true,
    },
    pImage: {
      type: Array,
      required: true,
    },
    pStatus: {
      type: String,
      required: true,
    },
    pCategory: {
      type: String,
      required: true,
    },
    pSubCategory: {
      type: String,
      required: false,
    },
    pNestedSubCategory: {
      type: String,
      required: false,
    },
    pPrice: {
      type: Number,
      required: true,
    },
    pPreviousPrice: {
      type: Number,
      required: false,
      default: 0,
    },
    pOffer: {
      type: Number,
      required: true,
      default: 0,
    },
    pTax: {
      type: Number,
      required: true,
      default: 5,
    },
    pBrand: {
      type: String,
      required: true,
    },
    pStock: {
      type: Number,
      required: true,
      default: 0,
    },
    pQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    pReturn: {
      type: Boolean,
      default: false
    },
    pReturnDays: {
      type: Number,
      required: false,
    },
    pRatingsReviews: [
      {
        user: {
          type: ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: String,
          required: true,
        },
        review: {
          type: String,
          required: true,
        },
        image: {
          type: Array, // Array of URLs or filenames for the uploaded images/videos
          required: false,
          default: []
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    pWishlist: [
      {
        user: {
          type: ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    createdBy: {
      type: String,
      required: false,
    },
    vendorId: {
      type: ObjectId,
      ref: "vendors",
      required: false,
    },
    editedBy: {
      type: String,
      default: "Not Edited",
      required: false,
    },
    variants: [{
      type: ObjectId,
      ref: "ProductVariant"
    }],
    pType: {
      type: String,
      default: 'product'
    },
    pis_voucher_50: {
      type: Boolean,
      default: false
    },
    pis_voucher_100: {
      type: Boolean,
      default: false
    },
    freeshipping: {
      type: Boolean,
      default: false
    },
    pMetaTitle: {
      type: String,
      required: false,
    },
    pMetaKeywords: {
      type: String,
      required: false,
    },
    pMetaDescription: {
      type: String,
      required: false,
    },
    pCanonicalUrl: {
      type: String,
      required: false,
    },
    pUrl: {
      type: String,
      required: false,
    },
    schemaMarkup: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

const productModel = mongoose.model("products", productSchema);
export default productModel;
