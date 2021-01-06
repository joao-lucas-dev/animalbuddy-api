import { Router } from 'express';
import { getMongoRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';

import enseureAuthenticated from '../middlewares/ensureAuthenticated';

import Product from '../models/Product';
import CreateProductService from '../services/CreateProductService';
import UpdateProductImagesService from '../services/UpdateProductImagesService';

const productsRouter = Router();
const upload = multer(uploadConfig);

productsRouter.get('/', async (request, response) => {
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
    order: newOrder,
    skip: Number(page) * Number(take),
    take: Number(take),
  });

  return response.json(products);
});

productsRouter.post('/', enseureAuthenticated, async (request, response) => {
  const {
    title,
    description,
    price,
    oldPrice,
    isActive,
    color,
    type,
  } = request.body;

  const createProductService = new CreateProductService();

  const product = await createProductService.execute({
    title,
    description,
    price,
    oldPrice,
    isActive,
    color,
    type,
  });

  return response.json(product);
});

productsRouter.patch(
  '/:id/images',
  enseureAuthenticated,
  upload.array('images'),
  async (request, response) => {
    const { id } = request.params;

    const updateProductImagesService = new UpdateProductImagesService();

    const arrImagesFilename = request.files.map((img: any) => {
      return { filename: img.filename };
    });

    const product = await updateProductImagesService.execute({
      productId: id,
      arrImagesFilename,
    });

    return response.json(product);
  },
);

export default productsRouter;
