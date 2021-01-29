import 'reflect-metadata';
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import { errors } from 'celebrate';
import cors from 'cors';

import AppError from '@shared/errors/AppError';
import uploadConfig from '@config/upload';
import routes from './routes';

import '@shared/database';

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.use(errors());

app.use('/images', express.static(uploadConfig.directory));

app.use((err: Error, request: Request, response: Response, _: NextFunction) => {
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

app.listen(8081, () => {
  console.log('🚀 Server started on port 8081!');
});
