import AppError from '@shared/errors/AppError';

import Product, { IProduct } from '../schemas/Product';

interface IRequest {
  productId: IProduct['_id'];
  title: IProduct['title'];
  description: IProduct['description'];
  price: IProduct['price'];
  oldPrice: IProduct['oldPrice'];
  isActive: IProduct['isActive'];
  variants: IProduct['variants'];
  product_url: IProduct['product_url'];
}

class UpdateProductService {
  async execute({
    productId,
    title,
    description,
    price,
    oldPrice,
    isActive,
    variants,
    product_url,
  }: IRequest): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product doesn't found.", 404);
    }

    const titleLower = title.toLocaleLowerCase();

    const slug = titleLower.split(' ').join('-');

    await Product.updateOne(
      { _id: product._id },
      {
        title,
        description,
        price,
        oldPrice,
        isActive,
        variants,
        discount: oldPrice > price ? Number((oldPrice - price).toFixed(2)) : 0,
        product_url,
        updated_at: new Date(),
        slug,
      },
    );
  }
}

export default UpdateProductService;
