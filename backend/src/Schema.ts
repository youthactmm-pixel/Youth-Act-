import mongoose from 'mongoose'
const Schema = mongoose.Schema

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
    image: {
      type: String,
      required: [true, 'photo is required'],
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
      unique: true,
      trim: true,
    },
  },
  {
    collection: 'towns',
    timestamps: true,
  },
)

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    role: {
      type: String,
      default: 'admin',
    },
  },
  {
    collection: 'users',
    timestamps: true,
  },
)

const Card = mongoose.model('Card', cardSchema)
const Town = mongoose.model('Town', townSchema)
const User = mongoose.model('User', userSchema)

export { Card, Town, User }