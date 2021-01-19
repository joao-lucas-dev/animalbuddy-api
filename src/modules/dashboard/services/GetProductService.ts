import AppError from '@shared/errors/AppError';

import Product, { IProduct } from '../schemas/Product';

interface IProductWithImagesUrls {
  product: IProduct;
  images_url: Array<string>;
  images_description_url: Array<string>;
}
class GetProductService {
  async execute(productId: IProduct['_id']): Promise<IProductWithImagesUrls> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    return {
      product,
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
  }
}

export default GetProductService;
