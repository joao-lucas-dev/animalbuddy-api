import AppError from '@shared/errors/AppError';

import Coupon, { ICoupon } from '../schemas/Coupon';

interface IRequest {
  couponId: ICoupon['_id'];
}

class DeleteCouponService {
  async execute({ couponId }: IRequest): Promise<void> {
    const hasCoupon = await Coupon.findById({ _id: couponId });

    if (!hasCoupon) {
      throw new AppError('Coupon not found', 404);
    }

    await Coupon.deleteOne({ _id: couponId });
  }
}

export default DeleteCouponService;
