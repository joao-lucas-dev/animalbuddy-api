import AppError from '@shared/errors/AppError';
import Order, { IOrder } from '@modules/checkout/schemas/Order';

class UpdateReadOrderService {
  async execute(orderId: IOrder['_id']): Promise<void> {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new AppError("Order doesn't found.", 404);
    }

    await Order.updateOne(
      { _id: orderId },
      {
        read: true,
        updatedAt: new Date(),
      },
    );
  }
}

export default UpdateReadOrderService;
