
import mongoose from 'mongoose';

const shipfeeModel = new mongoose.Schema({
    state: {
        type: String,
        require: true
    },
    productdeliveryfee: {
        type: Number,
        require: true
    },
    combodeliveryfee: {
        type: Number,
        require: true
    },
    above500_deliveryfee: {
        type: Number,
        require: true
    },
    above_1kg_deliveryfee: {
        type: Number,
        require: true
    },
    
    created_at: { type: Date },

}, { timestamps: true });

export const shipfeeModelSchema = mongoose.model('Shipfee', shipfeeModel);
