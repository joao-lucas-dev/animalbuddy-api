import path from 'path';

import AppError from '@shared/errors/AppError';
import Order, { IOrder } from '@modules/checkout/schemas/Order';
import Mail from '@shared/lib/Mail';
import SESMail from '@shared/lib/SESMail';

interface IRequest {
  orderId: IOrder['_id'];
  tracking_code: IOrder['tracking_code'];
  externalNumber: IOrder['externalNumber'];
}

class UpdateOrderService {
  async execute({
    orderId,
    tracking_code,
    externalNumber,
  }: IRequest): Promise<void> {
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
          email_tracking_code_sent: 1,
          customer_name: { $arrayElemAt: ['$customer_info.name', 0] },
          customer_email: { $arrayElemAt: ['$customer_info.email', 0] },
        },
      },
    ]);

    if (order.length <= 0) {
      throw new AppError("Order doesn't found.", 404);
    }

    if (!order[0].email_tracking_code_sent && tracking_code !== '') {
      let mail = null;

      if (process.env.MAIL_DRIVER === 'ses') {
        mail = new SESMail();
      } else {
        mail = new Mail();
      }

      const orderTrackingTemplate = path.resolve(
        __dirname,
        '..',
        'views',
        'orderTracking.hbs',
      );

      await mail.sendMail({
        to: order[0].customer_email,
        subject: 'Seu pedido já está a caminho!',
        templateData: {
          file: orderTrackingTemplate,
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
            tracking_code,
          },
        },
      });
    }

    await Order.updateOne(
      { _id: orderId },
      {
        tracking_code,
        externalNumber,
        email_tracking_code_sent: true,
        updatedAt: new Date(),
      },
    );
  }
}

export default UpdateOrderService;
