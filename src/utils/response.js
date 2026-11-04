/**
 * Standard API Response helpers
 */

function successResponse(res, data = null, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message = "Error", statusCode = 500, errors = null) {
  const body = {
    success: false,
    message,
  };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

function paginatedResponse(res, data = [], page = 1, limit = 10, total = 0, message = "Success") {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}

// Backward compatibility with existing codebase
const success = (res, data, message = "Success") => successResponse(res, data, message, 200);
const paginated = (res, data, page, limit, total) => paginatedResponse(res, data, page, limit, total);

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  success,
  paginated,
};
