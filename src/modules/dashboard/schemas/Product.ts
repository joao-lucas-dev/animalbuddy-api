import { ObjectID } from 'mongodb';
import mongoose, { Schema, Document } from 'mongoose';

interface IVariant {
  // eslint-disable-next-line
  [key: string]: any;
}
export interface IProduct extends Document {
  _id: ObjectID;
  title: string;
  description?: string;
  images: Array<string>;
  images_description: Array<string>;
  price: number;
  oldPrice: number;
  discount: number;
  isActive: boolean;
  variants: Array<IVariant>;
  product_url: string;
  seoDescription: string;
  slug: string;
}

const productSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: false,
      default: '',
    },

    images: [
      {
        type: String,
      },
    ],

    images_description: [
      {
        type: String,
      },
    ],

    price: {
      type: Number,
      required: true,
    },

    oldPrice: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      required: true,
    },

    isActive: {
      type: Boolean,
      required: true,
    },

    variants: {
      type: Array,
      required: true,
    },

    product_url: {
      type: String,
      required: true,
    },

    seoDescription: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: false,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<IProduct>('Product', productSchema);
