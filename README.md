# 📖 QYServer - 让光遇见方块 ✨

**光是遇见，就很美好 🌟**

一个为 LeviLamina 打造的温馨、功能丰富且充满"灵魂"的基岩版综合插件核心。

![Version](https://img.shields.io/badge/version-1.0.0--beta.3-blue)
![License](https://img.shields.io/badge/license-Unlicensed-red)
![Platform](https://img.shields.io/badge/platform-LeviLamina-green)

## ✨ 特性介绍

> "看好了小子，这一刀，会很帅" - 项目注释

### 🗣️ 傲娇的服务器娘
- 集成了AI聊天，她会陪你聊天、偶尔插嘴、帮你反馈问题，甚至在你骂她的时候会"回击"（注：无记忆，每次对话都是新的开始 QwQ）。

### ☁️ 云朵电梯
- 在云朵方块上跳跃或蹲下即可上下楼，再也不用爬梯子了！（设计初衷竟然是为了当墙壁？）。

### 📧 邮件系统
- 向玩家发送带附件的全服邮件，支持未读提醒和时效性管理。逢年过节发点小福利，温暖每一位旅人。

### 🎭 个性化系统
- **聊天称号**: 通过成就或活动获得独特的聊天前缀。
- **皮肤特效**: 穿上特定的皮肤物品，可以获得对应的药水效果或播放动画（如小月、爱丽丝、莉莉丝等）。
- **鞘翅换色**: 使用假箱子UI，像翻牌子一样挑选你喜欢的鞘翅颜色。

### 🛡️ 综合管理
- **世界边界**: 防止玩家走丢，硬核限制生存范围。
- **反作弊联动**: 监听 iListenAttentively 的作弊事件，对"被反作弊娘注视"的玩家发出警告。
- **玩家保护**: 耕地防踩、防末影人搬方块、凋零防爆、主世界禁用重生锚。

### 🐟 奇怪的细节
- 美西螈可以设置为不攻击鱼类。
- 经验修补可以在潜行时手动触发。
- 右击留言纸船可以查看或删除留言。
- 自动替换聊天中的Emoji为游戏内特殊字符。

## 📂 项目结构一览

```text
QYServer/
├── Config/                   # 核心配置文件
│   ├── config.js             # 主配置：封禁名单、服务器列表、世界边界、一言列表等
│   └── mail.json             # 全服邮件配置
├── Data/                     # 运行时产生的数据
│   ├── issues.txt            # 玩家通过 /issues 反馈的问题记录
│   └── System/               # 系统数据存储
│       ├── BiomeName.json    # 群系中文名映射表
│       ├── mail_playerData.json # 玩家的邮件阅读/领取状态
│       └── playerTime.json   # 玩家首次进入服务器的时间戳
├── src/                      # 源代码目录
│   ├── index.js              # 插件主入口，注册所有事件和命令
│   ├── lib/                  # 公共函数库
│   │   └── func.js           # 工具函数集合
│   └── module/               # 功能模块（核心玩法）
│       ├── load.js           # 动态模块加载器
│       ├── Game/             # 玩法相关模块
│       │   ├── AIChat.js     # AI 聊天（服务器娘）
│       │   ├── AxolotlDamage.js # 美西螈攻击管理
│       │   ├── BoxUI.js      # 假箱子UI（鞘翅皮肤等）
│       │   ├── CloudLift.js  # 云朵电梯逻辑
│       │   ├── Doll.js       # 玩偶交互
│       │   ├── Mail.js       # 邮件系统核心逻辑
│       │   └── SkinEffect.js # 皮肤特殊效果
│       └── World/            # 世界管理模块
│           ├── AfkTestfor.js # AFK 挂机检测
│           ├── ItemRunCmd.js # 物品执行命令
│           ├── JoinTime.js   # 玩家加入时间记录与查询
│           ├── ScoreChanged.js # 计分板变动提示
│           ├── ShowBiome.js  # 群系名称HUD显示
│           └── WorldBorder.js # 世界边界限制
├── index.js                  # LSE 加载入口，负责导出接口
├── manifest.json             # 插件清单文件
└── package.json              # Node.js 项目描述文件
```

## 🛠️ 维护指南 (For Ops)

> "服务器太卡了"——来自 issues.txt 的高频词。

### 1. 性能优化
- **AI聊天 (AIChat.js)**: AI响应时间可能较长，且使用的是外网API，网络波动时可能导致onChat事件处理变慢。如果服务器TPS堪忧，可以考虑临时禁用该模块。
- **挂机检测 (AfkTestfor.js)**: 每3秒遍历所有在线玩家，建议保持现状。如有性能问题，可适当增加间隔。
- **世界边界 (WorldBorder.js)**: 每4秒检测一次，逻辑上已做了"远离边界不检测"的优化，通常无压力。

### 2. 数据管理
- **封禁名单**: 在 Config/config.js 的 banName, banXuid, banClient 中维护。被命中的玩家在进入时会被"崩溃客户端"。
- **全服邮件**: 编辑 Config/mail.json 文件后，无需重启，插件会在玩家下次查询或登录时读取。请确保JSON格式正确。
- **玩家反馈**: 玩家使用 /issues <内容> 提交的反馈会记录在 Data/issues.txt 中，定期查看有助于发现玩家痛点。

### 3. 调试命令 (需要OP)
- `/logger <mode> <text>`: 向控制台发送一条带格式的日志。mode: 0(info), 1(warn), 2(error), 3(debug)。
- `/saydata <key> <mode> <data>`: 脚本间数据通信，用于调试（需验证密钥）。
- `/tps`, `/mspt`: 控制台可用，查看服务器性能。
- `/list -v`: 控制台查看在线玩家的客户端版本。
- `/list -i`: 控制台查看在线玩家的IP、延迟、设备等信息。

### 4. 常见问题排查
- **玩家反馈卡顿/卡死**: 检查是否有大量密集实体（如史莱姆、蜜蜂）、资源包冲突（如后室服材质）、或高频红石机械。
- **新人出生点被锁**: 检查 newPlayerUi 函数中的相机路径坐标是否与主城实际结构匹配。
- **功能方块失效**: 检查 config.banBlock 是否误封禁了某些功能方块。

## 📚 开发者文档：导出函数 (Exports)

本插件向LLSE导出了 src/lib/func.js 中的所有函数。你可以在其他LSE插件中通过 `ll.import("QYServer", "函数名")` 来调用它们。

| 函数名 | 描述 | 参数 | 返回值 |
|--------|------|------|--------|
| LandJudgment | 判断玩家是否有权限在指定位置操作（需要iLand前置） | Player, IntPos | Boolean |
| getChatTag | 获取玩家的聊天称号 | Player | String |
| crash | 尝试崩溃一个玩家的客户端 | Player | void |
| getFileSize | 格式化文件大小 | bytes, mode? | String |
| formatSeconds | 格式化秒数为 X天 X小时... | seconds | String |
| shuffleString | 随机打乱一个字符串 | String | String |
| probability | 根据百分比概率返回 true 或 false | percent | Boolean |
| delStringCode | 移除字符串中所有Minecraft颜色代码 (§) | String | String |
| textToEmoji | 在文本与游戏内特殊表情符号之间转换 | msg, mode | String |
| isNull | 检查值是否为 null 或 undefined | any | Boolean |
| titleLog | 创建一个带有自定义标题的Logger对象 | - | Object |
| enRuncmd | 以某个实体为执行者和执行位置运行Minecraft命令 | Entity, cmd | Boolean |
| mcCode2Ansi | 将Minecraft颜色代码 (§) 与ANSI转义序列互转 | text, mode | String |
| timeoutJoinServer | 带倒计时提示地将玩家传送到另一个服务器 | player, ip, port, timeout, errCb? | void |

## 💖 特别鸣谢与致敬

- **佛祖**: index.js 末尾的佛祖保佑图，保佑代码"永无BUG"。
- **冰凌呀**: 作者，用爱发电，创造了这个充满细节的世界。
- **奈依rere**: 烟花设计者。
- **所有反馈问题的玩家**: 虽然issues.txt里充满了吐槽，但这正是服务器成长的动力。

---

> "你说长痛不如短痛，我想，这句话不对，长痛的话，你一直在我身边，而短痛，便是了无音讯" - 来自项目的一言库。

愿我们与这个项目，都是长久而温暖的陪伴。
