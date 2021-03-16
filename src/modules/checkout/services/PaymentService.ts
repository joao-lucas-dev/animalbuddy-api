import mercadopago from 'mercadopago';

import RedisCache from '@shared/lib/RedisCache';

import { ObjectID } from 'mongodb';
import AppError from '@shared/errors/AppError';
import Order from '../schemas/Order';

interface IItem {
  id: string;
  title: string;
  description: string;
  picture_url: string;
  quantity: number;
  unit_price: number;
}

interface IPayer {
  name: string;
  surname: string;
  email: string;
  phone: string;
  cpf: string;
  zipCode: string;
  street: string;
  number: number;
  complement: string;
  city: string;
  state: string;
  country: string;
}

interface IRequest {
  items: IItem[];
  payer: IPayer;
  orderId: string;
}

interface IResponse {
  init_point: string;
  sandbox_init_point: string;
}

class PaymentService {
  async execute({ items, payer, orderId }: IRequest): Promise<IResponse> {
    const redisCache = new RedisCache();

    const order = Order.findById(new ObjectID(orderId));

    if (!order) {
      throw new AppError('Order not found');
    }

    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const preference = {
      auto_return: 'approved',
      back_urls: {
        success: 'https://www.animalbuddy.com.br/obrigado',
        failure: 'https://www.animalbuddy.com.br',
        pending: 'https://www.animalbuddy.com.br/obrigado',
      },
      items: items.map((item) => {
        return {
          id: item.id,
          picture_url: item.picture_url,
          title: item.title,
          description: item.description.substring(0, 254),
          quantity: item.quantity,
          currency_id: 'BRL',
          unit_price: item.unit_price,
        };
      }),
      payer: {
        phone: {
          area_code: payer.phone.substring(1, 3),
          number: Number(
            payer.phone.substring(5, 10) + payer.phone.substring(11, 15),
          ),
        },
        address: {
          zip_code: payer.zipCode,
          street_name: payer.street,
          street_number: Number(payer.number),
        },
        email: payer.email,
        identification: {
          number: payer.cpf,
          type: 'cpf',
        },
        name: payer.name,
        surname: payer.surname,
      },
      payment_methods: {
        excluded_payment_methods: [
          {
            id: 'paypal',
          },
        ],
        installments: 12,
      },
      statement_descriptor: 'ANIMALBUDDY',
      external_reference: orderId,
    };

    const { response } = await mercadopago.preferences.create(preference);

    await redisCache.invalidate(`payer:${orderId}`);

    return {
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  }
}

export default PaymentService;
