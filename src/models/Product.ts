import {
  Entity,
  ObjectID,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

interface IObjImage {
  filename: string;
}

@Entity('products')
class Product {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  images: Array<IObjImage>;

  @Column()
  images_description: Array<IObjImage>;

  @Column()
  price: number;

  @Column()
  oldPrice: number;

  @Column()
  discount: number;

  @Column()
  isActive: boolean;

  @Column()
  variants: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Product;
