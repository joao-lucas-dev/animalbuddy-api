import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';

import Order from '@modules/checkout/schemas/Order';

class CancelOrderService {
  async execute(orderId: string): Promise<void> {
    const order = await Order.aggregate([
      {
        $match: { _id: new ObjectID(orderId) },
      },
    ]);

    if (order.length <= 0) {
      throw new AppError("Order doesn't found.", 404);
    }

    await Order.updateOne(
      { _id: new ObjectID(orderId) },
      {
        status: 'cancelled',
        updated_at: new Date(),
      },
    );
  }
}

export default CancelOrderService;
