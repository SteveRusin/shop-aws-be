import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

const app = express();
const port = process.env.port || 3001;
app.use(express.json());

app.all('/*', (req, res) => {
  console.log(
    'req',
    JSON.stringify({
      body: req.body,
      url: req.url,
      originalUrl: req.originalUrl,
      headers: req.headers,
    })
  );

  const recipient = req.originalUrl.split('/')[1];

  console.log('recipient', recipient);

  const recipientUrl = process.env[recipient];

  console.log('found url', recipientUrl);

  if (recipientUrl) {
    const config = {
      method: req.method,
      url: `${recipientUrl}${req.originalUrl}`,
      headers: {
        ...req.headers,
        host: parse(recipientUrl).host
      },
      ...(Object.keys(req.body || {}).length > 0 && { data: req.body }),
    };

    console.log('axios config', config);

    axios(config)
      .then((response) => {
        console.log('response data', response);
        res.json(response.data);
      })
      .catch((error) => {
        console.log('ERROR:', error);

        if (error.response) {
          res.status(error.response.status).json(error.response.data);
        } else {
          res.status(500).json({ error: error.message });
        }
      });
  } else {
    res.status(502).json({ error: 'Cannot process request' });
  }
});

app.listen(port, () => {
  console.log(`App is listening at http://localhost:/${port}`);
});
