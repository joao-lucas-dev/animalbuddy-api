import { ObjectID } from 'mongodb';
import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import multer from 'multer';
import uploadConfig from '@config/upload';

import Product from '@modules/dashboard/schemas/Product';
import Review from '@modules/dashboard/schemas/Review';

import countRangeParcentage from '../utils/reviews';

import GetProductPageService from '../services/GetProductPageService';
import CreateReviewPageService from '../services/CreateReviewPageService';
import UpdateReviewImagesPageService from '../services/UpdateReviewImagesPageService';
import GetCouponService from '../services/GetCouponService';

const storeRouter = Router();
const upload = multer(uploadConfig);

/**
 * Products
 */

storeRouter.get(
  '/products',
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
      order: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit, order } = request.query;

    let newOrder = {};

    switch (order) {
      case 'biggestPrice':
        newOrder = {
          price: -1,
        };
        break;
      case 'lowestPrice':
        newOrder = {
          price: 1,
        };
        break;
      case 'recentDate':
        newOrder = {
          createdAt: -1,
        };
        break;
      case 'oldestDate':
        newOrder = {
          createdAt: 1,
        };
        break;
      default:
        break;
    }

    const products = await Product.aggregate([
      {
        $match: {
          isActive: true,
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
          price: 1,
          oldPrice: 1,
          discount: 1,
          images: 1,
          createdAt: 1,
          slug: 1,
          reviews: '$reviews',
        },
      },
      {
        $sort: {
          ...newOrder,
        },
      },
      {
        $skip: Number(page) * Number(limit),
      },
      {
        $limit: Number(limit),
      },
      {
        $project: {
          _id: '$_id',
          title: '$title',
          price: '$price',
          oldPrice: '$oldPrice',
          discount: '$discount',
          images: '$images',
          createdAt: '$createdAt',
          slug: '$slug',
          reviews: '$reviews',
        },
      },
    ]);

    const newArrProducts = products.map((item) => {
      if (item.images) {
        const arrImages = item.images.map((img: any) => {
          if (process.env.STORAGE_DRIVER === 's3') {
            return `https://images-all-products.s3.amazonaws.com/${img}`;
          }

          return `${process.env.APP_API_URL}/images/${img}`;
        });

        const reviewsCount = item.reviews.reduce(
          (acc: number, itemReview: any) => {
            if (itemReview.status === 'approved') return acc + 1;

            return acc;
          },
          0,
        );

        return {
          ...item,
          images_url: arrImages,
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
          imageName: arrImages.length > 0 ? arrImages[0].split('_')[1] : '',
          reviewsCount,
          averageReviews:
            // eslint-disable-next-line
            item.reviews.reduce((acc: number, itemAverageReview: any) => {
              if (itemAverageReview.status === 'approved')
                return acc + itemAverageReview.stars;

              return acc;
            }, 0) / reviewsCount,
        };
      }

      return item;
    });

    return response.json(newArrProducts);
  },
);

storeRouter.get(
  '/products/:slug',
  celebrate({
    [Segments.PARAMS]: {
      slug: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { slug } = request.params;

    const getProductPageService = new GetProductPageService();

    const product = await getProductPageService.execute(slug);

    return response.json(product);
  },
);

/**
 * Reviews
 */

storeRouter.get(
  '/products/:productId/reviews',
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
    },
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit } = request.query;
    const { productId } = request.params;

    const reviews = await Review.aggregate([
      {
        $match: { product_id: new ObjectID(productId), status: 'approved' },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $skip: Number(page) * Number(limit),
      },
      {
        $limit: Number(limit),
      },
      {
        $project: {
          _id: 1,
          name: 1,
          stars: 1,
          state: 1,
          images: 1,
          feedback: 1,
          updatedAt: 1,
        },
      },
    ]);

    const rangeFivePercentage = countRangeParcentage(reviews, 5);
    const rangeFourPercentage = countRangeParcentage(reviews, 4);
    const rangeThreePercentage = countRangeParcentage(reviews, 3);
    const rangeTwoPercentage = countRangeParcentage(reviews, 2);
    const rangeOnePercentage = countRangeParcentage(reviews, 1);

    return response.json({
      reviews: reviews.map((item) => {
        if (item.images) {
          const arrImages = item.images.map((img: any) => {
            if (process.env.STORAGE_DRIVER === 's3') {
              return `https://reviews-images.s3.amazonaws.com/${img}`;
            }

            return `${process.env.APP_API_URL}/images/${img}`;
          });

          return {
            ...item,
            images_url: arrImages,
          };
        }

        return item;
      }),
      rangeParcentage: {
        five: rangeFivePercentage,
        four: rangeFourPercentage,
        three: rangeThreePercentage,
        two: rangeTwoPercentage,
        one: rangeOnePercentage,
      },
    });
  },
);

storeRouter.get(
  '/products/:productId/reviews/ranges',
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { productId } = request.params;

    const reviews = await Review.aggregate([
      {
        $match: { product_id: new ObjectID(productId), status: 'approved' },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          stars: 1,
          state: 1,
          images: 1,
          feedback: 1,
          updatedAt: 1,
        },
      },
    ]);

    const rangeFivePercentage = countRangeParcentage(reviews, 5);
    const rangeFourPercentage = countRangeParcentage(reviews, 4);
    const rangeThreePercentage = countRangeParcentage(reviews, 3);
    const rangeTwoPercentage = countRangeParcentage(reviews, 2);
    const rangeOnePercentage = countRangeParcentage(reviews, 1);

    return response.json({
      rangeParcentage: {
        five: rangeFivePercentage,
        four: rangeFourPercentage,
        three: rangeThreePercentage,
        two: rangeTwoPercentage,
        one: rangeOnePercentage,
      },
    });
  },
);

storeRouter.get(
  '/products/:productId/reviews/stars/:stars',
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
    },
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
      stars: Joi.number().required(),
    },
  }),
  async (request, response) => {
    const { page, limit } = request.query;
    const { productId, stars } = request.params;

    const reviews = await Review.aggregate([
      {
        $match: {
          product_id: new ObjectID(productId),
          status: 'approved',
          stars,
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $skip: Number(page) * Number(limit),
      },
      {
        $limit: Number(limit),
      },
      {
        $project: {
          _id: 1,
          name: 1,
          stars: 1,
          state: 1,
          images: 1,
          feedback: 1,
          updatedAt: 1,
        },
      },
    ]);

    return response.json({
      reviews: reviews.map((item) => {
        if (item.images) {
          const arrImages = item.images.map((img: any) => {
            if (process.env.STORAGE_DRIVER === 's3') {
              return `https://reviews-images.s3.amazonaws.com/${img}`;
            }

            return `${process.env.APP_API_URL}/images/${img}`;
          });

          return {
            ...item,
            images_url: arrImages,
          };
        }

        return item;
      }),
    });
  },
);

storeRouter.post(
  '/products/:productId/reviews',
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      stars: Joi.number().required(),
      feedback: Joi.string().required(),
      state: Joi.string().required(),
    },
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { name, stars, feedback, state } = request.body;
    const { productId } = request.params;

    const createReviewPageService = new CreateReviewPageService();

    const review = await createReviewPageService.execute({
      productId: new ObjectID(productId),
      name,
      stars,
      feedback,
      state,
    });

    return response.json(review);
  },
);

storeRouter.patch(
  '/reviews/:reviewId/images',
  celebrate({
    [Segments.PARAMS]: {
      reviewId: Joi.string().required(),
    },
  }),
  upload.array('review_images'),
  async (request, response) => {
    const { reviewId } = request.params;
    const { files } = request;

    const images: Array<string> = files.map((img: any) => {
      return `${img.filename}`;
    });

    const updateReviewImagesPageService = new UpdateReviewImagesPageService();

    await updateReviewImagesPageService.execute({
      review_id: new ObjectID(reviewId),
      images,
    });

    return response.send();
  },
);

/**
 * Coupon
 */

storeRouter.get(
  '/coupons/:couponName',
  celebrate({
    [Segments.PARAMS]: {
      couponName: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { couponName } = request.params;

    const getCouponService = new GetCouponService();

    const coupon = await getCouponService.execute(couponName);

    return response.json({ name: coupon.name, value: coupon.value });
  },
);

export default storeRouter;
