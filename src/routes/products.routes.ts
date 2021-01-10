import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { getMongoRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';

import enseureAuthenticated from '../middlewares/ensureAuthenticated';

import Product from '../models/Product';
import CreateProductService from '../services/CreateProductService';
import UpdateProductImagesService from '../services/UpdateProductImagesService';
import UpdateProductService from '../services/UpdateProductService';

const productsRouter = Router();
const upload = multer(uploadConfig);

productsRouter.get(
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
    });

    return response.json(products);
  },
);

productsRouter.get(
  '/list',
  enseureAuthenticated,
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
      order: Joi.string().required(),
      isActive: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit: take, order, isActive } = request.query;

    const productsRepository = getMongoRepository(Product);

    let newOrder = {};

    switch (order) {
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
      where: { isActive: isActive === 'true' },
      order: newOrder,
      skip: Number(page) * Number(take),
      take: Number(take),
    });

    const newProducts = products.map((item) => {
      const arrImages = item.images.map((img) => {
        if (process.env.STORAGE_DRIVER === 's3') {
          return `https://images-all-products.s3.amazonaws.com/${img.filename}`;
        }

        return `${process.env.APP_API_URL}/images/${img.filename}`;
      });

      return {
        ...item,
        images: arrImages,
      };
    });

    return response.json(newProducts);
  },
);

productsRouter.post(
  '/',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      title: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      oldPrice: Joi.number().required(),
      isActive: Joi.bool().required(),
      variants: Joi.array().required(),
    },
  }),
  async (request, response) => {
    const {
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
    } = request.body;

    const createProductService = new CreateProductService();

    const product = await createProductService.execute({
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
    });

    return response.json(product);
  },
);

productsRouter.patch(
  '/:productId',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      title: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      oldPrice: Joi.number().required(),
      isActive: Joi.bool().required(),
      variants: Joi.array().required(),
    },
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const {
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
    } = request.body;

    const { productId } = request.params;

    const updateProductService = new UpdateProductService();

    const product = await updateProductService.execute({
      productId,
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
    });

    return response.json(product);
  },
);

productsRouter.patch(
  '/:productId/images-product',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  upload.array('images'),
  async (request, response) => {
    const { productId } = request.params;

    const updateProductImagesService = new UpdateProductImagesService();

    const arrImagesFilename = request.files.map((img: any) => {
      return { filename: img.filename };
    });

    const product = await updateProductImagesService.execute({
      productId,
      arrImagesFilename,
    });

    return response.json(product);
  },
);

productsRouter.patch(
  '/:productId/images-product-description',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  upload.array('images_description'),
  async (request, response) => {
    const { productId } = request.params;

    const updateProductImagesService = new UpdateProductImagesService();

    const arrImagesFilename = request.files.map((img: any) => {
      return { filename: img.filename };
    });

    const product = await updateProductImagesService.execute({
      productId,
      arrImagesFilename,
      type: 'description',
    });

    return response.json(product);
  },
);

export default productsRouter;
