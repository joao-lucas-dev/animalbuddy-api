import AppError from '@shared/errors/AppError';

import Coupon, { ICoupon } from '@modules/dashboard/schemas/Coupon';

class GetCouponService {
  async execute(name: ICoupon['name']): Promise<ICoupon> {
    const coupon = await Coupon.findOne({ name, isActive: true });

    if (!coupon) {
      throw new AppError('Coupon not found.', 404);
    }

    return coupon;
  }
}

export default GetCouponService;
