import { Router } from 'express';

import CreateCheckoutService from '../services/CreateCheckoutService';

const checkoutRouter = Router();

checkoutRouter.post('/notifications', async (request, response) => {
  const { topic, payment } = request.query;

  return response.json({ topic, payment });
});

checkoutRouter.post('/', async (request, response) => {
  const { items, payer } = request.body;

  const createCheckoutService = new CreateCheckoutService();

  const data = await createCheckoutService.execute({
    items,
    payer,
  });

  return response.json(data);
});

export default checkoutRouter;
