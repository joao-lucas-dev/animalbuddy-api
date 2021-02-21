import { addDays, isBefore } from 'date-fns';
import Order from '../schemas/Order';

class CancelOrderService {
  async execute(): Promise<void> {
    const orders = await Order.find({ status: 'waiting_payment' });

    for await (const order of orders) {
      const newDate = addDays(order.createdAt, 1);

      if (isBefore(newDate, new Date())) {
        await Order.updateOne(
          {
            _id: order._id,
          },
          {
            updatedAt: new Date(),
            status: 'cancelled',
          },
        );
      }
    }
  }
}

export default CancelOrderService;
