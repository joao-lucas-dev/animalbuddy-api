import AppError from '@shared/errors/AppError';
import Storage from '../utils/storage';

import Review, { IReview } from '../schemas/Review';

class DeleteReviewService {
  async execute(reviewId: IReview['_id']): Promise<void> {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError('Review not found.', 404);
    }

    const storage = new Storage();

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.deleteFilesInS3({
        images: review.images,
        bucket: 'reviews-images',
      });
    } else {
      await storage.deleteFilesInDisk(review.images);
    }

    await Review.deleteOne({ _id: reviewId });
  }
}

export default DeleteReviewService;
