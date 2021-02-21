import { Router } from 'express';

import { ObjectID } from 'mongodb';
import Order from '../schemas/Order';

import PaymentService from '../services/PaymentService';
import UpdateOrderService from '../services/UpdateOrderService';
import CreateOrderAndCustomerService from '../services/CreateOrderAndCustomerService';
import GetInfosService from '../services/GetInfosService';

const checkoutRouter = Router();

interface IProduct {
  product_id: string;
  name: string;
  slug: string;
  qtd: number;
  image_url: string;
  price: number;
  priceString: string;
  color: string;
  size: string;
  model: string;
}

checkoutRouter.get('/abandoned-cart/:orderId', async (request, response) => {
  const { orderId } = request.params;

  let cart = null;
  let payer = null;

  if (orderId.length >= 12 && orderId.length <= 24) {
    const orderWithCustomer = await Order.aggregate([
      {
        $match: {
          _id: new ObjectID(orderId),
          status: 'waiting_payment',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
    ]);

    if (orderWithCustomer.length > 0) {
      cart = orderWithCustomer[0].products.map((product: IProduct) => {
        return {
          _id: product.product_id,
          title: product.name,
          slug: product.slug,
          qtd: product.qtd,
          imageUrl: product.image_url,
          price: product.price,
          priceString: product.priceString,
          color: product.color,
          size: product.size,
          model: product.model,
        };
      });
      payer = { ...orderWithCustomer[0].customer, orderIdString: orderId };
    }
  }

  return response.json({ cart, payer });
});

checkoutRouter.get('/infos/:orderId', async (request, response) => {
  const { orderId } = request.params;

  const getInfosService = new GetInfosService();

  const payer = await getInfosService.execute(orderId);

  return response.json({ payer });
});

checkoutRouter.post('/webhook', async (request, response) => {
  const { data } = request.body;

  const updateOrderService = new UpdateOrderService();

  updateOrderService.execute({
    data,
  });

  return response.send();
});

checkoutRouter.post('/', async (request, response) => {
  const { items, payer, orderId } = request.body;

  const paymentService = new PaymentService();

  const { init_point, sandbox_init_point } = await paymentService.execute({
    items,
    payer,
    orderId,
  });

  return response.json({ init_point, sandbox_init_point });
});

checkoutRouter.post('/create', async (request, response) => {
  const { items, payer, orderId } = request.body;

  const createOrderAndCustomerService = new CreateOrderAndCustomerService();

  const orderIdString = await createOrderAndCustomerService.execute({
    items,
    payer,
    orderId,
  });

  return response.json({ orderIdString });
});

export default checkoutRouter;
