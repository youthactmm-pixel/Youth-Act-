import mongoose from 'mongoose'
const Schema = mongoose.Schema;

const cardSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      trim: true,
    },
  },
  {
    collection: 'cards',
    timestamps: true,
  },
)

const townSchema = new Schema(
  {
    town: {
      type: String,
      required: [true, 'town is required'],
      trim: true,
    },
  },
  {
    collection: 'towns',
    timestamps: true,
  },
)

const Card = mongoose.model('Card', cardSchema)
const Town = mongoose.model('Town', townSchema)

export { Card, Town }