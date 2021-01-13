import { ObjectID } from 'mongodb';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import AppError from '@shared/errors/AppError';
import authConfig from '@config/auth';

import User from '../schemas/User';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: {
    _id: ObjectID;
    email: string;
  };
  token: string;
}

class AuthenticateUserService {
  async execute({ email, password }: IRequest): Promise<IResponse> {
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const token = sign({}, authConfig.jwt.secret || '', {
      subject: user._id.toString(),
      expiresIn: authConfig.jwt.expiresIn,
    });

    const userObj = {
      _id: user._id,
      email: user.email,
    };

    return { user: userObj, token };
  }
}

export default AuthenticateUserService;
