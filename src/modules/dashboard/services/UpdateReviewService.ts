import AppError from '@shared/errors/AppError';
import Storage from '../utils/storage';

import Review, { IReview } from '../schemas/Review';

interface IRequest {
  reviewId: IReview['_id'];
  name: IReview['name'];
  stars: IReview['stars'];
  feedback: IReview['feedback'];
  status: IReview['status'];
}

class UpdateReviewService {
  async execute({
    reviewId,
    name,
    stars,
    feedback,
    status,
  }: IRequest): Promise<void> {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError("Review doesn't found.", 404);
    }

    if (status === 'reject') {
      if (review.images.length > 0) {
        const storage = new Storage();

        if (process.env.STORAGE_DRIVER === 's3') {
          await storage.deleteFilesInS3({
            images: review.images,
            bucket: 'reviews-images',
          });
        } else {
          await storage.deleteFilesInDisk(review.images);
        }
      }

      await Review.deleteOne({ _id: reviewId });
    } else {
      await Review.updateOne(
        { _id: reviewId },
        {
          name,
          stars,
          feedback,
          status,
          updatedAt: new Date(),
        },
      );
    }
  }
}

export default UpdateReviewService;
