import { ObjectID } from 'mongodb';

import Customer from '../schemas/Customer';
import Order from '../schemas/Order';

interface IProduct {
  productId: string;
  title: string;
  slug: string;
  imageUrl: string;
  qtd: number;
  price: number;
  priceString: string;
  color: string;
  size: string;
  model: string;
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
  items: IProduct[];
  payer: IPayer;
  orderId: string;
}

class CreateOrderAndCustomerService {
  async execute({ items, payer, orderId }: IRequest): Promise<string> {
    const customer = await Customer.findOne({
      $or: [
        {
          email: payer.email,
        },
        {
          cpf: payer.cpf,
        },
      ],
    });

    const newOrderId = new ObjectID();

    if (!customer) {
      const newCustomerId = new ObjectID();

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
          slug: item.slug,
          qtd: item.qtd,
          price: item.price,
          priceString: item.priceString,
          image_url: item.imageUrl,
          color: item.color,
          size: item.size,
          model: item.model,
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
        email_review_sent: false,
      });
    } else {
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
          orders:
            orderId === '' ? [...customer.orders, newOrderId] : customer.orders,
          updatedAt: new Date(),
        },
      );

      if (orderId === '') {
        const arrProducts = items.map((item) => {
          return {
            _id: new ObjectID(),
            product_id: new ObjectID(item.productId),
            name: item.title,
            slug: item.slug,
            qtd: item.qtd,
            price: item.price,
            priceString: item.priceString,
            image_url: item.imageUrl,
            color: item.color,
            size: item.size,
            model: item.model,
            createdAt: new Date(),
            updatedAt: new Date(),
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
          email_review_sent: false,
        });
      }
    }

    return orderId !== '' ? orderId : String(newOrderId);
  }
}

export default CreateOrderAndCustomerService;
