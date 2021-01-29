import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import AuthenticateUserService from '../services/AuthenticateUserService';
import ValidateTokenService from '../services/ValidateTokenService';

const sessionsRouter = Router();

sessionsRouter.post(
  '/',
  celebrate({
    [Segments.BODY]: {
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { email, password } = request.body;

    const authenticateUser = new AuthenticateUserService();

    const { user, token } = await authenticateUser.execute({
      email,
      password,
    });

    return response.json({ user, token });
  },
);

sessionsRouter.get(
  '/validate/:token',
  celebrate({
    [Segments.PARAMS]: {
      token: Joi.string().required(),
    },
  }),
  async (request, response) => {
    const { token } = request.params;

    const validateTokenService = new ValidateTokenService();

    await validateTokenService.execute(token);

    return response.send();
  },
);

export default sessionsRouter;
