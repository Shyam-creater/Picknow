import mongoose from 'mongoose';
// const { ObjectId } = mongoose.Schema.Types;

const dealsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'products',
      required: true
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: false
    },
    dealPrice: {
      type: Number,
      required: true,
      min: [0, 'Deal price must be greater than or equal to 0']
    },
    dealDiscount: {
      type: Number,
      required: true,
      min: [0, 'Deal discount must be greater than or equal to 0'],
      max: [100, 'Deal discount cannot exceed 100%']
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add index for better query performance
dealsSchema.index({ 'products.product': 1 });
dealsSchema.index({ status: 1 });
dealsSchema.index({ startDate: 1, endDate: 1 });

export const deals = mongoose.model('Deals', dealsSchema); 