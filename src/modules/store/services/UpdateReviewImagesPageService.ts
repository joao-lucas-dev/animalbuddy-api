import AppError from '@shared/errors/AppError';
import Storage from '@modules/dashboard/utils/storage';
import Review, { IReview } from '@modules/dashboard/schemas/Review';

interface IRequest {
  review_id: IReview['_id'];
  images: IReview['images'];
}

class UpdateReviewImagesPageService {
  async execute({ review_id, images }: IRequest): Promise<void> {
    const review = await Review.findById(review_id);

    if (!review) {
      throw new AppError("Review doesn't found.", 404);
    }

    const storage = new Storage();

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

export default UpdateReviewImagesPageService;
