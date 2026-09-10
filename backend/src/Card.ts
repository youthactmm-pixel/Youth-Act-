import mongoose from 'mongoose'

const cardSchema = new mongoose.Schema(
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

export default mongoose.models.Card || mongoose.model('Card', cardSchema)
