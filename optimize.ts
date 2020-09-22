import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';
import { basename, extname } from 'path';

const S3 = new AWS.S3();

export default async function handle ({ Payload }: AWS.S3.RecordsEvent) {
  try {
    const records: any = Payload

    await Promise.all(
      records.map(async record => {
        const key: string  = record.s3.object.key;
        const bucket: string = process.env.bucket || '';

        const image: AWS.S3.GetObjectOutput = await S3.getObject({
          Bucket: bucket,
          Key: key
        }).promise();

        const optimized = await sharp(<sharp.SharpOptions>image.Body)
          .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
          .toFormat('jpeg', { progressive: true, quality: 50 })
          .toBuffer();

        await S3.putObject({
          Body: optimized,
          Bucket: bucket,
          ContentType: 'image/jpeg',
          Key: `compressed/${basename(key, extname(key))}.jpg`
        }).promise();
      })
    );

    return {
      statusCode: 204,
    };
  } catch (err) {
    return err;
  }
};
