import AppError from '@shared/errors/AppError';
import Product, { IProduct } from '../schemas/Product';

import Storage from '../utils/storage';

interface IRequest {
  productId: IProduct['_id'];
  images: IProduct['images'];
}

class UpdateProductImagesService {
  async execute({ productId, images }: IRequest): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const storage = new Storage();

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.saveFilesInS3({
        images,
        bucket: 'images-all-products',
      });
    }

    const newImages = [...product.images, ...images];

    await Product.updateOne(
      { _id: product._id },
      {
        images: newImages,
        updated_at: new Date(),
      },
    );
  }
}

export default UpdateProductImagesService;
