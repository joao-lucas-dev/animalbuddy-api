import { Router } from 'express';
import { ObjectID } from 'mongodb';
import { celebrate, Joi, Segments } from 'celebrate';
import multer from 'multer';
import enseureAuthenticated from '@shared/middlewares/ensureAuthenticated';
import uploadConfig from '@config/upload';

import Customer from '@modules/checkout/schemas/Customer';
import Order from '@modules/checkout/schemas/Order';
import Product from '../schemas/Product';

import CreateProductService from '../services/CreateProductService';
import UpdateProductImagesService from '../services/UpdateProductImagesService';
import UpdateProductImagesDescriptionService from '../services/UpdateProductImagesDescriptionService';
import UpdateProductService from '../services/UpdateProductService';
import DeleteProductService from '../services/DeleteProductService';
import GetProductService from '../services/GetProductService';
import UpdateCustomerService from '../services/UpdateCustomerService';
import DeleteCustomerService from '../services/DeleteCustomerService';
import CancelOrderService from '../services/CancelOrderService';

const dashboardRoutes = Router();
const upload = multer(uploadConfig);

/**
 * PRODUCTS
 */

dashboardRoutes.get(
  '/products',
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
    const { page, limit, order, isActive } = request.query;

    let newOrder = {};

    switch (order) {
      case 'recentDate':
        newOrder = {
          created_at: -1,
        };
        break;
      case 'oldestDate':
        newOrder = {
          created_at: 1,
        };
        break;
      default:
        break;
    }

    const products = await Product.aggregate([
      {
        $match: { isActive: isActive === 'true' },
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
          isActive: '$isActive',
          images: '$images',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt',
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

dashboardRoutes.get(
  '/products/:productId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { productId } = request.params;

    const getProductService = new GetProductService();

    const product = await getProductService.execute(productId);

    return response.json(product);
  },
);

dashboardRoutes.post(
  '/products',
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

dashboardRoutes.put(
  '/products/:productId',
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

    await updateProductService.execute({
      productId,
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
      product_url,
    });

    return response.send();
  },
);

dashboardRoutes.patch(
  '/products/:productId/images',
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

dashboardRoutes.patch(
  '/products/:productId/images-description',
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

    await updateProductImagesDescriptionService.execute({
      productId,
      arrImages,
    });

    return response.send();
  },
);

dashboardRoutes.delete(
  '/products/:productId',
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

/**
 * CUSTOMERS
 */

dashboardRoutes.get(
  '/customers',
  enseureAuthenticated,
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

    const customers = await Customer.aggregate([
      {
        $project: {
          name: 1,
          surname: 1,
          city: 1,
          state: 1,
          country: 1,
          createdAt: 1,
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer_id',
          as: 'orders',
        },
      },
      {
        $project: {
          name: 1,
          surname: 1,
          city: 1,
          state: 1,
          country: 1,
          orders: '$orders',
          totalSpent: { $sum: '$orders.totalPrice' },
          createdAt: 1,
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
    ]);

    return response.json(customers);
  },
);

dashboardRoutes.get(
  '/customers/:customerId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      customerId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { customerId } = request.params;

    const customer = await Customer.aggregate([
      {
        $match: {
          _id: new ObjectID(customerId),
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer_id',
          as: 'orders',
        },
      },
      {
        $project: {
          name: 1,
          surname: 1,
          email: 1,
          phone: 1,
          cpf: 1,
          zipCode: 1,
          street: 1,
          number: 1,
          complement: 1,
          city: 1,
          state: 1,
          country: 1,
          orders: '$orders',
        },
      },
    ]);

    return response.json(customer[0]);
  },
);

dashboardRoutes.put(
  '/customers/:customerId',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      surname: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
      cpf: Joi.string().required(),
      zipCode: Joi.string().required(),
      street: Joi.string().required(),
      number: Joi.number().required(),
      complement: Joi.string().allow('').required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
    },
    [Segments.PARAMS]: {
      customerId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const {
      name,
      surname,
      email,
      phone,
      cpf,
      zipCode,
      street,
      number,
      complement,
      city,
      state,
      country,
    } = request.body;

    const { customerId } = request.params;

    const updateCustomerService = new UpdateCustomerService();

    await updateCustomerService.execute({
      customerId,
      name,
      surname,
      email,
      phone,
      cpf,
      zipCode,
      street,
      number,
      complement,
      city,
      state,
      country,
    });

    return response.send();
  },
);

dashboardRoutes.delete(
  '/customers/:customerId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      customerId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { customerId } = request.params;

    const deleteCustomerService = new DeleteCustomerService();

    await deleteCustomerService.execute(customerId);

    return response.send();
  },
);

/**
 * ORDERS
 */

dashboardRoutes.get(
  '/orders',
  enseureAuthenticated,
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

    const orders = await Order.aggregate([
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
    ]);

    return response.json(orders);
  },
);

dashboardRoutes.get(
  '/orders/status',
  enseureAuthenticated,
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
      status: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit, status } = request.query;

    const orders = await Order.aggregate([
      {
        $match: {
          status,
        },
      },
      {
        $skip: Number(page) * Number(limit),
      },
      {
        $limit: Number(limit),
      },
    ]);

    return response.json(orders);
  },
);

dashboardRoutes.patch(
  '/orders/:orderId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      orderId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { orderId } = request.params;

    const cancelOrderService = new CancelOrderService();

    await cancelOrderService.execute(orderId);

    return response.send();
  },
);

export default dashboardRoutes;
