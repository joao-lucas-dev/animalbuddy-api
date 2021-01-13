import { ObjectID } from 'mongodb';

import AppError from '@shared/errors/AppError';
import Customer from '@modules/checkout/schemas/Customer';

class DeleteCustomerService {
  async execute(customerId: string): Promise<void> {
    const arrCustomer = await Customer.aggregate([
      {
        $match: { _id: new ObjectID(customerId) },
      },
    ]);

    if (arrCustomer.length <= 0) {
      throw new AppError('Product not found.', 404);
    }

    await Customer.deleteOne({ _id: new ObjectID(customerId) });
  }
}

export default DeleteCustomerService;
