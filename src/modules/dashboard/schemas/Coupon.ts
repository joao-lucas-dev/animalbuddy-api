import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  name: string;
  value: string;
  isActive: boolean;
  createdAt: string;
}

const couponSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<ICoupon>('Coupon', couponSchema);
