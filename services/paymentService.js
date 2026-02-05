// Payment service for handling payment processing
// Supports multiple payment gateways like Razorpay and Stripe

const Razorpay = require('razorpay');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Initialize Razorpay instance
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay order
 * @param {number} amount - Amount in paisa (multiply rupees by 100)
 * @param {string} currency - Currency code (default: INR)
 * @param {Object} options - Additional options
 * @returns {Object} Razorpay order object
 */
const createRazorpayOrder = async (amount, currency = 'INR', options = {}) => {
  try {
    const orderOptions = {
      amount: amount * 100, // Convert to paisa
      currency,
      receipt: options.receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture
      ...options
    };

    // Placeholder: Create Razorpay order
    const order = await razorpay.orders.create(orderOptions);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment
 * @param {Object} paymentData - Payment verification data
 * @returns {boolean} Verification status
 */
const verifyRazorpayPayment = (paymentData) => {
  try {
    // Placeholder: Implement Razorpay payment verification
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    return expectedSign === razorpay_signature;
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return false;
  }
};

/**
 * Create Stripe payment intent
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (default: usd)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Stripe payment intent
 */
const createStripePaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Confirm Stripe payment
 * @param {string} paymentIntentId - Payment intent ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Object} Confirmed payment intent
 */
const confirmStripePayment = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    throw new Error('Failed to confirm payment');
  }
};

/**
 * Refund payment
 * @param {string} paymentId - Payment ID to refund
 * @param {number} amount - Amount to refund (optional, full refund if not specified)
 * @param {string} gateway - Payment gateway ('razorpay' or 'stripe')
 * @returns {Object} Refund object
 */
const refundPayment = async (paymentId, amount, gateway = 'razorpay') => {
  try {
    if (gateway === 'razorpay') {
      // Placeholder: Implement Razorpay refund
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? amount * 100 : undefined
      });
      return refund;
    } else if (gateway === 'stripe') {
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? amount * 100 : undefined
      });
      return refund;
    } else {
      throw new Error('Unsupported payment gateway');
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

/**
 * Get payment status
 * @param {string} paymentId - Payment ID
 * @param {string} gateway - Payment gateway ('razorpay' or 'stripe')
 * @returns {Object} Payment status
 */
const getPaymentStatus = async (paymentId, gateway = 'razorpay') => {
  try {
    if (gateway === 'razorpay') {
      // Placeholder: Get Razorpay payment status
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } else if (gateway === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      return paymentIntent;
    } else {
      throw new Error('Unsupported payment gateway');
    }
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw new Error('Failed to get payment status');
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createStripePaymentIntent,
  confirmStripePayment,
  refundPayment,
  getPaymentStatus
};
