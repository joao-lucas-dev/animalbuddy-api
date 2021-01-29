import path from 'path';
import fs from 'fs';
import mime from 'mime';
import aws, { S3 } from 'aws-sdk';

import uploadConfig from '@config/upload';
import AppError from '@shared/errors/AppError';

interface IRequest {
  images: Array<string>;
  bucket: string;
}

interface IDeleteFileS3 {
  filename: string;
  bucket: string;
}

class Storage {
  private client: S3;

  constructor() {
    this.client = new aws.S3({
      region: 'us-east-1',
    });
  }

  async saveFilesInS3({ images, bucket }: IRequest): Promise<void> {
    await Promise.all(
      images.map(async (img) => {
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

  async deleteFileInS3({ filename, bucket }: IDeleteFileS3): Promise<void> {
    await this.client
      .deleteObject({
        Bucket: bucket,
        Key: filename,
      })
      .promise();
  }

  async deleteFileInDisk(filename: string): Promise<void> {
    const originalPath = path.resolve(uploadConfig.directory, filename);

    const imageFileExists = await fs.promises.stat(originalPath);

    if (imageFileExists) {
      await fs.promises.unlink(originalPath);
    }
  }
}

export default Storage;
