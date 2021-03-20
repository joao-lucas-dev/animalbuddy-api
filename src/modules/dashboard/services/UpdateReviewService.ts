import AppError from '@shared/errors/AppError';

import Review, { IReview } from '../schemas/Review';

interface IRequest {
  reviewId: IReview['_id'];
  date?: string;
}

class UpdateReviewService {
  async execute({ reviewId, date = '' }: IRequest): Promise<void> {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError("Review doesn't found.", 404);
    }

    if (date) {
      await Review.updateOne(
        { _id: reviewId },
        {
          createdAt: new Date(date),
          updatedAt: new Date(),
        },
        {
          timestamps: true,
        },
      );
    } else {
      await Review.updateOne(
        { _id: reviewId },
        {
          status: 'approved',
          updatedAt: new Date(),
        },
      );
    }
  }
}

export default UpdateReviewService;
