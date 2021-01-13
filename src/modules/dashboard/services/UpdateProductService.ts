import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';

import Product from '../schemas/Product';

interface IRequest {
  productId: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  isActive: boolean;
  variants: [
    {
      [key: string]: {
        [key: string]: any;
      };
    },
  ];
  product_url: string;
}

class UpdateProductService {
  async execute({
    productId,
    title,
    description,
    price,
    oldPrice,
    isActive,
    variants,
    product_url,
  }: IRequest): Promise<void> {
    const product = await Product.findOne({ _id: new ObjectID(productId) });

    if (!product) {
      throw new AppError("Product doesn't found.", 404);
    }

    await Product.updateOne(
      { _id: product._id },
      {
        title,
        description,
        price,
        oldPrice,
        isActive,
        variants,
        discount: oldPrice > price ? Number((oldPrice - price).toFixed(2)) : 0,
        product_url,
        updated_at: new Date(),
      },
    );
  }
}

export default UpdateProductService;
