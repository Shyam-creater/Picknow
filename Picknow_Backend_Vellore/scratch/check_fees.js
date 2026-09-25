import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const shipfeeSchema = new mongoose.Schema({
  state: String,
  productdeliveryfee: Number,
  above500_deliveryfee: Number,
  combodeliveryfee: Number
}, { strict: false });

const Shipfee = mongoose.model('shipfees', shipfeeSchema);

async function check() {
  try {
    await mongoose.connect(process.env.DB);
    const fees = await Shipfee.find();
    console.log('Fees:', JSON.stringify(fees, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
