// Validation schemas for order-related operations
// Uses Joi for input validation to ensure data integrity

const Joi = require('joi');

/**
 * Validation schema for creating a new order
 */
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(Joi.object({
      product: Joi.string()
        .required()
        .messages({
          'string.empty': 'Product ID is required'
        }),

      quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          'number.base': 'Quantity must be a number',
          'number.min': 'Quantity must be at least 1'
        }),

      price: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.base': 'Price must be a number',
          'number.min': 'Price cannot be negative'
        }),

      variant: Joi.object({
        size: Joi.string().optional(),
        color: Joi.string().optional()
      }).optional()
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item'
    }),

  shippingAddress: Joi.object({
    street: Joi.string()
      .required()
      .messages({
        'string.empty': 'Street address is required'
      }),

    city: Joi.string()
      .required()
      .messages({
        'string.empty': 'City is required'
      }),

    state: Joi.string()
      .required()
      .messages({
        'string.empty': 'State is required'
      }),

    zipCode: Joi.string()
      .required()
      .messages({
        'string.empty': 'Zip code is required'
      }),

    country: Joi.string()
      .required()
      .messages({
        'string.empty': 'Country is required'
      })
  })
  .required()
  .messages({
    'object.base': 'Shipping address is required'
  }),

  paymentMethod: Joi.string()
    .valid('card', 'paypal', 'razorpay', 'stripe')
    .required()
    .messages({
      'any.only': 'Payment method must be one of: card, paypal, razorpay, stripe'
    }),

  couponCode: Joi.string()
    .optional(),

  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

/**
 * Validation schema for updating order status
 */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled'
    }),

  trackingNumber: Joi.string()
    .when('status', {
      is: 'shipped',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.empty': 'Tracking number is required when status is shipped'
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

/**
 * Validation schema for order query parameters
 */
const orderQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50'
    }),

  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled'
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'totalAmount', 'status')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, totalAmount, status'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc'
    })
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema
};
