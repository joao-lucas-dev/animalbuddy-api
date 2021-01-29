import { verify } from 'jsonwebtoken';
import AppError from '@shared/errors/AppError';
import authConfig from '@config/auth';

class ValidateTokenService {
  async execute(token: string): Promise<void> {
    try {
      verify(token, authConfig.jwt.secret || '');
    } catch (err) {
      throw new AppError('Invalid JWT token.', 401);
    }
  }
}

export default ValidateTokenService;
