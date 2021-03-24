import AppError from '@shared/errors/AppError';

import Coupon, { ICoupon } from '../schemas/Coupon';

interface IRequest {
  couponId: ICoupon['_id'];
  isActive: ICoupon['isActive'];
}

class UpdateCouponService {
  async execute({ couponId, isActive }: IRequest): Promise<void> {
    const hasCoupon = await Coupon.findById({ _id: couponId });

    if (!hasCoupon) {
      throw new AppError('Coupon not found', 404);
    }

    await Coupon.updateOne(
      { _id: couponId },
      { isActive, updatedAt: new Date() },
    );
  }
}

export default UpdateCouponService;
