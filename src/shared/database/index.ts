import { connect } from 'mongoose';

connect(process.env.MONGODB_URL || '', {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
});
