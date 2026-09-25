import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brands } from '../models/Brand.js';

dotenv.config();

const brandId = '68d61bf62208677bdd1c4be9';

const checkBrand = async () => {
    try {
        await mongoose.connect(process.env.DB);
        console.log('Connected to MongoDB');

        const brand = await Brands.findById(brandId);
        if (brand) {
            console.log('Brand found:', JSON.stringify(brand, null, 2));
        } else {
            console.log('Brand not found for ID:', brandId);
            
            // Search by ID without findById to see if there's a casting issue
            const allBrands = await Brands.find().limit(5);
            console.log('Sample brands in DB:', JSON.stringify(allBrands, null, 2));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkBrand();
