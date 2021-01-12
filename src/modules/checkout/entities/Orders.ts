import {
  Entity,
  ObjectID,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

interface IProduct {
  _id: ObjectID;
  product_id: ObjectID;
  qtd: number;
  price: number;
  created_at: Date;
  updated_at: Date;
}
@Entity('orders')
class Orders {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  products: Array<IProduct>;

  @Column()
  customer_id: ObjectID;

  @Column()
  status: string;

  @Column()
  totalPrice: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Orders;
