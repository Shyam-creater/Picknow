import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const productSchema = new mongoose.Schema({
  pName: String,
  freeshipping: Boolean
}, { strict: false });

const Product = mongoose.model('products', productSchema);

async function check() {
  try {
    await mongoose.connect(process.env.DB);
    const productName = process.argv[2] || 'Orange Peel Powder';
    const p = await Product.findOne({ pName: new RegExp(productName, 'i') });
    console.log('Product Found:', JSON.stringify(p, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
