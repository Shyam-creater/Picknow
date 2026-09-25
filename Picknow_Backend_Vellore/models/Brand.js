import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  logo: {
    type: String,
    required: [true, 'Brand logo is required'],
  },
    name: {
    type: String,
    required: [true, 'Brand name is required'],
  },
},
  {timestamps: true });

export const Brands = mongoose.model("Brand", brandSchema);