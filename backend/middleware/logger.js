// backend / middleware / Logger.js
export const requestLogger = (req, res, next) => {
  const time = new Date().toISOString();

  console.log(`[${time}] ${req.method} ${req.url} - IP: ${req.ip}`);

  next();
};
