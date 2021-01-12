import mercadopago from 'mercadopago';
import { getMongoRepository } from 'typeorm';
import { ObjectID } from 'mongodb';

import Customer from '../entities/Customer';
import Request from '../entities/Request';

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
    const requestsRepository = getMongoRepository(Request);

    const customer = await customersRepository.findOne({
      where: {
        email: payer.email,
      },
    });

    if (!customer) {
      const newCustomer = await customersRepository.create({
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
        ordered_products: items.map((item) => {
          return {
            _id: item.productId,
            qtd: item.quantity,
            price: item.unit_price,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date(),
          };
        }),
      });

      await customersRepository.save(newCustomer);

      await Promise.all(
        newCustomer.ordered_products.map(async (item) => {
          const request = await requestsRepository.create({
            product_id: new ObjectID(item._id),
            customer_id: newCustomer._id,
            qtd: item.qtd,
            price: item.price,
            status: 'pending',
          });

          await requestsRepository.save(request);
        }),
      );
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
      customer.ordered_products = [
        ...customer.ordered_products,
        ...items.map((item) => {
          return {
            _id: item.productId,
            qtd: item.quantity,
            price: item.unit_price,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date(),
          };
        }),
      ];
      customer.updated_at = new Date();

      await customersRepository.save(customer);

      await Promise.all(
        items.map(async (item) => {
          const request = await requestsRepository.create({
            product_id: new ObjectID(item.productId),
            customer_id: customer._id,
            qtd: item.quantity,
            price: item.unit_price,
            status: 'pending',
          });

          await requestsRepository.save(request);
        }),
      );
    }

    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const preference = {
      back_urls: {
        failure: 'wwww.forkstore.com.br',
        pending: 'wwww.forkstore.com.br',
        success: 'wwww.forkstore.com.br',
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
      auto_return: 'approved',
    };

    const { response } = await mercadopago.preferences.create(preference);

    return {
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  }
}

export default CreateCheckoutService;
