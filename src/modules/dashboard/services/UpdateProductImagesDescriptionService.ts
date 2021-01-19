import AppError from '@shared/errors/AppError';
import Product, { IProduct } from '../schemas/Product';

import Storage from '../utils/storage';

interface IRequest {
  productId: IProduct['_id'];
  images: IProduct['images_description'];
}

class UpdateProductImagesDescriptionService {
  async execute({ productId, images }: IRequest): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product doesn't found.", 404);
    }

    const storage = new Storage();

    if (product.images_description) {
      if (process.env.STORAGE_DRIVER === 's3') {
        await storage.deleteFilesInS3({
          images: product.images_description,
          bucket: 'images-all-products',
        });
      } else {
        await storage.deleteFilesInDisk(product.images_description);
      }
    }

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.saveFilesInS3({
        images,
        bucket: 'images-products-description',
      });
    }

    await Product.updateOne(
      { _id: product._id },
      {
        images_description: images,
        updated_at: new Date(),
      },
    );
  }
}

export default UpdateProductImagesDescriptionService;
