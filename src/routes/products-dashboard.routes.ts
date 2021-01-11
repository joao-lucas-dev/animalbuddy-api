import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { getMongoRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';

import enseureAuthenticated from '../middlewares/ensureAuthenticated';

import Product from '../models/Product';
import CreateProductService from '../services/CreateProductService';
import UpdateProductImagesService from '../services/UpdateProductImagesService';
import UpdateProductImagesDescriptionService from '../services/UpdateProductImagesDescriptionService';
import UpdateProductService from '../services/UpdateProductService';
import DeleteProductService from '../services/DeleteProductService';

const productsRouter = Router();
const upload = multer(uploadConfig);

productsRouter.get(
  '/',
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
      select: [
        '_id',
        'title',
        'isActive',
        'images',
        'created_at',
        'updated_at',
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
      product_url: Joi.string().required(),
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
      product_url,
    } = request.body;

    const createProductService = new CreateProductService();

    const product = await createProductService.execute({
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
      product_url,
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
      product_url: Joi.string().required(),
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
      product_url,
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
      product_url,
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

    const arrImages = request.files.map((img: any) => {
      return `${img.filename}`;
    });

    const product = await updateProductImagesService.execute({
      productId,
      arrImages,
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

    const updateProductImagesDescriptionService = new UpdateProductImagesDescriptionService();

    const arrImages = request.files.map((img: any) => {
      return `${img.filename}`;
    });

    const product = await updateProductImagesDescriptionService.execute({
      productId,
      arrImages,
    });

    return response.json(product);
  },
);

productsRouter.delete(
  '/:productId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { productId } = request.params;

    const deleteProductService = new DeleteProductService();

    await deleteProductService.execute(productId);

    return response.send();
  },
);

export default productsRouter;
