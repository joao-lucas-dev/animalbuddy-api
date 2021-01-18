import mercadopago from 'mercadopago';
import { ObjectID } from 'mongodb';
import path from 'path';

import AppError from '@shared/errors/AppError';
import Mail from '@shared/lib/Mail';
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

    const order = await Order.aggregate([
      {
        $match: {
          _id: new ObjectID(response.external_reference),
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
          customer_email: { $arrayElemAt: ['$customer_info.email', 0] },
          customer_street: { $arrayElemAt: ['$customer_info.street', 0] },
          customer_number: { $arrayElemAt: ['$customer_info.number', 0] },
          customer_complement: {
            $arrayElemAt: ['$customer_info.complement', 0],
          },
          customer_city: { $arrayElemAt: ['$customer_info.city', 0] },
          customer_state: { $arrayElemAt: ['$customer_info.state', 0] },
          customer_country: { $arrayElemAt: ['$customer_info.country', 0] },
        },
      },
    ]);

    if (order.length <= 0) {
      throw new AppError('Order does not found');
    }

    await Order.updateOne(
      { _id: order[0]._id },
      {
        status: response.status,
        updated_at: new Date(),
        payment_id: data.id,
        payment_type: response.payment_type_id,
      },
    );

    const orderConfirmedTemplate = path.resolve(
      __dirname,
      '..',
      'views',
      'orderConfirmed.hbs',
    );

    if (response.status === 'approved') {
      const mail = new Mail();

      await mail.sendMail({
        to: order[0].customer_email,
        subject: '[ForkStore] Pedido confirmado!',
        templateData: {
          file: orderConfirmedTemplate,
          variables: {
            order_number: order[0].order_number,
            name: order[0].customer_name,
            products: order[0].products.map((item: any) => {
              return {
                ...item,
                priceFormatted: item.price.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                }),
              };
            }),
            subtotal: order[0].totalPrice.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            }),
            total: order[0].totalPrice.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            }),
            customer_street: order[0].customer_street,
            customer_number: order[0].customer_number,
            customer_complement:
              order[0].customer_complement === ''
                ? null
                : order[0].customer_complement,
            customer_city: order[0].customer_city,
            customer_state: order[0].customer_state,
            customer_country: order[0].customer_country,
            last_four_digits: response.card.last_four_digits,
          },
        },
      });
    }
  }
}

export default UpdateOrderService;
