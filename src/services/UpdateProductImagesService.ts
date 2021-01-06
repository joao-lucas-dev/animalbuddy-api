import { getMongoRepository } from 'typeorm';
import path from 'path';
import fs from 'fs';
import { ObjectID } from 'mongodb';

import AppError from '../errors/AppError';

import uploadConfig from '../config/upload';
import Product from '../models/Product';

interface IObjImage {
  filename: string;
}

interface IRequest {
  productId: string;
  arrImagesFilename: Array<IObjImage>;
}

class UpdateProductImagesService {
  async execute({ productId, arrImagesFilename }: IRequest): Promise<Product> {
    const productsRepository = getMongoRepository(Product);

    const product = await productsRepository.findOne({
      where: { _id: new ObjectID(productId) },
    });

    if (!product) {
      throw new AppError('Product does not found', 404);
    }

    if (product.images) {
      await Promise.all(
        product.images.map(async (img) => {
          const imageFilePath = path.resolve(
            uploadConfig.directory,
            img.filename,
          );

          const imageFileExists = await fs.promises.stat(imageFilePath);

          if (imageFileExists) {
            await fs.promises.unlink(imageFilePath);
          }
        }),
      );
    }

    product.images = arrImagesFilename;

    await productsRepository.save(product);

    return product;
  }
}

export default UpdateProductImagesService;
