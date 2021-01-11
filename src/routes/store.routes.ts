import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { getMongoRepository } from 'typeorm';

import Product from '../models/Product';

const storeRouter = Router();

storeRouter.get(
  '/',
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
      order: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit: take, order } = request.query;

    const productsRepository = getMongoRepository(Product);

    let newOrder = {};

    switch (order) {
      case 'biggestPrice':
        newOrder = {
          price: 'DESC',
        };
        break;
      case 'lowestPrice':
        newOrder = {
          price: 'ASC',
        };
        break;
      case 'recentDate':
        newOrder = {
          created_at: 'DESC',
        };
        break;
      case 'oldestDate':
        newOrder = {
          created_at: 'ASC',
        };
        break;
      default:
        break;
    }

    const products = await productsRepository.find({
      where: { isActive: true },
      order: newOrder,
      skip: Number(page) * Number(take),
      take: Number(take),
      select: [
        '_id',
        'title',
        'description',
        'price',
        'oldPrice',
        'discount',
        'variants',
        'images',
        'created_at',
      ],
    });

    const newProducts = products.map((item) => {
      if (item.images) {
        const arrImages = item.images.map((img) => {
          if (process.env.STORAGE_DRIVER === 's3') {
            return `https://images-all-products.s3.amazonaws.com/${img}`;
          }

          return `${process.env.APP_API_URL}/images/${img}`;
        });

        return {
          ...item,
          images: arrImages,
        };
      }

      return item;
    });

    return response.json(newProducts);
  },
);

export default storeRouter;
