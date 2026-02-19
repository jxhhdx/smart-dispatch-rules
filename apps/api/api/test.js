// 极简测试端点 - 立即返回，不等待
module.exports = (req, res) => {
  // 立即返回，不执行任何异步操作
  res.status(200).json({
    status: 'ok',
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    nodeEnv: process.env.NODE_ENV || 'unknown'
  });
};
