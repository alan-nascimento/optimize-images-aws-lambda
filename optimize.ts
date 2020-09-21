import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';
import { basename, extname } from 'path';

export default async function handle ({ Records: records }, context) {
  try {
    const S3 = new AWS.S3()

    await Promise.all(records.map(async record => {
      const { key } = record.s3.object;

      const image = await S3.getObject({
        Bucket: process.env.bucket,
        Key: key
      }).promise();

      const optimized = await sharp(image.Body)
        .resize(1200, 720, { fit: 'inside', withoutEnlargement: true })
        .toFormat('jpeg', { progressive: true, quality: 50 })
        .toBuffer()

      await S3.putObject({
        Body: optimized,
        Bucket: process.env.bucket,
        ContentType: 'image/jpeg',
        Key: `compressed/${basename(key, extname(key))}.jpg`
      }).promise()
    }));

    return {
      statusCode: 204,
    }
  } catch (err) {
    return err;
  }
};
