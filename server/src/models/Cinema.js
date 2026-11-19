const mongoose = require('mongoose');

function validateBundleSizes(sizes) {
  if (!Array.isArray(sizes) || sizes.length < 1 || sizes.length > 10) {
    return false;
  }

  const seen = new Set();
  for (const size of sizes) {
    if (!Number.isInteger(size) || size < 1 || size > 500 || seen.has(size)) {
      return false;
    }
    seen.add(size);
  }
  return true;
}

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cinema name is required.'],
      unique: true,
      trim: true,
    },
    bundleSizes: {
      type: [Number],
      required: [true, 'Bundle sizes are required.'],
      validate: {
        validator: validateBundleSizes,
        message:
          'bundleSizes must contain 1 to 10 unique integers, each between 1 and 500.',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cinema', cinemaSchema);
