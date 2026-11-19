const Cinema = require('../models/Cinema');
const { AppError } = require('../middleware/errorHandler');
const { calculateBookingQuote } = require('../algorithms/bundleBooking');

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeCinema(doc) {
  return {
    _id: String(doc._id),
    name: doc.name,
    bundleSizes: doc.bundleSizes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function validateBundleSizes(bundleSizes) {
  if (!Array.isArray(bundleSizes) || bundleSizes.length < 1 || bundleSizes.length > 10) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'bundleSizes must contain between 1 and 10 bundle sizes.'
    );
  }

  const seen = new Set();
  for (const size of bundleSizes) {
    if (!Number.isInteger(size) || size < 1 || size > 500) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Each bundle size must be a whole number between 1 and 500.'
      );
    }
    if (seen.has(size)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        `Duplicate bundle size ${size} is not allowed.`
      );
    }
    seen.add(size);
  }

  return [...bundleSizes].sort((a, b) => a - b);
}

async function listCinemas(req, res) {
  const cinemas = await Cinema.find().sort({ name: 1 }).lean();
  res.json(cinemas.map(serializeCinema));
}

async function createCinema(req, res) {
  const { name, bundleSizes } = req.body || {};

  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Cinema name is required.');
  }

  const cleanName = name.trim();
  const duplicate = await Cinema.findOne({
    name: { $regex: `^${escapeRegex(cleanName)}$`, $options: 'i' },
  }).lean();

  if (duplicate) {
    throw new AppError(409, 'DUPLICATE_CINEMA', `Cinema "${cleanName}" already exists.`);
  }

  const sortedBundles = validateBundleSizes(bundleSizes);
  const created = await Cinema.create({
    name: cleanName,
    bundleSizes: sortedBundles,
  });

  res.status(201).json(serializeCinema(created));
}

async function deleteCinema(req, res) {
  const { id } = req.params;
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid cinema ID format.');
  }

  const deleted = await Cinema.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(404, 'CINEMA_NOT_FOUND', 'Cinema not found.');
  }

  res.json({ deletedId: id });
}

async function getBookingQuote(req, res) {
  const { id } = req.params;
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid cinema ID format.');
  }

  const cinema = await Cinema.findById(id).lean();
  if (!cinema) {
    throw new AppError(404, 'CINEMA_NOT_FOUND', 'Cinema not found.');
  }

  const rawGroupSize = String(req.query.groupSize ?? '').trim();
  if (!/^\d+$/.test(rawGroupSize)) {
    throw new AppError(
      400,
      'INVALID_GROUP_SIZE',
      'groupSize must be a whole number between 1 and 10000.'
    );
  }

  const groupSize = Number.parseInt(rawGroupSize, 10);
  if (groupSize < 1 || groupSize > 10000) {
    throw new AppError(
      400,
      'INVALID_GROUP_SIZE',
      'groupSize must be a whole number between 1 and 10000.'
    );
  }

  const quote = calculateBookingQuote(cinema.bundleSizes, groupSize);

  res.json({
    cinemaId: String(cinema._id),
    cinemaName: cinema.name,
    bundleSizes: cinema.bundleSizes,
    groupSize,
    possible: quote.possible,
    totalBundles: quote.totalBundles,
    bundles: quote.bundles,
    message: quote.possible
      ? `${quote.totalBundles} bundle${quote.totalBundles === 1 ? '' : 's'} required`
      : 'Not possible',
  });
}

module.exports = {
  listCinemas,
  createCinema,
  deleteCinema,
  getBookingQuote,
};
