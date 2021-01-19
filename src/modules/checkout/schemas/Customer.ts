import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  surname: string;
  email: string;
  phone: string;
  cpf: string;
  zipCode: string;
  street: string;
  number: number;
  complement: string;
  city: string;
  state: string;
  country: string;
  orders: Array<Schema.Types.ObjectId>;
}

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    surname: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    cpf: {
      type: String,
      required: true,
      unique: true,
    },

    zipCode: {
      type: String,
      required: true,
    },

    street: {
      type: String,
      required: true,
    },

    number: {
      type: Number,
      required: true,
    },

    complement: {
      type: String,
      required: false,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    orders: {
      type: Array,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<ICustomer>('Customer', customerSchema);
