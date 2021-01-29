import AppError from '@shared/errors/AppError';
import Storage from '../utils/storage';

import Product, { IProduct } from '../schemas/Product';

interface IRequest {
  productId: IProduct['_id'];
  filename: string;
}

class DeleteImagesDescriptionService {
  async execute({ productId, filename }: IRequest): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found');
    }

    const storage = new Storage();

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.deleteFileInS3({
        filename,
        bucket: 'images-products-description',
      });
    } else {
      await storage.deleteFileInDisk(filename);
    }

    const newImages = product.images_description.filter(
      (img) => img !== filename,
    );

    await Product.updateOne(
      { _id: productId },
      {
        images_description: newImages,
      },
    );
  }
}

export default DeleteImagesDescriptionService;
