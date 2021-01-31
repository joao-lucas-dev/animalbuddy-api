import AppError from '@shared/errors/AppError';

import Order, { IOrder } from '@modules/checkout/schemas/Order';

class GetOrderService {
  async execute(orderId: IOrder['_id']): Promise<IOrder> {
    const order = await Order.aggregate([
      {
        $match: {
          _id: orderId,
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
          tracking_code: 1,
          externalNumber: 1,
          payment_type: 1,
          payment_id: 1,
        },
      },
    ]);

    if (order.length === 0) {
      throw new AppError('Order not found.', 404);
    }

    return order[0];
  }
}

export default GetOrderService;
