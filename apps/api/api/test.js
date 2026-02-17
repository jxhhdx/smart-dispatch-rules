// 极简测试端点
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Vercel function is working',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
};
