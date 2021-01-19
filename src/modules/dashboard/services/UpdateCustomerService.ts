import AppError from '@shared/errors/AppError';
import Customer, { ICustomer } from '@modules/checkout/schemas/Customer';

interface IRequest {
  customerId: ICustomer['_id'];
  name: ICustomer['name'];
  surname: ICustomer['surname'];
  email: ICustomer['email'];
  phone: ICustomer['phone'];
  cpf: ICustomer['cpf'];
  zipCode: ICustomer['zipCode'];
  street: ICustomer['street'];
  number: ICustomer['number'];
  complement: ICustomer['complement'];
  city: ICustomer['city'];
  state: ICustomer['state'];
  country: ICustomer['country'];
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
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new AppError("Customer doesn't found.", 404);
    }

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
