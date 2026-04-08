# QYServer 插件技术文档

## 概述
QYServer 是一款基于 **LiteLoaderSE (LegacyScriptEngine-QuickJS)** 的 Minecraft Bedrock Server 服务端插件，为 QY 服务器提供核心功能支持。

## 依赖项
- legacy-script-engine-quickjs
- GMLIB-LegacyRemoteCallApi
- iListenAttentively-LseExport

## 架构设计

### 入口文件
- `QYServer.js` - 插件主入口，负责事件监听、命令注册、核心逻辑

### 目录结构

```
QYServer/
├── config/              # 配置文件目录
│   ├── config.js        # 主配置（封禁名单、服务器列表、消息配置等）
│   └── mail.json        # 邮件/公告配置
├── Data/                # 数据存储目录
│   ├── issues.txt       # 玩家反馈记录
│   └── System/          # 系统数据（群系映射、玩家时间等）
└── lib/                 # 功能模块
├── Game/            # 玩法类模块（邮件、皮肤效果、云朵电梯等）
├── World/           # 世界类模块（边界、挂机检测、群系提示等）
└── index.js         # 模块加载器
```

## 核心功能

### 1. 事件监听
| 事件 | 用途 |
|------|------|
| `onMobHurt` | 防搬方块、凋零防爆、重生锚限制 |
| `onChat` | 聊天格式美化、表情替换、AI对话触发 |
| `onJoin` | 封禁检测、新手指引、初始化执行 |
| `onPlaceBlock` | 禁止放置黑名单方块 |
| `onRespawn` | 生命值调整（死亡扣心） |

### 2. 命令系统
| 命令 | 说明 |
|------|------|
| `sinfo` | 查询服务器运行状态（TPS、内存、在线等） |
| `msgui` | 快捷私聊菜单 |
| `chattag` | 设置聊天称号 |
| `offhand` | 主副手物品交换 |
| `helmet` | 头盔与主手交换 |
| `nodeui` / `server` | 线路节点选择 |
| `tpserver` / `qyserver` | 跨服传送 |
| `issues` | 问题反馈 |
| `mail` | 邮件系统 |

### 3. 辅助功能
- **合成表管理**：注册/注销合成配方
- **PAPI变量**：`%QYServer_player_chatTag%`
- **AI对话**：集成豆包API，玩家聊天触发
- **经验修补**：潜行使用物品触发
- **云朵电梯**：跳跃上楼/潜行下楼
- **世界边界**：限制玩家活动范围

## 配置说明

### 封禁系统
```javascript
banName: Set     // 玩家名封禁
banXuid: Set     // XUID封禁
banClient: Set   // 客户端ID封禁
banBlock: Set    // 禁止放置的方块类型
```

### 服务器列表
支持多服务器跳转，需校验协议版本匹配。

### 表情替换
replaceMap 将 Unicode emoji 映射为自定义纹理字符（ 等）。

### 轮播消息
wordList + wordtime（分钟间隔）控制服务器提示消息。

## 导出接口
供其他LSE插件调用的函数：

- LandJudgment - 领地权限判断
- getChatTag - 获取玩家聊天称号
- crash - 崩溃玩家客户端
- getFileSize / formatSeconds / probability - 工具函数
- msgUI / setChatTag - UI交互
- textToEmoji / mcCode2Ansi - 文本转换
- aiChatServer - AI对话

技术特点

- 使用 BinaryStream + 数据包实现自定义UI容器（假箱子）
- JsonConfigFile 进行数据持久化
- setInterval 实现定时任务（延迟检测、光环耐久、一言推送）
- ll.exports / ll.imports 实现模块间通信
