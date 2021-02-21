import path from 'path';

import AppError from '@shared/errors/AppError';

import Mail from '@shared/lib/Mail';
import SESMail from '@shared/lib/SESMail';
import Order, { IOrder } from '@modules/checkout/schemas/Order';

class RefundedOrderService {
  async execute(orderId: IOrder['_id']): Promise<void> {
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
      throw new AppError("Order doesn't found.", 404);
    }

    if (order[0].status === 'approved') {
      await Order.updateOne(
        { _id: orderId },
        {
          status: 'refunded',
          updated_at: new Date(),
        },
      );

      let mail = null;

      if (process.env.MAIL_DRIVER === 'ses') {
        mail = new SESMail();
      } else {
        mail = new Mail();
      }

      const orderConfirmedTemplate = path.resolve(
        __dirname,
        '..',
        'views',
        'orderRefunded.hbs',
      );

      await mail.sendMail({
        to: order[0].customer_email,
        subject: 'Seu reembolso foi realizado!',
        templateData: {
          file: orderConfirmedTemplate,
          variables: {
            id_order: order[0]._id,
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
            refoundPrice: order[0].totalPrice.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            }),
            subtotal: order[0].totalPrice.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            }),
            total: order[0].totalPrice.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            }),
          },
        },
      });
    }
  }
}

export default RefundedOrderService;
