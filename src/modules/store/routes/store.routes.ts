import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import Product from '@modules/dashboard/schemas/Product';

const storeRouter = Router();

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

export default storeRouter;
