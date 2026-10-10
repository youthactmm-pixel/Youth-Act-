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
    images: {
      type: [String],
      default: [],
    },
  },
  {
    collection: 'cards',
    timestamps: true,
  },
)

const storySchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: 160,
    },
    type: {
      type: String,
      required: [true, 'story type is required'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      maxlength: 4000,
    },
    image: {
      type: String,
      required: [true, 'photo is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft'],
      default: 'draft',
      trim: true,
    },
  },
  {
    collection: 'stories',
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

const googleSheetImportSchema = new Schema(
  {
    sourceUrl: {
      type: String,
      required: [true, 'sourceUrl is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
      trim: true,
    },
    headers: {
      type: [String],
      default: [],
    },
    rowCount: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'googleSheetImports',
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

const climateReportSchema = new Schema(
  {
    externalId: { type: String, unique: true, sparse: true, trim: true },
    township: { type: String, trim: true, maxlength: 120, default: 'Unspecified' },
    issueType: { type: String, required: true, trim: true, maxlength: 120 },
    observationDate: { type: Date, required: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      required: true,
    },
    sourceDescription: { type: String, trim: true, maxlength: 2000, default: '' },
    approvedDescription: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    verified: { type: Boolean, default: false },
  },
  { collection: 'climateReports', timestamps: true }
)

const Card = mongoose.model('Card', cardSchema)
const Story = mongoose.model('Story', storySchema)
const User = mongoose.model('User', userSchema)
const GoogleSheetImport = mongoose.model('GoogleSheetImport', googleSheetImportSchema)
const Town = mongoose.model('Town', townSchema)
const ClimateReport = mongoose.model('ClimateReport', climateReportSchema)

export { Card, Story, User, GoogleSheetImport, Town, ClimateReport }