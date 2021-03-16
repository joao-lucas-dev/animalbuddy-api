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
  seoDescription: IProduct['seoDescription'];
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
    seoDescription,
  }: IRequest): Promise<void> {
    const product = await Product.findById(productId);

    if (!product) {
      throw new AppError("Product doesn't found.", 404);
    }

    const accentsMap = {
      a: 'á|à|ã|â|À|Á|Ã|Â',
      e: 'é|è|ê|É|È|Ê',
      i: 'í|ì|î|Í|Ì|Î',
      o: 'ó|ò|ô|õ|Ó|Ò|Ô|Õ',
      u: 'ú|ù|û|ü|Ú|Ù|Û|Ü',
      c: 'ç|Ç',
      n: 'ñ|Ñ',
    };

    const titleFormatted = Object.keys(accentsMap).reduce(
      (acc, cur) => acc.replace(new RegExp(accentsMap[cur], 'g'), cur),
      title.toLocaleLowerCase(),
    );

    const slug = titleFormatted.split(' ').join('-');

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
        seoDescription,
      },
    );
  }
}

export default UpdateProductService;
