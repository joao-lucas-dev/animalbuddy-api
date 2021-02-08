import AppError from '@shared/errors/AppError';

import Product, { IProduct } from '@modules/dashboard/schemas/Product';

import formatImages from '../utils/images';
import formatVariants from '../utils/variants';

interface IResponse {
  title: string;
  description: string;
  seoDescription: string;
  price: string;
  oldPrice: string;
  discount: string;
  images: string;
  createdAt: string;
  slug: string;
  reviews: any[];
}

class GetProductPageService {
  async execute(slug: IProduct['slug']): Promise<IResponse[]> {
    const product = await Product.aggregate([
      {
        $match: {
          slug,
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
          seoDescription: 1,
          price: 1,
          oldPrice: 1,
          discount: 1,
          images: 1,
          createdAt: 1,
          variants: 1,
          slug: 1,
          reviews: '$reviews',
        },
      },
    ]);

    if (product.length <= 0) {
      throw new AppError('Product not found.', 404);
    }

    const newArrProducts = product.map((item) => {
      const arrImages = formatImages(item.images);

      const newVariants = formatVariants(item.variants, item.discount);

      const reviewsCount = item.reviews.reduce(
        (acc: number, itemReview: any) => {
          if (itemReview.status === 'approved') return acc + 1;

          return acc;
        },
        0,
      );

      return {
        ...item,
        imagesArray:
          arrImages.length > 0
            ? new Array(Math.ceil(arrImages.length / 3))
                .fill()
                .map((_) => arrImages.splice(0, 3))
            : [],
        priceString: item.price.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        }),
        oldPriceString: item.oldPrice.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        }),
        discountString: item.discount.toLocaleString('pt-br', {
          style: 'currency',
          currency: 'BRL',
        }),
        reviewsCount,
        averageReviews:
          // eslint-disable-next-line
            item.reviews.reduce((acc: number, itemAverageReview: any) => {
            if (itemAverageReview.status === 'approved')
              return acc + itemAverageReview.stars;

            return acc;
          }, 0) / reviewsCount,
        variants: newVariants,
      };
    });

    return newArrProducts[0];
  }
}

export default GetProductPageService;
