import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';
import Customer from '@modules/checkout/schemas/Customer';

interface IRequest {
  customerId: string;
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

class UpdateCustomerService {
  async execute({
    customerId,
    name,
    surname,
    email,
    phone,
    cpf,
    zipCode,
    street,
    number,
    complement,
    city,
    state,
    country,
  }: IRequest): Promise<void> {
    const arrCustomer = await Customer.aggregate([
      {
        $match: { _id: new ObjectID(customerId) },
      },
    ]);

    if (arrCustomer.length <= 0) {
      throw new AppError("Customer doesn't found.", 404);
    }

    const customer = arrCustomer[0];

    await Customer.updateOne(
      { _id: customer._id },
      {
        name,
        surname,
        email,
        phone,
        cpf,
        zipCode,
        street,
        number,
        complement,
        city,
        state,
        country,
        updatedAt: new Date(),
      },
    );
  }
}

export default UpdateCustomerService;
