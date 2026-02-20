import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const URL = 'http://localhost:5000/api/payment/webhook';

if (!SECRET) {
    console.error('❌ RAZORPAY_WEBHOOK_SECRET not found in .env');
    process.exit(1);
}

// Mock Payload matching Razorpay structure
const payload = {
    "entity": "event",
    "account_id": "acc_test",
    "event": "payment.captured",
    "contains": [
        "payment"
    ],
    "payload": {
        "payment": {
            "entity": {
                "id": "pay_test_" + Date.now(),
                "entity": "payment",
                "amount": 50000,
                "currency": "INR",
                "status": "captured",
                "order_id": "order_test_" + Date.now(),
                "notes": {
                    "orderId": "65c3f..." // Mock Order ID
                }
            }
        }
    },
    "created_at": Date.now()
};

// Create Signature
const payloadString = JSON.stringify(payload);
const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payloadString)
    .digest('hex');

console.log('🚀 Sending Test Webhook...');
console.log('URL:', URL);
console.log('Secret (Last 4):', SECRET.slice(-4));
console.log('Signature:', signature);

// Send Request
axios.post(URL, payload, {
    headers: {
        'x-razorpay-signature': signature,
        'Content-Type': 'application/json'
    }
})
    .then(response => {
        console.log('✅ Success! Server responded with:', response.data);
    })
    .catch(error => {
        if (error.response) {
            console.error('❌ Server Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Network/Script Error:', error.message);
        }
    });
