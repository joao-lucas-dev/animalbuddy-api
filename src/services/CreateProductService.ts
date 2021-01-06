import { getMongoRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Product from '../models/Product';

interface IRequest {
  title: string;
  description: string;
  price: number;
  oldPrice: number;
  isActive: boolean;
  color: Array<string>;
  type: Array<string>;
}

class CreateProductService {
  async execute({
    title,
    description,
    price,
    oldPrice,
    isActive,
    color,
    type,
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
      color,
      type,
      discount: oldPrice > price ? oldPrice - price : 0,
    });

    await productsRepository.save(product);

    return product;
  }
}

export default CreateProductService;
