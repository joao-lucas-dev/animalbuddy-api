import AppError from '@shared/errors/AppError';

import Order, { IOrder } from '@modules/checkout/schemas/Order';

class GetOrderService {
  async execute(orderId: IOrder['_id']): Promise<IOrder> {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    return order;
  }
}

export default GetOrderService;
