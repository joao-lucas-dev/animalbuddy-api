import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';
import Storage from '../utils/storage';

import Product from '../schemas/Product';

class DeleteProductService {
  async execute(productId: string): Promise<void> {
    const arrProduct = await Product.aggregate([
      {
        $match: { _id: new ObjectID(productId) },
      },
    ]);

    if (arrProduct.length <= 0) {
      throw new AppError('Product not found.', 404);
    }

    const product = arrProduct[0];

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

    await Product.deleteOne({ _id: new ObjectID(productId) });
  }
}

export default DeleteProductService;
