import AppError from '@shared/errors/AppError';

import Product, { IProduct } from '@modules/dashboard/schemas/Product';

interface IResponse {
  product: IProduct;
  images_url: Array<string>;
}

class GetProductPageService {
  async execute(productId: IProduct['_id']): Promise<IResponse> {
    const product = await Product.aggregate([
      {
        $match: {
          _id: productId,
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product_id',
          as: 'reviews',
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          images: 1,
          price: 1,
          oldPrice: 1,
          discount: 1,
          variants: 1,
          reviews: '$reviews._id',
        },
      },
    ]);

    if (product.length <= 0) {
      throw new AppError('Product not found.', 404);
    }

    return {
      product: product[0],
      images_url: product[0].images
        ? product[0].images.map((img: any) => {
            if (process.env.STORAGE_DRIVER === 's3') {
              return `https://images-all-products.s3.amazonaws.com/${img}`;
            }

            return `${process.env.APP_API_URL}/images/${img}`;
          })
        : [],
    };
  }
}

export default GetProductPageService;
