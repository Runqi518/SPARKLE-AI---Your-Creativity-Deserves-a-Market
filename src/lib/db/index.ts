import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { installOwnership } from './ownership';
import { installMigrations } from './migrations';
import { withActor, LOCAL_OWNER } from '../actor';

// 建立 SQLite 连接
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

// Project 表
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

// Canvas 表
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

// GenerationJob 表 (任务)
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

// Subject 表 (营销标的：商业化的中心枢纽)
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
    // product(实物商品) / campaign(品牌活动) / service(服务) / ip(内容IP) / brand(品牌)
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'product',
  },
  brief: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sellingPoints: {
    type: DataTypes.JSON, // 卖点数组 ["轻便", "缓震"]
    allowNull: true,
    defaultValue: [],
  },
  referenceAssets: {
    type: DataTypes.JSON, // 参考物料 URL 数组
    allowNull: true,
    defaultValue: [],
  },
  targetAudience: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brandKit: {
    type: DataTypes.JSON, // 品牌调性 { colors: [], tone: "", forbidden: [] }
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active', // active / archived
  },
});

// 设置关联关系
if (!Project.associations.Canvas) Project.hasOne(Canvas, { foreignKey: 'projectId', onDelete: 'CASCADE' });
if (!Canvas.associations.Project) Canvas.belongsTo(Project, { foreignKey: 'projectId' });

if (!Project.associations.GenerationJobs) Project.hasMany(GenerationJob, { foreignKey: 'projectId', onDelete: 'CASCADE' });
if (!GenerationJob.associations.Project) GenerationJob.belongsTo(Project, { foreignKey: 'projectId' });

// 标的一对多项目（一个标的可以驱动多个画布）
if (!Subject.associations.Projects) Subject.hasMany(Project, { foreignKey: 'subjectId', onDelete: 'SET NULL' });
if (!Project.associations.Subject) Project.belongsTo(Subject, { foreignKey: 'subjectId' });

// 初始化数据库同步
export async function syncDatabase() {
  runtime.sparkleSync ??= withActor({ id: LOCAL_OWNER }, async () => {
    // 表结构已稳定，仅创建缺失的表；alter 模式在 SQLite + 外键下会反复重建表导致迁移卡死
    await sequelize.sync();
    // Seed 示例营销标的
    const subjectCount = await Subject.count();
    if (subjectCount === 0) {
      await Subject.bulkCreate([
        {
          id: 'demo-bounty-nike-air-max',
          name: 'Nike Air Max 春季上新',
          type: 'product',
          brief: '春季主推款气垫跑鞋，主打城市轻运动场景，需要一波信息流投放素材。',
          sellingPoints: ['全掌气垫缓震', '透气网面', '轻量化设计'],
          targetAudience: '18-30岁城市运动人群',
          brandKit: { colors: ['#FF2D55', '#111111'], tone: '热血、年轻、街头', forbidden: ['竞品Logo'] },
        },
        {
          id: 'demo-bounty-brand-campaign',
          name: '618 品牌大促 Campaign',
          type: 'campaign',
          brief: '618 全店大促，需要统一视觉的主视觉、倒计时海报和短视频素材矩阵。',
          sellingPoints: ['全场5折起', '前2小时折上折', '会员专享'],
          targetAudience: '全店老客与价格敏感新客',
          brandKit: { colors: ['#FF2D55'], tone: '紧迫感、利益点前置', forbidden: [] },
        },
        {
          id: 'demo-bounty-game-launch',
          name: '《幻塔》手游买量',
          type: 'ip',
          brief: '二次元开放世界手游新版本买量，突出新角色与新地图，目标是拉新注册。',
          sellingPoints: ['新角色首发', '开放世界', '高自由度捏脸'],
          targetAudience: '二次元手游玩家',
          brandKit: { colors: ['#7C6CFF'], tone: '幻想、燃', forbidden: [] },
        },
      ], { ignoreDuplicates: true });
    }
    // Stable IDs make this additive seed safe for existing databases and repeated starts.
    await Subject.bulkCreate([
      {
        id: 'demo-bounty-scent-ritual',
        name: 'SORA · 香氛日常', type: 'product',
        brief: '为独立香氛品牌制作一条 15 秒广告。从清晨的光线、瓶身质感与使用动作，呈现一种克制的日常仪式感。',
        sellingPoints: ['瓶身细节特写', '日常使用场景', '简洁品牌收尾'],
        targetAudience: '喜欢香氛与生活方式设计的年轻消费者',
        brandKit: { colors: ['#DCC9B1', '#FAF7F1'], tone: '温暖、安静、有质感', forbidden: ['未经证实的功效'] },
      },
      {
        id: 'demo-bounty-coffee-moment',
        name: 'EMBER · 一杯咖啡的时间', type: 'brand',
        brief: '为精品咖啡店制作一条品牌短片，以磨豆、萃取与递出咖啡的真实动作，呈现门店的温度和手作过程。',
        sellingPoints: ['手作过程', '真实门店氛围', '人物与产品互动'],
        targetAudience: '城市通勤者与精品咖啡爱好者',
        brandKit: { colors: ['#A97856', '#EEE4D6'], tone: '自然、亲切、有节奏', forbidden: [] },
      },
      {
        id: 'demo-bounty-audio-focus',
        name: 'FORM · 专注的声音', type: 'product',
        brief: '为耳机产品设计一条 20 秒广告，用城市通勤与专注工作两个场景展示佩戴动作和产品设计，功能说明以提供的产品资料为准。',
        sellingPoints: ['佩戴细节', '通勤与工作场景', '产品外观展示'],
        targetAudience: '重视设计与日常使用体验的城市年轻人',
        brandKit: { colors: ['#B5BFCB', '#F4F5F7'], tone: '清晰、简洁、现代', forbidden: ['未经证实的性能参数'] },
      },
    ], { ignoreDuplicates: true });
  }).catch(error => { runtime.sparkleSync = undefined; throw error; });
  await runtime.sparkleSync;
}
