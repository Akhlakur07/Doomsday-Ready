const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      unique: true,
      trim: true,
    },
    releaseYear: {
      type: Number,
      required: [true, 'Release year is required.'],
      min: [1888, 'Release year must be at least 1888.'],
      max: [2100, 'Release year must be at most 2100.'],
      validate: {
        validator: Number.isInteger,
        message: 'Release year must be a whole number.',
      },
    },
    runtime: {
      type: Number,
      required: [true, 'Runtime is required.'],
      min: [1, 'Runtime must be between 1 and 300 minutes.'],
      max: [300, 'Runtime must be between 1 and 300 minutes.'],
      validate: {
        validator: Number.isInteger,
        message: 'Runtime must be a whole number.',
      },
    },
    prerequisites: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Movie',
        },
      ],
      default: [],
    },
    watched: {
      type: Boolean,
      default: false,
    },
    tmdbId: {
      type: Number,
      default: null,
    },
    mediaType: {
      type: String,
      enum: ['movie', 'tv'],
      default: 'movie',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    overview: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);
