function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ success: false, message: err.message || 'Server error', ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}) });
}
module.exports = { notFound, errorHandler };
