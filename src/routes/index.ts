import { Router } from 'express';

import sessionsRouter from './sessions.routes';
import productsRouter from './products.routes';
import checkoutRouter from './checkout.routes';

const routes = Router();

routes.get('/', (request, response) => {
  return response.json({ name: 'ForkStore API', version: '1.0.0' });
});

routes.use('/sessions', sessionsRouter);
routes.use('/products', productsRouter);
routes.use('/checkout', checkoutRouter);

export default routes;
