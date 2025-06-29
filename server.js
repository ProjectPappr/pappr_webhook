import express from 'express';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Function to generate donor token
function generateDonorToken(name_first, email_address) {
  return crypto
    .createHash('sha256')
    .update(`${name_first.toLowerCase()}-${email_address.toLowerCase()}`)
    .digest('hex');
}
// Webhook endpoint
app.post('/payfast-webhook', async (req, res) => {
  const { amount_gross, name_first, email_address } = req.body;

  if (!amount_gross || !name_first || !email_address) {
    return res.status(400).send('Missing data');
  }
  // Generate donor token
  const donor_token = generateDonorToken(name_first, email_address);

  // Insert into Supabase
  const { error } = await supabase
    .from('donations')
    .insert([{ donor_token, amount_gross, name_first, email_address }]);

  if (error) {
    console.error(error);
    return res.status(500).send('Failed to store data');
  }

  return res.status(200).send('Webhook received and data stored');
});

app.listen(3000, () => {
  console.log('Webhook listening on port 3000');
});
