import mercadopago from 'mercadopago';

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
    mercadopago.configure({
      access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    });

    const preference = {
      back_urls: {
        success: 'https://www.animalbuddy.com.br',
        failure: 'https://www.animalbuddy.com.br',
        pending: 'https://www.animalbuddy.com.br',
      },
      items: items.map((item) => {
        return {
          id: item.id,
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

    return {
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    };
  }
}

export default PaymentService;
