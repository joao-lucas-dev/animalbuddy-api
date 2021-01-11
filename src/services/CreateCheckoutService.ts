import mercadopago from 'mercadopago';

interface IRequest {
  items: {
    productId: string;
    title: string;
    description: string;
    quantity: number;
    unit_price: number;
  };
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
    refenrence: string;
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
