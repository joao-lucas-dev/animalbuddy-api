import { getMongoRepository } from 'typeorm';
import { ObjectID } from 'mongodb';

import AppError from '../errors/AppError';

import Product from '../models/Product';

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
  }: IRequest): Promise<Product> {
    const productsRepository = getMongoRepository(Product);

    const product = await productsRepository.findOne({
      where: { _id: new ObjectID(productId) },
    });

    if (!product) {
      throw new AppError("Product doesn't found.", 404);
    }

    product.title = title;
    product.description = description;
    product.price = price;
    product.oldPrice = oldPrice;
    product.isActive = isActive;
    product.variants = variants;
    product.discount =
      oldPrice > price ? Number((oldPrice - price).toFixed(2)) : 0;
    product.product_url = product_url;
    product.updated_at = new Date();

    await productsRepository.save(product);

    return product;
  }
}

export default UpdateProductService;
