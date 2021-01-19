import AppError from '@shared/errors/AppError';
import Customer, { ICustomer } from '@modules/checkout/schemas/Customer';

class DeleteCustomerService {
  async execute(customerId: ICustomer['_id']): Promise<void> {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new AppError('Customer not found.', 404);
    }

    await Customer.deleteOne({ _id: customerId });
  }
}

export default DeleteCustomerService;
