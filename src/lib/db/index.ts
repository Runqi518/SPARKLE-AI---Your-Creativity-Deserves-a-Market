import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

// 建立 SQLite 连接
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'database.sqlite'),
  logging: false,
});

// Project 表
export const Project = sequelize.define('Project', {
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
export const Canvas = sequelize.define('Canvas', {
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
export const GenerationJob = sequelize.define('GenerationJob', {
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
export const Subject = sequelize.define('Subject', {
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
Project.hasOne(Canvas, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Canvas.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(GenerationJob, { foreignKey: 'projectId', onDelete: 'CASCADE' });
GenerationJob.belongsTo(Project, { foreignKey: 'projectId' });

// 标的一对多项目（一个标的可以驱动多个画布）
Subject.hasMany(Project, { foreignKey: 'subjectId', onDelete: 'SET NULL' });
Project.belongsTo(Subject, { foreignKey: 'subjectId' });

// 初始化数据库同步
let isSynced = false;
export async function syncDatabase() {
  if (!isSynced) {
    // 表结构已稳定，仅创建缺失的表；alter 模式在 SQLite + 外键下会反复重建表导致迁移卡死
    await sequelize.sync();
    // Seed 示例营销标的
    const subjectCount = await Subject.count();
    if (subjectCount === 0) {
      await Subject.bulkCreate([
        {
          name: 'Nike Air Max 春季上新',
          type: 'product',
          brief: '春季主推款气垫跑鞋，主打城市轻运动场景，需要一波信息流投放素材。',
          sellingPoints: ['全掌气垫缓震', '透气网面', '轻量化设计'],
          targetAudience: '18-30岁城市运动人群',
          brandKit: { colors: ['#FF2D55', '#111111'], tone: '热血、年轻、街头', forbidden: ['竞品Logo'] },
        },
        {
          name: '618 品牌大促 Campaign',
          type: 'campaign',
          brief: '618 全店大促，需要统一视觉的主视觉、倒计时海报和短视频素材矩阵。',
          sellingPoints: ['全场5折起', '前2小时折上折', '会员专享'],
          targetAudience: '全店老客与价格敏感新客',
          brandKit: { colors: ['#FF2D55'], tone: '紧迫感、利益点前置', forbidden: [] },
        },
        {
          name: '《幻塔》手游买量',
          type: 'ip',
          brief: '二次元开放世界手游新版本买量，突出新角色与新地图，目标是拉新注册。',
          sellingPoints: ['新角色首发', '开放世界', '高自由度捏脸'],
          targetAudience: '二次元手游玩家',
          brandKit: { colors: ['#7C6CFF'], tone: '幻想、燃', forbidden: [] },
        },
      ]);
    }
    isSynced = true;
  }
}