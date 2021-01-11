import { ObjectID } from 'mongodb';
import { getMongoRepository } from 'typeorm';

import Storage from '../utils/storage';

import AppError from '../errors/AppError';

import Product from '../models/Product';

class DeleteProductService {
  async execute(productId: string): Promise<void> {
    const productsRepository = getMongoRepository(Product);

    const product = await productsRepository.findOne({
      where: { _id: new ObjectID(productId) },
    });

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const storage = new Storage();

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.deleteFilesInS3({
        productImages: product.images,
        bucket: 'images-all-products',
      });

      await storage.deleteFilesInS3({
        productImages: product.images,
        bucket: 'images-products-description',
      });
    } else {
      await storage.deleteFilesInDisk(product.images);

      await storage.deleteFilesInDisk(product.images_description);
    }

    await productsRepository.deleteOne({ _id: new ObjectID(productId) });
  }
}

export default DeleteProductService;
