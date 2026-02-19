// Simple health check endpoint - no database required
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'smart-dispatch-api',
    version: '1.0.0'
  });
};
