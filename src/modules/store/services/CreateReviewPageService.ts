import AppError from '@shared/errors/AppError';
import Product, { IProduct } from '@modules/dashboard/schemas/Product';
import Review, { IReview } from '@modules/dashboard/schemas/Review';

interface IRequest {
  productId: IProduct['_id'];
  name: IReview['name'];
  stars: IReview['stars'];
  feedback: IReview['feedback'];
  state: IReview['state'];
}

class CreateReviewPageService {
  async execute({
    productId,
    name,
    stars,
    feedback,
    state,
  }: IRequest): Promise<IReview> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const review = await Review.create({
      name,
      stars,
      feedback,
      product_id: productId,
      status: 'pending',
      state,
    });

    return review;
  }
}

export default CreateReviewPageService;
