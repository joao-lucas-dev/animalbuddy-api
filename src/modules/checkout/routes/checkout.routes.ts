import { Router } from 'express';

import CreateCheckoutService from '../services/CreateCheckoutService';
import UpdateOrderService from '../services/UpdateOrderService';

const checkoutRouter = Router();

checkoutRouter.post('/webhook', async (request, response) => {
  const { data } = request.body;

  const updateOrderService = new UpdateOrderService();

  await updateOrderService.execute({
    data,
  });

  return response.send();
});

checkoutRouter.post('/', async (request, response) => {
  const { items, payer } = request.body;

  const createCheckoutService = new CreateCheckoutService();

  const {
    init_point,
    sandbox_init_point,
  } = await createCheckoutService.execute({
    items,
    payer,
  });

  return response.json({ init_point, sandbox_init_point });
});

export default checkoutRouter;

// status = approved, in_progress, pending (boleto, pagamento na lotérica)
