import { ObjectID } from 'mongodb';
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    _id: ObjectID,

    title: String,

    description: String,

    images: Array,

    images_description: Array,

    price: Number,

    oldPrice: Number,

    discount: Number,

    isActive: Boolean,

    variants: Array,

    product_url: String,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('Product', productSchema);
