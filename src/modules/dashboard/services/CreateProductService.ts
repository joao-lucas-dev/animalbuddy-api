import AppError from '@shared/errors/AppError';
import { ObjectID } from 'mongodb';

import Product, { IProduct } from '../schemas/Product';

interface IRequest {
  title: IProduct['title'];
  price: IProduct['price'];
  oldPrice: IProduct['oldPrice'];
  isActive: IProduct['isActive'];
  variants: IProduct['variants'];
  product_url: IProduct['product_url'];
  seoDescription: IProduct['seoDescription'];
}

class CreateProductService {
  async execute({
    title,
    price,
    oldPrice,
    isActive,
    variants,
    product_url,
    seoDescription,
  }: IRequest): Promise<IProduct> {
    const hasProduct = await Product.findOne({ title });

    if (hasProduct) {
      throw new AppError('Product already created.', 404);
    }

    const titleLower = title.toLocaleLowerCase();

    const slug = titleLower.split(' ').join('-');

    const product = await Product.create({
      _id: new ObjectID(),
      title,
      price,
      oldPrice,
      isActive,
      variants,
      discount: oldPrice > price ? oldPrice - price : 0,
      product_url,
      seoDescription,
      slug,
    });

    return product;
  }
}

export default CreateProductService;
