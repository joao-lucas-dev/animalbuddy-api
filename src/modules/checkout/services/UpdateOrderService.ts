import mercadopago from 'mercadopago';
import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';
import Order from '../schemas/Order';

interface IRequest {
  data: {
    id: string;
  };
}

class UpdateOrderService {
  async execute({ data }: IRequest): Promise<void> {
    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const { response } = await mercadopago.payment.findById(Number(data.id));

    const order = await Order.findOne({
      _id: new ObjectID(response.external_reference),
    });

    if (!order) {
      throw new AppError('Order does not found');
    }

    await Order.updateOne(
      { _id: order._id },
      {
        status: response.status,
        updated_at: new Date(),
        payment_id: data.id,
        payment_type: response.payment_type_id,
      },
    );
  }
}

export default UpdateOrderService;
