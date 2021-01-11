import { ObjectID } from 'mongodb';
import { getMongoRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Product from '../models/Product';

class GetProductService {
  async execute(productId: string): Promise<Product> {
    const productsRepository = getMongoRepository(Product);

    const product = await productsRepository.findOne({
      where: { _id: new ObjectID(productId) },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const newProduct = {
      ...product,
      images_url: product.images
        ? product.images.map((img) => {
            if (process.env.STORAGE_DRIVER === 's3') {
              return `https://images-all-products.s3.amazonaws.com/${img}`;
            }

            return `${process.env.APP_API_URL}/images/${img}`;
          })
        : [],
      images_description_url: product.images_description
        ? product.images_description.map((img) => {
            if (process.env.STORAGE_DRIVER === 's3') {
              return `https://images-all-products.s3.amazonaws.com/${img}`;
            }

            return `${process.env.APP_API_URL}/images/${img}`;
          })
        : [],
    };

    return newProduct;
  }
}

export default GetProductService;
