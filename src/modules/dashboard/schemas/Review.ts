import mongoose, { Schema, Document } from 'mongoose';

import { IProduct } from './Product';

export interface IReview extends Document {
  name: string;
  stars: number;
  feedback: string;
  product_id: IProduct['_id'];
  images: Array<string>;
  status: 'approved' | 'pending' | 'reject';
}

const reviewSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    stars: {
      type: Number,
      required: true,
    },

    feedback: {
      type: String,
      required: true,
    },

    product_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IReview>('Review', reviewSchema);
