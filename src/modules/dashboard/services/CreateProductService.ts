import AppError from '@shared/errors/AppError';
import { ObjectID } from 'mongodb';

import Product, { IProduct } from '../schemas/Product';

interface IRequest {
  title: IProduct['title'];
  description: IProduct['description'];
  price: IProduct['price'];
  oldPrice: IProduct['oldPrice'];
  isActive: IProduct['isActive'];
  variants: IProduct['variants'];
  product_url: IProduct['product_url'];
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
  }: IRequest): Promise<IProduct> {
    const hasProduct = await Product.findOne({ title });

    if (hasProduct) {
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
