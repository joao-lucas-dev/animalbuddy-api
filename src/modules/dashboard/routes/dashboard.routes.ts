import { Router } from 'express';
import { ObjectID } from 'mongodb';
import { celebrate, Joi, Segments } from 'celebrate';
import multer from 'multer';
import enseureAuthenticated from '@shared/middlewares/ensureAuthenticated';
import uploadConfig from '@config/upload';

import Customer from '@modules/checkout/schemas/Customer';
import Order from '@modules/checkout/schemas/Order';
import Product from '../schemas/Product';
import Review from '../schemas/Review';
import Coupon from '../schemas/Coupon';

import CreateProductService from '../services/CreateProductService';
import UpdateProductImagesService from '../services/UpdateProductImagesService';
import UpdateProductImagesDescriptionService from '../services/UpdateProductImagesDescriptionService';
import UpdateProductService from '../services/UpdateProductService';
import DeleteProductService from '../services/DeleteProductService';
import GetProductService from '../services/GetProductService';
import UpdateCustomerService from '../services/UpdateCustomerService';
import DeleteCustomerService from '../services/DeleteCustomerService';
import RefundedOrderService from '../services/RefundedOrderService';
import CreateReviewService from '../services/CreateReviewService';
import UpdateReviewImagesService from '../services/UpdateReviewImagesService';
import UpdateReviewService from '../services/UpdateReviewService';
import DeleteReviewService from '../services/DeleteReviewService';
import UpdateOrderService from '../services/UpdateOrderService';
import DeleteImagesService from '../services/DeleteImagesService';
import DeleteImagesDescriptionService from '../services/DeleteImagesDescriptionService';
import UpdateReadOrderService from '../services/UpdateReadOrderService';
import GetOrderService from '../services/GetOrderService';
import CreateCouponService from '../services/CreateCouponService';
import UpdateCouponService from '../services/UpdateCouponService';
import DeleteCouponService from '../services/DeleteCouponService';

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

    const productIdFormatted = new ObjectID(productId);

    const product = await getProductService.execute(productIdFormatted);

    return response.json(product);
  },
);

dashboardRoutes.post(
  '/products',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      title: Joi.string().required(),
      price: Joi.number().required(),
      oldPrice: Joi.number().required(),
      isActive: Joi.bool().required(),
      variants: Joi.array().required(),
      product_url: Joi.string().required(),
      seoDescription: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const {
      title,
      price,
      oldPrice,
      isActive,
      variants,
      product_url,
      seoDescription,
    } = request.body;

    const createProductService = new CreateProductService();

    const product = await createProductService.execute({
      title,
      price,
      oldPrice,
      isActive,
      variants,
      product_url,
      seoDescription,
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
      description: Joi.string().allow('').required(),
      price: Joi.number().required(),
      oldPrice: Joi.number().required(),
      isActive: Joi.bool().required(),
      variants: Joi.array().required(),
      product_url: Joi.string().required(),
      seoDescription: Joi.string().required(),
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
      seoDescription,
    } = request.body;

    const { productId } = request.params;

    const updateProductService = new UpdateProductService();

    await updateProductService.execute({
      productId: new ObjectID(productId),
      title,
      description,
      price,
      oldPrice,
      isActive,
      variants,
      product_url,
      seoDescription,
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
    const { files } = request;

    const updateProductImagesService = new UpdateProductImagesService();

    const images = files.map((img: any) => {
      return `${img.filename}`;
    });

    const product = await updateProductImagesService.execute({
      productId: new ObjectID(productId),
      images,
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
    const { files } = request;

    const updateProductImagesDescriptionService = new UpdateProductImagesDescriptionService();

    const images = files.map((img: any) => {
      return `${img.filename}`;
    });

    await updateProductImagesDescriptionService.execute({
      productId: new ObjectID(productId),
      images,
    });

    return response.send();
  },
);

dashboardRoutes.delete(
  '/products/:productId/images/:filename',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
      filename: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { productId, filename } = request.params;

    const deleteImagesService = new DeleteImagesService();

    const productIdFormatted = new ObjectID(productId);

    await deleteImagesService.execute({
      productId: productIdFormatted,
      filename: `_${filename}`,
    });

    return response.send();
  },
);

dashboardRoutes.delete(
  '/products/:productId/images-description/:filename',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
      filename: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { productId, filename } = request.params;

    const deleteImagesDescriptionService = new DeleteImagesDescriptionService();

    const productIdFormatted = new ObjectID(productId);

    await deleteImagesDescriptionService.execute({
      productId: productIdFormatted,
      filename: `_${filename}`,
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

    const productIdFormatted = new ObjectID(productId);

    await deleteProductService.execute(productIdFormatted);

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
          email: 1,
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
          email: 1,
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

    const customerIdFormatted = new ObjectID(customerId);

    await deleteCustomerService.execute(customerIdFormatted);

    return response.send();
  },
);

/**
 * Reviews
 */
dashboardRoutes.get(
  '/products/:productId/reviews',
  enseureAuthenticated,
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
      order: Joi.string().required(),
      status: Joi.string().required(),
    },
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit, order, status } = request.query;
    const { productId } = request.params;

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

    const reviews = await Review.aggregate([
      {
        $match: { status, product_id: new ObjectID(productId) },
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

    const newArrReviews = reviews.map((item) => {
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
    });

    return response.json(newArrReviews);
  },
);

dashboardRoutes.get(
  '/reviews/pending',
  enseureAuthenticated,
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
        $match: { status: 'pending' },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          stars: 1,
          feedback: 1,
          state: 1,
          createdAt: 1,
          images: 1,
          product_title: { $arrayElemAt: ['$product.title', 0] },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: Number(page) * Number(limit),
      },
      {
        $limit: Number(limit),
      },
    ]);

    const newArrReviews = reviews.map((item) => {
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
    });

    return response.json(newArrReviews);
  },
);

dashboardRoutes.get(
  '/reviews/all/pending',
  enseureAuthenticated,
  async (request, response) => {
    const reviews = await Review.find({
      status: 'pending',
    });

    return response.json(reviews);
  },
);

dashboardRoutes.post(
  '/products/:productId/reviews',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      stars: Joi.number().required(),
      state: Joi.string().required(),
      feedback: Joi.string().required(),
    },
    [Segments.PARAMS]: {
      productId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { name, stars, feedback, state } = request.body;
    const { productId } = request.params;

    const createReviewService = new CreateReviewService();

    const review = await createReviewService.execute({
      productId: new ObjectID(productId),
      name,
      stars,
      feedback,
      state,
    });

    return response.json(review);
  },
);

dashboardRoutes.patch(
  '/reviews/:reviewId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      reviewId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { reviewId } = request.params;

    const updateReviewService = new UpdateReviewService();

    await updateReviewService.execute({
      reviewId: new ObjectID(reviewId),
    });

    return response.send();
  },
);

dashboardRoutes.patch(
  '/reviews/:reviewId/images',
  enseureAuthenticated,
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

    const updateReviewImagesService = new UpdateReviewImagesService();

    await updateReviewImagesService.execute({
      review_id: new ObjectID(reviewId),
      images,
    });

    return response.send();
  },
);

dashboardRoutes.delete(
  '/reviews/:reviewId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      reviewId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { reviewId } = request.params;

    const deleteReviewService = new DeleteReviewService();

    const reviewIdFormatted = new ObjectID(reviewId);

    await deleteReviewService.execute(reviewIdFormatted);

    return response.send();
  },
);

/**
 * ORDERS
 */

dashboardRoutes.get(
  '/orders/notifications',
  enseureAuthenticated,
  async (request, response) => {
    const orders = await Order.aggregate([
      {
        $match: { read: false },
      },
    ]);

    return response.json(orders);
  },
);

dashboardRoutes.get(
  '/orders',
  enseureAuthenticated,
  celebrate({
    [Segments.QUERY]: {
      page: Joi.number().required(),
      limit: Joi.number().required(),
      order: Joi.string().required(),
      status: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { page, limit, order, status } = request.query;

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
        $match: {
          status,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_info',
        },
      },
      {
        $project: {
          _id: 1,
          products: 1,
          customer_id: 1,
          status: 1,
          totalPrice: 1,
          order_number: 1,
          customer_name: { $arrayElemAt: ['$customer_info.name', 0] },
          customer_surname: { $arrayElemAt: ['$customer_info.surname', 0] },
          customer_email: { $arrayElemAt: ['$customer_info.email', 0] },
          createdAt: 1,
          read: 1,
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

    return response.json(orders);
  },
);

dashboardRoutes.get(
  '/orders/:orderId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      orderId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { orderId } = request.params;

    const orderIdFormatted = new ObjectID(orderId);

    const getOrderService = new GetOrderService();

    const order = await getOrderService.execute(orderIdFormatted);

    return response.json(order);
  },
);

dashboardRoutes.get(
  '/orders/search/:externalNumber',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      externalNumber: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { externalNumber } = request.params;

    const orders = await Order.aggregate([
      {
        $match: {
          externalNumber,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_info',
        },
      },
      {
        $project: {
          _id: 1,
          products: 1,
          customer_id: 1,
          status: 1,
          totalPrice: 1,
          order_number: 1,
          customer_name: { $arrayElemAt: ['$customer_info.name', 0] },
          customer_surname: { $arrayElemAt: ['$customer_info.surname', 0] },
          customer_email: { $arrayElemAt: ['$customer_info.email', 0] },
          createdAt: 1,
          read: 1,
        },
      },
    ]);

    return response.json(orders);
  },
);

dashboardRoutes.patch(
  '/orders/:orderId/refunded',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      orderId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { orderId } = request.params;

    const refundedOrderService = new RefundedOrderService();

    const orderIdFormatted = new ObjectID(orderId);

    await refundedOrderService.execute(orderIdFormatted);

    return response.send();
  },
);

dashboardRoutes.patch(
  '/orders/:orderId',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      tracking_code: Joi.string().allow('').required(),
      externalNumber: Joi.string().allow('').required(),
    },
    [Segments.PARAMS]: {
      orderId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { orderId } = request.params;
    const { tracking_code, externalNumber } = request.body;

    const updateOrderService = new UpdateOrderService();

    const orderIdFormatted = new ObjectID(orderId);

    await updateOrderService.execute({
      orderId: orderIdFormatted,
      tracking_code,
      externalNumber,
    });

    return response.send();
  },
);

dashboardRoutes.patch(
  '/orders/:orderId/read',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      orderId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { orderId } = request.params;

    const updateReadOrderService = new UpdateReadOrderService();

    const orderIdFormatted = new ObjectID(orderId);

    await updateReadOrderService.execute(orderIdFormatted);

    return response.send();
  },
);

/**
 * Coupons
 */
dashboardRoutes.get(
  '/coupons',
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

    const coupons = await Coupon.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          value: 1,
          isActive: 1,
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

    return response.json(coupons);
  },
);

dashboardRoutes.post(
  '/coupons',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      name: Joi.string().required(),
      value: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { name, value } = request.body;

    const createCouponService = new CreateCouponService();

    const coupon = await createCouponService.execute({
      name,
      value,
    });

    return response.json(coupon);
  },
);

dashboardRoutes.patch(
  '/coupons/:couponId',
  enseureAuthenticated,
  celebrate({
    [Segments.BODY]: {
      isActive: Joi.boolean().required(),
    },
    [Segments.PARAMS]: {
      couponId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { couponId } = request.params;
    const { isActive } = request.body;

    const updateCouponService = new UpdateCouponService();

    await updateCouponService.execute({
      couponId: new ObjectID(couponId),
      isActive,
    });

    return response.send();
  },
);

dashboardRoutes.delete(
  '/coupons/:couponId',
  enseureAuthenticated,
  celebrate({
    [Segments.PARAMS]: {
      couponId: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { couponId } = request.params;

    const deleteCouponService = new DeleteCouponService();

    await deleteCouponService.execute({
      couponId: new ObjectID(couponId),
    });

    return response.send();
  },
);

export default dashboardRoutes;
