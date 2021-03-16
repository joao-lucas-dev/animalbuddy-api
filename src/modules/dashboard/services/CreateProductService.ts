import AppError from '@shared/errors/AppError';
import { ObjectID } from 'mongodb';

import Product, { IProduct } from '../schemas/Product';

interface IRequest {
  title: IProduct['title'];
  price: IProduct['price'];
  oldPrice: IProduct['oldPrice'];
  isActive: IProduct['isActive'];
  variants: IProduct['variants'];
  product_url: IProduct['product_url'];
  seoDescription: IProduct['seoDescription'];
}

class CreateProductService {
  async execute({
    title,
    price,
    oldPrice,
    isActive,
    variants,
    product_url,
    seoDescription,
  }: IRequest): Promise<IProduct> {
    const hasProduct = await Product.findOne({ title });

    if (hasProduct) {
      throw new AppError('Product already created.', 404);
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

    const product = await Product.create({
      _id: new ObjectID(),
      title,
      price,
      oldPrice,
      isActive,
      variants,
      discount: oldPrice > price ? oldPrice - price : 0,
      product_url,
      seoDescription,
      slug,
    });

    return product;
  }
}

export default CreateProductService;
