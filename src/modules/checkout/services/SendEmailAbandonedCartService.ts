import path from 'path';
import { addHours, isBefore } from 'date-fns';

import Mail from '@shared/lib/Mail';
import SESMail from '@shared/lib/SESMail';
import Order from '../schemas/Order';

class SendEmailAbandonedCartService {
  async execute(): Promise<void> {
    const orders = await Order.aggregate([
      {
        $match: {
          status: 'waiting_payment',
          email_abandoned_cart_sent: false,
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
          createdAt: 1,
        },
      },
    ]);

    if (orders.length > 0) {
      let mail = null;

      if (process.env.MAIL_DRIVER === 'ses') {
        mail = new SESMail();
      } else {
        mail = new Mail();
      }

      const abandonedCartTemplate = path.resolve(
        __dirname,
        '..',
        'views',
        'abandonedCart.hbs',
      );

      for await (const order of orders) {
        const date = addHours(order.createdAt, 1);

        if (isBefore(date, new Date())) {
          await mail.sendMail({
            to: order.customer_email,
            subject: 'Itens esquecidos no carrinho!',
            templateData: {
              file: abandonedCartTemplate,
              variables: {
                id_order: order._id,
                name: order.customer_name,
                products: order.products.map((item: any) => {
                  return {
                    ...item,
                    priceFormatted: item.price.toLocaleString('pt-br', {
                      style: 'currency',
                      currency: 'BRL',
                    }),
                  };
                }),
                subtotal: order.totalPrice.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                }),
                total: order.totalPrice.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                }),
                url:
                  `${process.env.STORE_URL}/carrinho?orderId=${order._id}` ||
                  '',
              },
            },
          });

          await Order.updateOne(
            { _id: order._id },
            {
              email_abandoned_cart_sent: true,
              updatedAt: new Date(),
            },
          );
        }
      }
    }
  }
}

export default SendEmailAbandonedCartService;
