
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');
const multer = require('multer');
const { Readable } = require('stream');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aq8mwv9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function run() {
  try {
    // await client.connect();
    const db = client.db("portfolio");
    const bucket = new GridFSBucket(db, { bucketName: 'resume_hafsa' });

    // Download endpoint
    app.get('/download/:id', (req, res) => {
      const id = new ObjectId(req.params.id);
      const downloadStream = bucket.openDownloadStream(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Hafsa_Rashid_Web_Developer_Resume.pdf"`
      });

      downloadStream.pipe(res);

      downloadStream.on('error', (err) => {
        console.error('Error downloading file:', err);
        res.status(404).send('File not found');
      });

      downloadStream.on('end', () => {
        res.end();
      });
    });

    // Upload endpoint
    // app.post('/upload', upload.single('file'), (req, res) => {
    //   const readableStream = new Readable();
    //   readableStream.push(req.file.buffer);
    //   readableStream.push(null);

    //   const uploadStream = bucket.openUploadStream(req.file.originalname);
    //   readableStream.pipe(uploadStream);

    //   uploadStream.on('finish', () => {
    //     res.status(201).send({ fileId: uploadStream.id });
    //   });

    //   uploadStream.on('error', (err) => {
    //     console.error('Error uploading file:', err);
    //     res.status(500).send('Error uploading file');
    //   });
    // });

    app.post('/contact', (req, res) => {
      const { name, email, subject, message } = req.body;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: email,
        to: 'hafsarashid028@gmail.com',
        subject: `Contact Form Submission: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          res.status(500).send('Failed to send message.');
        } else {
          console.log('Email sent:', info.response);
          res.status(200).send('Message sent successfully!');
        }
      });
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Portfolio is running');
});

app.listen(port, () => {
  console.log(`Portfolio is running on port ${port}`);
});
