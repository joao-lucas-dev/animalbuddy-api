import mercadopago from 'mercadopago';
import { ObjectID } from 'mongodb';
import { getMongoRepository } from 'typeorm';

import AppError from '@shared/errors/AppError';
import Order from '../entities/Orders';

interface IRequest {
  data: {
    id: string;
  };
}

class UpdateOrderService {
  async execute({ data }: IRequest): Promise<void> {
    const ordersRepository = getMongoRepository(Order);

    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const { response } = await mercadopago.payment.findById(Number(data.id));

    const order = await ordersRepository.findOne({
      where: {
        _id: new ObjectID(response.external_reference),
      },
    });

    if (!order) {
      throw new AppError('Order does not found');
    }

    order.status = response.status;
    order.updated_at = new Date();

    await ordersRepository.save(order);
  }
}

export default UpdateOrderService;
