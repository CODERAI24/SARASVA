class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes from unexpected bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
