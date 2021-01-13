import mercadopago from 'mercadopago';
import { ObjectID } from 'mongodb';

import Customer from '../schemas/Customer';
import Order from '../schemas/Order';

interface IRequest {
  items: [
    {
      productId: string;
      title: string;
      description: string;
      quantity: number;
      unit_price: number;
    },
  ];
  payer: {
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
  };
}

interface IResponse {
  init_point: string;
  sandbox_init_point: string;
}

class CreateCheckoutService {
  async execute({ items, payer }: IRequest): Promise<IResponse> {
    const customer = await Customer.findOne({
      email: payer.email,
    });

    let external_reference = '';

    if (!customer) {
      const newCustomerId = new ObjectID();
      const newOrderId = new ObjectID();

      await Customer.create({
        _id: newCustomerId,
        name: payer.name,
        surname: payer.surname,
        email: payer.email,
        phone: payer.phone,
        cpf: payer.cpf,
        zipCode: payer.zipCode,
        street: payer.street,
        number: payer.number,
        complement: payer.complement,
        city: payer.city,
        state: payer.state,
        country: payer.country,
        orders: [newOrderId],
      });

      const arrProducts = items.map((item) => {
        return {
          _id: new ObjectID(),
          product_id: new ObjectID(item.productId),
          name: item.title,
          qtd: item.quantity,
          price: item.unit_price,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      await Order.create({
        _id: newOrderId,
        products: arrProducts,
        customer_id: newCustomerId,
        status: 'waiting_payment',
        totalPrice: arrProducts.reduce((prevValue, item) => {
          return prevValue + item.price * item.qtd;
        }, 0),
      });

      external_reference = `${newOrderId}`;
    } else {
      const newOrderId = new ObjectID();

      await Customer.updateOne(
        { _id: customer._id },
        {
          name: payer.name,
          surname: payer.surname,
          email: payer.email,
          phone: payer.phone,
          cpf: payer.cpf,
          zipCode: payer.zipCode,
          street: payer.street,
          number: payer.number,
          complement: payer.complement,
          city: payer.city,
          state: payer.state,
          country: payer.country,
          orders: [...customer.orders, newOrderId],
          updatedAt: new Date(),
        },
      );

      const arrProducts = items.map((item) => {
        return {
          _id: new ObjectID(),
          product_id: new ObjectID(item.productId),
          name: item.title,
          qtd: item.quantity,
          price: item.unit_price,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      await Order.create({
        _id: newOrderId,
        products: arrProducts,
        customer_id: customer._id,
        status: 'waiting_payment',
        totalPrice: arrProducts.reduce((prevValue, item) => {
          return prevValue + item.price * item.qtd;
        }, 0),
      });

      external_reference = `${newOrderId}`;
    }

    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const preference = {
      back_urls: {
        success: 'https://www.forkstore.com.br',
        failure: 'https://www.forkstore.com.br',
        pending: 'https://www.forkstore.com.br',
      },
      items: items.map((item: any) => {
        return {
          id: item.productId,
          picture_url: item.picture_url,
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          currency_id: 'BRL',
          unit_price: item.unit_price,
        };
      }),
      payer: {
        phone: {
          area_code: payer.phone.substring(0, 2),
          number: Number(payer.phone.substring(2, 11)),
        },
        address: {
          zip_code: payer.zipCode,
          street_name: payer.street,
          street_number: payer.number,
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
      statement_descriptor: 'FORKSTORE',
      external_reference,
    };

    const { response } = await mercadopago.preferences.create(preference);

    return {
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  }
}

export default CreateCheckoutService;
