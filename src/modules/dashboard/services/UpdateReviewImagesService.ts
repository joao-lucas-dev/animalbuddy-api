import AppError from '@shared/errors/AppError';
import Review, { IReview } from '../schemas/Review';

import Storage from '../utils/storage';

interface IRequest {
  review_id: IReview['_id'];
  images: IReview['images'];
}

class UpdateReviewImagesService {
  async execute({ review_id, images }: IRequest): Promise<void> {
    const review = await Review.findById(review_id);

    if (!review) {
      throw new AppError("Review doesn't found.", 404);
    }

    const storage = new Storage();

    if (review.images.length > 0) {
      if (process.env.STORAGE_DRIVER === 's3') {
        await storage.deleteFilesInS3({
          images: review.images,
          bucket: 'reviews-images',
        });
      } else {
        await storage.deleteFilesInDisk(review.images);
      }
    }

    if (process.env.STORAGE_DRIVER === 's3') {
      await storage.saveFilesInS3({
        images,
        bucket: 'reviews-images',
      });
    }

    await Review.updateOne(
      { _id: review_id },
      {
        images,
        updatedAt: new Date(),
      },
    );
  }
}

export default UpdateReviewImagesService;
