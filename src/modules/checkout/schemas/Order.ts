import mongoose from 'mongoose';
import { ObjectID } from 'mongodb';

const orderSchema = new mongoose.Schema(
  {
    products: Array,

    customer_id: ObjectID,

    status: String,

    totalPrice: Number,

    payment_id: String,

    payment_type: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('Order', orderSchema);
