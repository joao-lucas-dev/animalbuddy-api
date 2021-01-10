import { getMongoRepository } from 'typeorm';
import { ObjectID } from 'mongodb';

import AppError from '../errors/AppError';
import Product from '../models/Product';

import Storage from '../utils/storage';

interface IObjImage {
  filename: string;
}

interface IRequest {
  productId: string;
  arrImagesFilename: Array<IObjImage>;
  type?: string;
}

class UpdateProductImagesService {
  async execute({
    productId,
    arrImagesFilename,
    type = '',
  }: IRequest): Promise<Product> {
    const productsRepository = getMongoRepository(Product);

    const product = await productsRepository.findOne({
      where: { _id: new ObjectID(productId) },
    });

    if (!product) {
      throw new AppError("Product doesn't found.", 404);
    }

    const storage = new Storage();

    if (type === 'description') {
      if (product.images_description) {
        await storage.deleteFiles({
          productImages: product.images_description,
          bucket: 'images-products-description',
        });
      }

      await storage.saveFiles({
        productImages: arrImagesFilename,
        bucket: 'images-products-description',
      });

      product.images_description = arrImagesFilename;
    } else {
      if (product.images) {
        await storage.deleteFiles({
          productImages: product.images,
          bucket: 'images-all-products',
        });
      }

      await storage.saveFiles({
        productImages: arrImagesFilename,
        bucket: 'images-all-products',
      });

      product.images = arrImagesFilename;
    }

    product.updated_at = new Date();

    await productsRepository.save(product);

    return product;
  }
}

export default UpdateProductImagesService;
