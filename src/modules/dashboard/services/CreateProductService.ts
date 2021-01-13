import AppError from '@shared/errors/AppError';
import { ObjectID } from 'mongodb';

import Product from '../schemas/Product';

interface IRequest {
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

class CreateProductService {
  async execute({
    title,
    description,
    price,
    oldPrice,
    isActive,
    variants,
    product_url,
  }: IRequest): Promise<any> {
    const hasProduct = await Product.aggregate([
      {
        $match: {
          title,
        },
      },
    ]);

    if (hasProduct.length > 0) {
      throw new AppError('Product already created.', 404);
    }

    const product = await Product.create({
      _id: new ObjectID(),
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
      discount: oldPrice > price ? oldPrice - price : 0,
      product_url,
    });

    return product;
  }
}

export default CreateProductService;
