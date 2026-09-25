import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: { type: Number, default: 0 },
    created_at: { type: Date },
    orderId: { type: String, default: '' },
    status: { type: String, default: '' }
}, { timestamps: true });


const razorpayModel = mongoose.model("Razorpayorder", cartSchema);
export default razorpayModel;
