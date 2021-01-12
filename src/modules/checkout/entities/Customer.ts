import {
  Entity,
  ObjectID,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

interface IProduct {
  _id: string;
  qtd: number;
  status: string;
  price: number;
  created_at: Date;
  updated_at: Date;
}

@Unique(['email'])
@Entity('customers')
class Customer {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  cpf: string;

  @Column()
  zipCode: string;

  @Column()
  street: string;

  @Column()
  number: number;

  @Column()
  complement: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  ordered_products: Array<IProduct>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default Customer;
