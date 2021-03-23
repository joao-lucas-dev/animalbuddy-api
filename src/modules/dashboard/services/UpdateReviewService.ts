import AppError from '@shared/errors/AppError';

import Review, { IReview } from '../schemas/Review';

interface IRequest {
  reviewId: IReview['_id'];
}

class UpdateReviewService {
  async execute({ reviewId }: IRequest): Promise<void> {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError("Review doesn't found.", 404);
    }

    await Review.updateOne(
      { _id: reviewId },
      {
        status: 'approved',
        updatedAt: new Date(),
      },
    );
  }
}

export default UpdateReviewService;
