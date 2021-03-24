import AppError from '@shared/errors/AppError';

import Coupon, { ICoupon } from '../schemas/Coupon';

interface IRequest {
  name: ICoupon['name'];
  value: ICoupon['value'];
}

class CreateCouponService {
  async execute({ name, value }: IRequest): Promise<ICoupon> {
    const hasCoupon = await Coupon.findOne({ name });

    if (hasCoupon) {
      throw new AppError('Coupon already created.', 404);
    }

    const coupon = await Coupon.create({ name, value, isActive: true });

    return coupon;
  }
}

export default CreateCouponService;
