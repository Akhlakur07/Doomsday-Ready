/**
 * Custom application error carrying an HTTP status code and machine-readable error code.
 */
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Express error-handling middleware that formats errors consistently.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
    });
  }

  // Invalid JSON request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Request body contains invalid JSON.',
    });
  }

  // Mongoose schema validation error
  if (err && err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: messages.join('; '),
    });
  }

  // Mongoose cast error (for example malformed ObjectId)
  if (err && err.name === 'CastError') {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: `Invalid value for ${err.path}.`,
    });
  }

  // MongoDB unique index violation
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: 'DUPLICATE_ENTRY',
      message: `A record with that ${field} already exists.`,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  });
}

module.exports = { AppError, errorHandler };
