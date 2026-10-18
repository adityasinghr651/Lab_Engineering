// src/middleware/validate.js
const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    const dataToValidate =
      schema.shape && (schema.shape.body || schema.shape.params || schema.shape.query)
        ? { body: req.body, params: req.params, query: req.query }
        : req.body;

    const parsed = schema.parse(dataToValidate);

    if (!schema.shape || (!schema.shape.body && !schema.shape.params && !schema.shape.query)) {
      req.body = parsed;
    }
    next();
  } catch (err) {
    if (err.name === 'ZodError' || err.issues || err.errors) {
      const issues = err.issues || err.errors || [];
      const message = issues.map((i) => i.message).join(', ') || 'Validation error';
      return next(new AppError(message, 400));
    }
    next(err);
  }
};

module.exports = validate;

