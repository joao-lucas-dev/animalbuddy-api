import 'reflect-metadata';
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import { errors } from 'celebrate';
import cors from 'cors';
import { CronJob } from 'cron';

import AppError from '@shared/errors/AppError';
import uploadConfig from '@config/upload';
import SendEmailAbandonedCartService from '@modules/checkout/services/SendEmailAbandonedCartService';
import CancelOrderService from '@modules/checkout/services/CancelOrderService';
import routes from './routes';

import '@shared/database';

const app = express();

const whitelist = [
  'https://animalbuddy.com.br/',
  'https://dashboard.animalbuddy.com.br/',
];

const corsOptions = {
  origin(origin: any, callback: any) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(routes);

app.use(errors());

app.use('/images', express.static(uploadConfig.directory));

app.use((err: Error, request: Request, response: Response, _: NextFunction) => {
  console.log(err);

  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  return response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

const job1 = new CronJob(
  '0 */59 * * * *',
  async () => {
    const sendEmailAbandonedCartService = new SendEmailAbandonedCartService();

    await sendEmailAbandonedCartService.execute();
  },
  null,
  false,
  'America/Sao_Paulo',
);

const job2 = new CronJob(
  '0 0 */23 * * *',
  async () => {
    const cancelOrderService = new CancelOrderService();

    await cancelOrderService.execute();
  },
  null,
  false,
  'America/Sao_Paulo',
);

job1.start();
job2.start();

app.listen(process.env.PORT || 8081, () => {
  console.log(`🚀 Server started on port ${process.env.PORT || 8081}!`);
});
