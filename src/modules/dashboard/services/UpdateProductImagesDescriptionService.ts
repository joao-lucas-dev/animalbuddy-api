import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';
import Product from '../schemas/Product';

import Storage from '../utils/storage';

interface IRequest {
  productId: string;
  arrImages: Array<string>;
}

class UpdateProductImagesDescriptionService {
  async execute({ productId, arrImages }: IRequest): Promise<void> {
    const arrProduct = await Product.aggregate([
      {
        $match: { _id: new ObjectID(productId) },
      },
    ]);

    if (arrProduct.length <= 0) {
      throw new AppError("Product doesn't found.", 404);
    }

    const product = arrProduct[0];

    const storage = new Storage();

    if (product.images_description) {
      if (process.env.STORAGE_DRIVER === 's3') {
        await storage.deleteFilesInS3({
          productImages: product.images_description,
          bucket: 'images-all-products',
        });
      } else {
        await storage.deleteFilesInDisk(product.images_description);
      }
    }

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.saveFilesInS3({
        productImages: arrImages,
        bucket: 'images-products-description',
      });
    }

    await Product.updateOne(
      { _id: product._id },
      {
        images_description: arrImages,
        updated_at: new Date(),
      },
    );
  }
}

export default UpdateProductImagesDescriptionService;
