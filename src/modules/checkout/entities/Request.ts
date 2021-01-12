import {
  Entity,
  ObjectID,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('requests')
class Customer {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  product_id: ObjectID;

  @Column()
  customer_id: ObjectID;

  @Column()
  qtd: number;

  @Column()
  price: number;

  @Column()
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Customer;
