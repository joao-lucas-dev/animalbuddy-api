import AppError from '@shared/errors/AppError';
import Storage from '../utils/storage';

import Product, { IProduct } from '../schemas/Product';
import Review from '../schemas/Review';

class DeleteProductService {
  async execute(productId: IProduct['_id']): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const reviews = await Review.find({ product_id: productId });

    const allImagesReview: Array<string> = [];

    reviews.forEach((item) => {
      allImagesReview.push(...item.images);
    });

    const storage = new Storage();

    if (process.env.STORAGE_DRIVER === 's3') {
      if (product.images.length > 0)
        await Promise.all(
          product.images.map(async (img) => {
            await storage.deleteFileInS3({
              filename: img,
              bucket: 'images-all-products',
            });
          }),
        );

      if (product.images_description.length > 0)
        await Promise.all(
          product.images_description.map(async (img) => {
            await storage.deleteFileInS3({
              filename: img,
              bucket: 'images-products-description',
            });
          }),
        );

      if (allImagesReview.length > 0)
        await Promise.all(
          allImagesReview.map(async (img) => {
            await storage.deleteFileInS3({
              filename: img,
              bucket: 'reviews-images',
            });
          }),
        );
    } else {
      if (product.images.length > 0)
        await Promise.all(
          product.images.map(async (img) => {
            await storage.deleteFileInDisk(img);
          }),
        );

      if (product.images_description.length > 0)
        await Promise.all(
          product.images_description.map(async (img) => {
            await storage.deleteFileInDisk(img);
          }),
        );

      if (allImagesReview.length > 0)
        await Promise.all(
          allImagesReview.map(async (img) => {
            await storage.deleteFileInDisk(img);
          }),
        );
    }

    await Review.deleteMany({ product_id: productId });

    await Product.deleteOne({ _id: productId });
  }
}

export default DeleteProductService;
