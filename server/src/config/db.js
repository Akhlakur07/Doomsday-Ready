const dns = require('dns');
const mongoose = require('mongoose');

let cachedPromise = null;

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 * Caches the connection promise so warm serverless invocations reuse the pool.
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is missing.');
  }

  if (uri.startsWith('mongodb+srv://')) {
    const servers = dns.getServers();
    const onlyLoopback =
      servers.length === 0 ||
      servers.every((addr) => addr === '127.0.0.1' || addr === '::1');
    if (onlyLoopback) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
  }

  const options = {};
  try {
    const parsed = new URL(uri);
    if (!parsed.pathname || parsed.pathname === '/') {
      options.dbName = 'doomsday_ready';
    }
  } catch {
    // Ignore URL parse errors for non-standard connection strings
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(uri, options)
      .then(() => {
        console.log('Connected to MongoDB');
        return mongoose.connection;
      })
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }

  return cachedPromise;
}

module.exports = { connectDB };
