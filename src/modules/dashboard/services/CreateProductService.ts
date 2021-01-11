import { getMongoRepository } from 'typeorm';

import AppError from '@shared/errors/AppError';

import Product from '../entities/Product';

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
  }: IRequest): Promise<Product> {
    const productsRepository = getMongoRepository(Product);

    const hasProduct = await productsRepository.findOne({ where: { title } });

    if (hasProduct) {
      throw new AppError('Product already created.', 404);
    }

    const product = productsRepository.create({
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
      discount: oldPrice > price ? oldPrice - price : 0,
      product_url,
    });

    await productsRepository.save(product);

    return product;
  }
}

export default CreateProductService;
