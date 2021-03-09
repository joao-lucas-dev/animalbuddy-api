import AppError from '@shared/errors/AppError';
import Order, { IOrder } from '../schemas/Order';

class GetTotalPriceService {
  async execute(orderId: IOrder['_id']): Promise<number> {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError('Order not found!', 404);
    }

    return order.totalPrice;
  }
}

export default GetTotalPriceService;
