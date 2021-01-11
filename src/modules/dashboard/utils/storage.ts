import path from 'path';
import fs from 'fs';
import mime from 'mime';
import aws, { S3 } from 'aws-sdk';

import uploadConfig from '@config/upload';
import AppError from '@shared/errors/AppError';

interface IRequest {
  productImages: Array<string>;
  bucket: string;
}

class Storage {
  private client: S3;

  constructor() {
    this.client = new aws.S3({
      region: 'us-east-1',
    });
  }

  async saveFilesInS3({ productImages, bucket }: IRequest): Promise<void> {
    await Promise.all(
      productImages.map(async (img) => {
        const originalPath = path.resolve(uploadConfig.directory, img);

        const ContentType = mime.getType(originalPath);

        if (!ContentType) {
          throw new AppError('File not found');
        }

        const fileContent = await fs.promises.readFile(originalPath);

        this.client
          .putObject({
            Bucket: bucket,
            Key: img,
            ACL: 'public-read',
            Body: fileContent,
            ContentType,
          })
          .promise();

        await fs.promises.unlink(originalPath);
      }),
    );
  }

  async deleteFilesInS3({ productImages, bucket }: IRequest): Promise<void> {
    await Promise.all(
      productImages.map(async (img) => {
        await this.client
          .deleteObject({
            Bucket: bucket,
            Key: img,
          })
          .promise();
      }),
    );
  }

  async deleteFilesInDisk(productImages: Array<string>): Promise<void> {
    await Promise.all(
      productImages.map(async (img) => {
        const originalPath = path.resolve(uploadConfig.directory, img);

        const imageFileExists = await fs.promises.stat(originalPath);

        if (imageFileExists) {
          await fs.promises.unlink(originalPath);
        }
      }),
    );
  }
}

export default Storage;
