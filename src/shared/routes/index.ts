import { Router } from 'express';

import sessionsRouter from '@modules/users/routes/sessions.routes';
import dashboardRouter from '@modules/dashboard/routes/dashboard.routes';
import storeRouter from '@modules/store/routes/store.routes';
import checkoutRouter from '@modules/checkout/routes/checkout.routes';

const routes = Router();

routes.get('/', (request, response) => {
  return response.json({ name: 'ForkStore API', version: '1.0.0' });
});

routes.use('/sessions', sessionsRouter);
routes.use('/dashboard', dashboardRouter);
routes.use('/store', storeRouter);
routes.use('/checkout', checkoutRouter);

export default routes;
