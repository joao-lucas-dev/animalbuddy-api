import mongoose from 'mongoose';
import { ObjectID } from 'mongodb';

const orderSchema = new mongoose.Schema(
  {
    products: Array,

    customer_id: ObjectID,

    status: String,

    totalPrice: Number,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('Order', orderSchema);
