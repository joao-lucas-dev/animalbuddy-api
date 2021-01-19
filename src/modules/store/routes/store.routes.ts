import { ObjectID } from 'mongodb';
import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import Product from '@modules/dashboard/schemas/Product';
import Review from '@modules/dashboard/schemas/Review';

import GetProductPageService from '../services/GetProductPageService';
import CreateReviewPageService from '../services/CreateReviewPageService';

const storeRouter = Router();

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
          description: '$description',
          price: '$price',
          oldPrice: '$oldPrice',
          discount: '$discount',
          variants: '$variants',
          images: '$images',
          createdAt: '$createdAt',
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

        return {
          ...item,
          images_url: arrImages,
        };
      }

      return item;
    });

    return response.json(newArrProducts);
  },
);

storeRouter.get(
  '/products/:productId',
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { productId } = request.params;

    const getProductPageService = new GetProductPageService();

    const productIdFormatted = new ObjectID(productId);

    const { product, images_url } = await getProductPageService.execute(
      productIdFormatted,
    );

    return response.json({ product, images_url });
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
  }),
  async (request, response) => {
    const { page, limit } = request.query;

    const reviews = await Review.aggregate([
      {
        $match: { status: 'approved' },
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
export default storeRouter;
