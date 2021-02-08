import AppError from '@shared/errors/AppError';
import Review, { IReview } from '../schemas/Review';

import Product, { IProduct } from '../schemas/Product';

interface IRequest {
  productId: IProduct['_id'];
  name: IReview['name'];
  stars: IReview['stars'];
  feedback: IReview['feedback'];
  state: IReview['state'];
}

class CreateReviewService {
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
      email,
      stars,
      feedback,
      product_id: productId,
      status: 'approved',
      state,
    });

    return review;
  }
}

export default CreateReviewService;
