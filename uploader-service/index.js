const express = require('express');
const multer = require('multer');
const { uploadFile } = require('./s3Client');
const { publishMessage } = require('./publisher');

const app = express();
const upload = multer();

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const key = `${Date.now()}-${file.originalname}`;

  await uploadFile('uploads', key, file.buffer);
  await publishMessage({ bucket: 'uploads', key });

  res.json({ message: 'File uploaded and claim check sent.', key });
});

app.listen(3000, () => console.log('Uploader running on port 3000'));