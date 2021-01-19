import mongoose, { Schema, Document } from 'mongoose';

interface IProduct {
  _id: Schema.Types.ObjectId;
  product_id: Schema.Types.ObjectId;
  name: string;
  qtd: number;
  price: number;
  product_url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  products: Array<IProduct>;
  customer_id: Schema.Types.ObjectId;
  status: string;
  totalPrice: number;
  payment_id: string;
  payment_type: string;
  tracking_code: string;
  email_review_sent: boolean;
}

const orderSchema = new Schema(
  {
    products: {
      type: Array,
      required: true,
    },

    customer_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    payment_id: {
      type: String,
      required: false,
    },

    payment_type: {
      type: String,
      required: false,
    },

    tracking_code: {
      type: String,
      required: false,
    },

    email_review_sent: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IOrder>('Order', orderSchema);
