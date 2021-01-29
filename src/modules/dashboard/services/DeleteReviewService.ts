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
      if (review.images.length > 0)
        await Promise.all(
          review.images.map(async (img) => {
            await storage.deleteFileInS3({
              filename: img,
              bucket: 'reviews-images',
            });
          }),
        );
    } else if (review.images.length > 0)
      await Promise.all(
        review.images.map(async (img) => {
          await storage.deleteFileInDisk(img);
        }),
      );

    await Review.deleteOne({ _id: reviewId });
  }
}

export default DeleteReviewService;
