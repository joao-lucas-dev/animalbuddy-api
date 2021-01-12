import mercadopago from 'mercadopago';
import { getMongoRepository } from 'typeorm';
import { ObjectID } from 'mongodb';

import Customer from '../entities/Customer';
import Orders from '../entities/Orders';

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
    const customersRepository = getMongoRepository(Customer);
    const ordersRepository = getMongoRepository(Orders);

    const customer = await customersRepository.findOne({
      where: {
        email: payer.email,
      },
    });

    let external_reference = '';

    if (!customer) {
      const newCustomer = await customersRepository.create({
        _id: new ObjectID(),
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
      });

      const arrProducts = items.map((item) => {
        return {
          _id: new ObjectID(),
          product_id: new ObjectID(item.productId),
          qtd: item.quantity,
          price: item.unit_price,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      const order = await ordersRepository.create({
        _id: new ObjectID(),
        products: arrProducts,
        customer_id: newCustomer._id,
        status: 'pending',
        totalPrice: arrProducts.reduce((prevValue, item) => {
          return prevValue + item.price * item.qtd;
        }, 0),
      });

      newCustomer.orders = [`${order._id}`];

      await customersRepository.save(newCustomer);
      await ordersRepository.save(order);

      external_reference = `${order._id}`;
    } else {
      customer.name = payer.name;
      customer.surname = payer.surname;
      customer.email = payer.email;
      customer.phone = payer.phone;
      customer.cpf = payer.cpf;
      customer.zipCode = payer.zipCode;
      customer.street = payer.street;
      customer.number = payer.number;
      customer.complement = payer.complement;
      customer.city = payer.city;
      customer.state = payer.state;
      customer.country = payer.country;
      customer.updated_at = new Date();

      const arrProducts = items.map((item) => {
        return {
          _id: new ObjectID(),
          product_id: new ObjectID(item.productId),
          qtd: item.quantity,
          price: item.unit_price,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      const order = await ordersRepository.create({
        _id: new ObjectID(),
        products: arrProducts,
        customer_id: customer._id,
        status: 'pending',
        totalPrice: arrProducts.reduce((prevValue, item) => {
          return prevValue + item.price * item.qtd;
        }, 0),
      });

      customer.orders = [...customer.orders, `${order._id}`];

      await customersRepository.save(customer);
      await ordersRepository.save(order);

      external_reference = `${order._id}`;
    }

    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const preference = {
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
