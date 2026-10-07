import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { installOwnership } from './ownership';
import { installMigrations } from './migrations';
import { withActor, LOCAL_OWNER } from '../actor';

// Create the SQLite connection
const runtime = globalThis as typeof globalThis & { sparkleDatabase?: Sequelize; sparkleSync?: Promise<void> };
const existingDatabase = runtime.sparkleDatabase;
export const sequelize = existingDatabase || new Sequelize({
  dialect: 'sqlite',
  storage: process.env.SPARKLE_DATABASE_PATH || path.join(process.cwd(), 'database.sqlite'),
  logging: false,
});
if (!existingDatabase) {
  runtime.sparkleDatabase = sequelize;
  installOwnership(sequelize);
  installMigrations(sequelize, process.env.SPARKLE_DATABASE_PATH || path.join(process.cwd(), 'database.sqlite'));
  const close = sequelize.close.bind(sequelize);
  let closed = false;
  sequelize.close = async () => {
    if (closed) return;
    closed = true;
    await close();
    if (runtime.sparkleDatabase === sequelize) { runtime.sparkleDatabase = undefined; runtime.sparkleSync = undefined; }
  };
}

// Project table
export const Project = sequelize.models.Project || sequelize.define('Project', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  basicType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  nodesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

// Canvas table
export const Canvas = sequelize.models.Canvas || sequelize.define('Canvas', {
  revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  projectId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nodes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  edges: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  }
});

// GenerationJob table (jobs)
export const GenerationJob = sequelize.models.GenerationJob || sequelize.define('GenerationJob', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nodeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
  resultUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// Subject table (marketing subjects: the commercialization hub)
export const Subject = sequelize.models.Subject || sequelize.define('Subject', {
  rewardCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    // product / campaign / service / ip / brand
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'product',
  },
  brief: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sellingPoints: {
    type: DataTypes.JSON, // Selling points array ["lightweight", "cushioning"]
    allowNull: true,
    defaultValue: [],
  },
  referenceAssets: {
    type: DataTypes.JSON, // Reference asset URL array
    allowNull: true,
    defaultValue: [],
  },
  targetAudience: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brandKit: {
    type: DataTypes.JSON, // Brand identity { colors: [], tone: "", forbidden: [] }
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active', // active / archived
  },
});

// Set up associations
if (!Project.associations.Canvas) Project.hasOne(Canvas, { foreignKey: 'projectId', onDelete: 'CASCADE' });
if (!Canvas.associations.Project) Canvas.belongsTo(Project, { foreignKey: 'projectId' });

if (!Project.associations.GenerationJobs) Project.hasMany(GenerationJob, { foreignKey: 'projectId', onDelete: 'CASCADE' });
if (!GenerationJob.associations.Project) GenerationJob.belongsTo(Project, { foreignKey: 'projectId' });

// One subject has many projects and can drive multiple canvases
if (!Subject.associations.Projects) Subject.hasMany(Project, { foreignKey: 'subjectId', onDelete: 'SET NULL' });
if (!Project.associations.Subject) Project.belongsTo(Subject, { foreignKey: 'subjectId' });

// Initialize database synchronization
export async function syncDatabase() {
  runtime.sparkleSync ??= withActor({ id: LOCAL_OWNER }, async () => {
    // The schema is stable; create missing tables only. SQLite alter with foreign keys can repeatedly rebuild tables and stall migrations
    await sequelize.sync();
    // Seed example marketing subjects
    const subjectCount = await Subject.count();
    if (subjectCount === 0) {
      await Subject.bulkCreate([
        {
          id: 'demo-bounty-nike-air-max',
          name: 'Nike Air Max Spring Launch',
          type: 'product',
          brief: 'Spring air-cushioned running shoe focused on light urban exercise; requires feed-ad assets.',
          sellingPoints: ['Full-length air cushioning', 'Breathable mesh', 'Lightweight design'],
          targetAudience: 'Urban fitness audiences aged 18–30',
          brandKit: { colors: ['#FF2D55', '#111111'], tone: 'Energetic, youthful, street-inspired', forbidden: ['Competitor logos'] },
        },
        {
          id: 'demo-bounty-brand-campaign',
          name: '618 Brand Sale Campaign',
          type: 'campaign',
          brief: 'Storewide 618 promotion requiring consistent hero visuals, countdown posters and short-video variants.',
          sellingPoints: ['Up to 50% off storewide', 'Extra savings during the first two hours', 'Members only'],
          targetAudience: 'Existing customers and price-sensitive new customers',
          brandKit: { colors: ['#FF2D55'], tone: 'Urgent, benefit-led', forbidden: [] },
        },
        {
          id: 'demo-bounty-game-launch',
          name: 'Tower of Fantasy Mobile Acquisition',
          type: 'ip',
          brief: 'Acquisition campaign for a new anime-style open-world mobile game release, emphasizing new characters and maps to drive registrations.',
          sellingPoints: ['New character debut', 'Open world', 'Flexible character customization'],
          targetAudience: 'Anime-style mobile game players',
          brandKit: { colors: ['#7C6CFF'], tone: 'Fantasy, high energy', forbidden: [] },
        },
      ], { ignoreDuplicates: true });
    }
    // Stable IDs make this additive seed safe for existing databases and repeated starts.
    await Subject.bulkCreate([
      {
        id: 'demo-bounty-scent-ritual',
        name: 'SORA · Everyday Fragrance', type: 'product',
        brief: 'Create a 15-second ad for an independent fragrance brand. Morning light, bottle textures and application gestures convey a restrained daily ritual.',
        sellingPoints: ['Bottle detail close-ups', 'Everyday use scenes', 'Minimal brand ending'],
        targetAudience: 'Young consumers interested in fragrance and lifestyle design',
        brandKit: { colors: ['#DCC9B1', '#FAF7F1'], tone: 'Warm, quiet, tactile', forbidden: ['Unsubstantiated benefits'] },
      },
      {
        id: 'demo-bounty-coffee-moment',
        name: 'EMBER · Time for Coffee', type: 'brand',
        brief: 'Create a specialty-coffee brand film showing authentic grinding, extraction and serving to convey the warmth of the cafe and its craft.',
        sellingPoints: ['Craft process', 'Authentic cafe atmosphere', 'Character–product interaction'],
        targetAudience: 'Urban commuters and specialty-coffee enthusiasts',
        brandKit: { colors: ['#A97856', '#EEE4D6'], tone: 'Natural, approachable, rhythmic', forbidden: [] },
      },
      {
        id: 'demo-bounty-audio-focus',
        name: 'FORM · The Sound of Focus', type: 'product',
        brief: 'Design a 20-second headphone ad showing fit and design through urban commuting and focused work. Base feature statements on supplied product information.',
        sellingPoints: ['Fit details', 'Commuting and work scenes', 'Product appearance'],
        targetAudience: 'Young urban consumers who value design and daily usability',
        brandKit: { colors: ['#B5BFCB', '#F4F5F7'], tone: 'Clear, minimal, modern', forbidden: ['Unverified performance specifications'] },
      },
    ], { ignoreDuplicates: true });
  }).catch(error => { runtime.sparkleSync = undefined; throw error; });
  await runtime.sparkleSync;
}
