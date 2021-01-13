import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';

import Product from '../schemas/Product';

class GetProductService {
  async execute(productId: string): Promise<any> {
    const arrProduct = await Product.aggregate([
      {
        $match: {
          _id: new ObjectID(productId),
        },
      },
    ]);

    if (!arrProduct) {
      throw new AppError('Product not found.', 404);
    }

    const product = arrProduct[0];

    const newProduct = {
      ...product,
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

    return newProduct;
  }
}

export default GetProductService;
