import path from 'path';
import fs from 'fs';
import mime from 'mime';
import aws, { S3 } from 'aws-sdk';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

interface IObjImage {
  filename: string;
}

interface IRequest {
  productImages: Array<IObjImage>;
  bucket: string;
}

class Storage {
  private client: S3;

  constructor() {
    this.client = new aws.S3({
      region: 'us-east-1',
    });
  }

  async saveFiles({ productImages, bucket }: IRequest): Promise<void> {
    await Promise.all(
      productImages.map(async (img) => {
        const originalPath = path.resolve(uploadConfig.directory, img.filename);

        const ContentType = mime.getType(originalPath);

        if (!ContentType) {
          throw new AppError('File not found');
        }

        if (process.env.STORAGE_DRIVER === 's3') {
          const fileContent = await fs.promises.readFile(originalPath);

          this.client
            .putObject({
              Bucket: bucket,
              Key: img.filename,
              ACL: 'public-read',
              Body: fileContent,
              ContentType,
            })
            .promise();

          await fs.promises.unlink(originalPath);
        } else {
          const imageFileExists = await fs.promises.stat(originalPath);

          if (imageFileExists) {
            await fs.promises.unlink(originalPath);
          }
        }
      }),
    );
  }

  async deleteFiles({ productImages, bucket }: IRequest): Promise<void> {
    await Promise.all(
      productImages.map(async (img) => {
        if (process.env.STORAGE_DRIVER === 's3') {
          await this.client
            .deleteObject({
              Bucket: bucket,
              Key: img.filename,
            })
            .promise();
        } else {
          const originalPath = path.resolve(
            uploadConfig.directory,
            img.filename,
          );

          const imageFileExists = await fs.promises.stat(originalPath);

          if (imageFileExists) {
            await fs.promises.unlink(originalPath);
          }
        }
      }),
    );
  }
}

export default Storage;
