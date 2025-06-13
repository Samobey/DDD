const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Writable } = require('stream');

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://minio:9000',
  credentials: {
    accessKeyId: 'minio',
    secretAccessKey: 'minio123'
  },
  forcePathStyle: true
});

async function downloadFile(bucket, key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const data = await s3.send(command);

  return new Promise((resolve, reject) => {
    const chunks = [];
    data.Body.on('data', chunk => chunks.push(chunk));
    data.Body.on('end', () => resolve(Buffer.concat(chunks)));
    data.Body.on('error', reject);
  });
}

module.exports = { downloadFile };