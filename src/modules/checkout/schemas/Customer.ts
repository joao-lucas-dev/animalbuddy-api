import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: String,

    surname: String,

    email: String,

    phone: String,

    cpf: String,

    zipCode: String,

    street: String,

    number: Number,

    complement: String,

    city: String,

    state: String,

    country: String,

    orders: Array,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model('Customer', customerSchema);
