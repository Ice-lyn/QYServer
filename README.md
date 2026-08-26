# ✨ QYServer —— QY服务器核心插件

**(｡･ω･｡)ﾉ♡ 你好呀，开发者！**

欢迎来到 **QYServer** 核心的插件仓库。  
这是一个为QYServer从头打造的全栈式服务器核心插件，适用于LeviLamina加载器。

在这里，代码不仅仅是逻辑，更是方块世界里每一份温暖与相遇的基石。愿这个 README 能指引你探索我们的技术世界。
—— 愿你的每一次与代码的相遇，都很美好 (˶ᵔ ᵕ ᵔ˶)

> **如果生活像苦力怕，至少我们还能在插件里“跑酷”(｡･ω･｡)**

***

## 🌸 项目简介

**QYServer** 是一个**为自家服务器深度定制的“胶水层”核心**，将聊天、经济、AI 对话、反作弊、用户数据迁移、邮件系统、容器 UI 及十余种独特玩法深度融合在一起。

*   **项目性质**：自用项目。核心代码完全开源供学习、参考或服务器内部使用。您可以随意复制项目内的代码至您的项目，或基于此进行二次开发。
*   **服务对象**：专为 **QYServer** 的长期稳定运行而设计，所有系统均针对高在线、多模块、跨网络环境等极端情况做了深度优化。如果你在找适合自己服务器的“轮子”，这里或许有很多不错的方案可以参考。
*   **宣传一下**：欢迎来我们的世界一起玩耍！
    *   **QQ主群**：`1029879634`（群服互通群：`759676433`）
    *   **官网**：[https://qyserver.cc/](https://qyserver.cc/)

***

## 🛠️ 技术栈 & 依赖关系

本插件基于 **LeviLamina 的 Node.js 传统脚本引擎** (`legacy-script-engine-nodejs`)

### 核心依赖
| 库名 | 作用描述 |
| :--- | :--- |
| **GMLIB-LegacyRemoteCallApi** | LeviLamina 最强大的第三方 API 之一，提供底层网络包构造、事件扩展等能力。我们的**假箱子 UI** 正是基于此实现。 |
| **iListenAttentively-LseExport** | 反作弊监听与处理的核心前置，对接了反作弊插件的事件。 |
| **axios** | 用于向 DeepSeek AI API 发送请求，支撑**服务器娘“兮兮”**的聊天能力。当前核心模型为 `deepseek-v4-flash`，支持工具调用与记忆管理。 |
| **nodemailer** | 承担邮件发送角色，用于邮箱绑定、账号迁移、玩家反馈通知等。 |

### 环境要求
*   **LeviLamina** >= 1.1.x
*   **BDS** 支持 1.21.5x - 1.26.x
*   **Node.js** 内置环境（由 LeviLamina 提供）

***

## 🎯 整体架构与技术实现原理

“QYServer 插件”并非单一功能堆砌，而是一个**事件驱动**、**模块化加载**的 Monorepo 工程。  
整个架构的核心思想是：**逻辑解耦，数据集中，事件通信**。

```

QYServer.zip
├── index.js                # 【入口 + 佛祖保佑区】
├── Config/                 # 【配置中心】系统一切可配置项
│   ├── config.js           # 核心配置：AI、封禁、服务器列表、称号、轮播...
│   ├── mail.js             # 邮件模板与附件
│   └── BiomeName.json      # 群系数据
│
├── Data/                   # 【持久化数据】运行时产生的玩家数据与系统状态
│   ├── OldData/            # 旧版数据备份（邮件、玩家时间）
│   ├── PlayerBind/         # 玩家邮箱绑定（LevelDB 引擎）
│   ├── PlayerMail/         # 玩家邮件阅读/领取状态（LevelDB 引擎）
│   ├── PlayerTime/         # 玩家首次加入时间（LevelDB 引擎）
│   ├── AIMemory.json       # AI 对话上下文记忆
│   ├── BlockLock.json      # 领地方块锁数据
│   ├── cdk.json            # 兑换码库与使用记录
│   └── issues.txt          # 玩家反馈问题日志
│
├── src/
│   ├── index.js            # 【核心主控 + 命令注册】
│   ├── lib/                # 【核心库】
│   │   ├── func.js         # 通用工具类（日志、NBT解析、概率判断...）
│   │   └── events.js       # 自定义事件总线
│   │
│   └── module/             # 【功能模块】按领域分隔
│       ├── Core/           # 核心系统
│       │   ├── AIChat.js       # AI聊天 - 服务器娘"兮兮"
│       │   ├── JoinTime.js     # 加入时间 - 玩家历史查询
│       │   ├── Mail.js         # 邮件系统 - 全服公告推送
│       │   ├── MobSummon.js    # 实体生成控制 - 防刷怪
│       │   ├── Prefect.js      # 风纪系统 - 社区风纪委员
│       │   ├── UniteBan.js     # 云黑检测 - 公共封禁名单
│       │   ├── UserBind.js     # 邮箱绑定 - 账户安全保障
│       │   └── UserMigrate.js  # 账户迁移 - XUID变更补救
│       │
│       ├── Game/           # 玩法系统
│       │   ├── BlockLock.js    # 领地方块锁 - 防破坏
│       │   ├── BoxUI.js        # 假箱子UI - 协议层交互界面
│       │   ├── CloudLift.js    # 云朵电梯 - 立体交通系统
│       │   ├── Doll.js         # 玩偶系统 - 互动收藏品
│       │   ├── EnderDragonEx.js # 强化末影龙 - Boss战
│       │   ├── OPmgr.js        # OP管理 - 管理员工具
│       │   ├── SkinEffect.js   # 皮肤特效 - 装备附加效果
│       │   └── VillagerMigrate.js # 村民交易迁移
│       │
│       ├── World/          # 世界系统
│       │   ├── AfkTestfor.js   # 挂机检测 - 防刷资源
│       │   ├── AxolotlDamage.js # 美西螈保护 - 宠物设置
│       │   ├── Cdk.js          # 兑换码系统 - 运营工具
│       │   ├── MainCityShop.js # 主城商店 - 蜡烛/金币消费
│       │   ├── ScoreChanged.js # 积分提示 - 实时反馈
│       │   ├── ShowBiome.js    # 群系提示 - 沉浸体验
│       │   └── WorldBorder.js  # 世界边界 - 安全围栏
│       │
│       └── load.js         # 模块异步加载管理器
│
├── manifest.json           # 插件元信息
└── package.json            # 插件Node依赖

```

### 1. 自研事件总线 (`src/lib/events.js`)
为了让各个松散模块能在不互相 `import` 的情况下通信，实现了一套轻量级的事件系统。相较于 LeviLamina 原生事件，它支持了更灵活的控制：
*   **`emit`**：收集所有监听器返回值，常用于数据聚合。
*   **`emitUntilFalse`**：**命令拦截**的核心。任何一个监听器返回 `false`，即可阻止后续逻辑。例如 “命令禁用” 或 “世界边界限制” 通过此机制实现。
*   **`emitFirst`**：获取第一个有效返回值，常用于优先级查询。
*   **`on / off / once`**：标准订阅模型。

在 `src/module/load.js` 中，模块加载完毕后，各自注册自己的事件处理。核心入口 `src/index.js` 完全不关心具体实现，只负责调度。

### 2. 模块加载管理器 (`src/module/load.js`)
插件启动时，会读取 lib_list 变量获取需要加载的模块，动态异步加载所有 JavaScript 模块。这种设计让功能迭代变得非常简单：
*   新增一个功能（如“签到”），只需新建文件，放入对应文件夹并添加信息即可加载。
*   每个模块独立报错，互不影响。管理器会输出加载耗时，方便排查性能瓶颈。

### 3. 核心主控 (`src/index.js`) —— 人与方块的交汇点
这是整个服务器的“大脑”，以 `mc.listen` 为核心，对接 BDS 底层事件。它通过大量 `setInterval` 实现定时逻辑，并集中注册了几十个自研命令（详见后文「命令一览」）。除调度各模块外，核心主控自身也实现了大量基础玩法与防护逻辑：

*   **聊天与社交**
    *   聊天称号：从 USF 数据读取玩家称号（`getChatTag`），未设置时显示默认“萌新求带”；`/chattag` 可切换已拥有的称号。
    *   表情替换：内置 `replaceMap`，将常见 emoji 映射为自定义字体符号（`textToEmoji`），并过滤敏感词。
    *   彩蛋音效：聊天包含 `ciallo` / `你干嘛` 等关键词时播放对应音效；普通聊天播放“被呼唤”音效与粒子。
    *   延迟标识：聊天前缀显示玩家实时延迟（>100ms 时标红）。
    *   私聊菜单：`/msgui` 打开快捷私聊表单；`/msg <玩家> <内容>` 直接私聊。
    *   个人信息：`/me` 查看自身设备、延迟、模式等详细信息。
*   **便捷操作**
    *   主副手 / 头盔切换：`/offhand`、`/helmet` 一键交换手持与副手 / 头盔物品。
    *   自由视角：`/fc` 开关骑乘隐形实体实现的自由飞行视角。
    *   经验修补：手持带“经验修补”附魔的装备潜行使用，消耗经验自动修复耐久（`xpFix`）。
    *   椅子系统：站在楼梯 / 半砖上右键即可“坐下”（`qys:ride` 实体骑乘）。
    *   钢琴 / 烟花 / 光翼：内置钢琴 UI（`musicMenu`）、消耗蜡烛的烟花发射（`firework`）、使用 `qys:sky_wing` 提升最大生命值。
*   **跨服与节点**
    *   线路节点：`/nodeui` 在多个高速节点间切换（`config.nodeList`）。
    *   跨服传送：`/tpserver` 前往创造服 / 小游戏服等，协议版本不匹配时自动拦截提示。
*   **世界与防护**
    *   防爆：重生锚主世界爆炸、凋零破坏、末影人搬方块均被拦截。
    *   防刷：区块边界箱子（跨区块漏斗传输）、收纳袋传输被拦截；下界仅允许在领地内放水。
    *   染色方块：潜行手持染料右键可染色蜡烛 / 地毯 / 玻璃 / 陶瓦等方块。
    *   相机 / 末地烛：使用相机自动扣减物品；活塞推动末地烛对附近生物造成伤害。
    *   骑乘限制：末影龙仅允许带 `qys:ride_ender_dragon` 标签的玩家骑乘；`32k` 武器对玩家无效并自动清除。
*   **合成与结构**
    *   注销收纳袋、渗浆药水、虫蚀石头等原版配方；注册圣诞帽（无序）、紫水晶（切石机）等自定义合成。
    *   下界反应堆：主世界摆放正确结构后右键 `netherreactor` 自动加载建筑结构。
*   **运营与日志**
    *   一言轮播：按 `config.wordtime` 间隔向玩家推送趣味文案。
    *   延迟看板：每 2 秒将玩家平均延迟写入 `ms` 计分板。
    *   行为日志：通过 `BehaviorLog_WriteLog` 导出接口记录关键操作（踢人、风纪、反馈等）。
    *   新手引导：`newPlayerUi` 首次加入发放新手装备并引导个人设置（`meSet`）。
    *   天气投票：`/om voteweather` 发起半数通过的切换天气投票。
    *   反馈通道：`/issues` 将玩家反馈写入 `Data/issues.txt` 并邮件通知管理。
*   **`onmode` / `om` 命令总线**
    *   统一的功能触发入口，按前缀分发到 `playerCmd`（玩家可用）、`keyCmd`（带密钥）、`opCmd`（OP 专用）以及各模块通过 `func.addOnmodeCmd` 注册的回调。例如 `/om firework`、`/om musicMenu`、`/om boxui`、`/om disitem`、`/om aichat`、`/om prefect`、`/om setmail`、`/om migrate`、`/om mainCityShop` 等。
    *   另有 `logger`（向控制台输出分级日志）、`saydata`（脚本间数据通信）等高权限命令。

### 4. 自研假箱子 UI 系统 (`Game/BoxUI.js`)
这是本插件的技术亮点之一。由于 BDS 传统脚本引擎没有原生的 UI 容器接口，我们利用 **GMLIB** 伪造了箱子数据包来实现“点击交互”：
1.  **视觉欺骗**：向指定玩家客户端发送 `UpdateBlockPacket`，在玩家面前凭空造出一个视觉上的“箱子方块”。
2.  **打开协议**：发送 `OpenContainerPacket`，强制客户端打开箱子界面。
3.  **数据填充**：通过 `sendInventorySlotPacket` 向 27 个槽位逐一发送自定义物品（包括 NBT 绑定的回调数据）。
4.  **交互拦截**：监听 `gmlib::HandleRequestActionAfterEvent`（底层点击事件），解析槽位，触发对应的代码逻辑，比如切换鞘翅皮肤或设置选项。
5.  **清理**：玩家关闭界面时，移除假方块并清除临时数据。

整个流程全部通过二进制流 (`BinaryStream`) 在协议层完成，完全不依赖游戏内实体，性能极高。

### 5. 数据持久化架构 (Data/)

本项目的持久化数据分为两种存储策略：

#### A. JSON 配置文件（JsonConfigFile）
用于需要人工编辑或数据结构简单的场景。LeviLamina 提供了 JsonConfigFile API，读写性能优于纯文件操作。使用此方式的有：

*   Data/AIMemory.json —— AI 对话的上下文记忆数组
*   Data/cdk.json —— 兑换码库与使用记录
*   Data/BlockLock.json —— 领地方块锁数据（键=坐标，值=上锁者 XUID）

此外还有纯文本 / 配置类文件：

*   Data/issues.txt —— 玩家反馈问题日志（由 `index.js` 的 `/issues` 追加写入）
*   Config/BiomeName.json —— 群系英文 ID 到中文名的映射表（供 `ShowBiome.js` 读取）
*   Config/mail.js / Config/config.js / Config/env.js / Config/knowledgeBase.js —— 邮件模板、核心配置、环境变量与 AI 知识库

#### B. 键值对数据库（KVDatabase）
用于海量玩家数据的场景，底层使用 LevelDB 存储引擎，支持高性能读写。使用此方式的有：

*   Data/PlayerTime/ —— 玩家首次加入时间（键=玩家名，值=时间戳）
*   Data/PlayerMail/ —— 邮件已读/已领取状态（键=XUID，值=JSON对象）
*   Data/PlayerBind/ —— 邮箱绑定与验证码缓存（键=XUID，值=JSON对象）

LevelDB 的目录结构包含 .ldb 数据文件、MANIFEST 元数据、CURRENT 版本指针、以及 LOG/LOG.old 操作日志  
这些文件均由 LeviLamina 的 KVDatabase API 自动管理，插件只需关心键值的读写  
LevelDB 的日志和清单文件会在服务端关闭时自动回收，确保数据一致性  
所有数据库实例在 ll.onUnload() 中统一执行 close() 操作，防止数据损坏  

### 📦 模块功能速览

加载器 `load.js` 将所有模块分为三个领域。下面每个模块的功能一目了然：

| 领域 | 模块 | 主要职责 |
| :--- | :--- | :--- |
| **Core** | AIChat.js | 接入DeepSeek API，带7种工具调用的智能NPC；可查玩家数据/聊天记录/知识库/更新日志/联网搜索/白名单指令；支持投喂/rua互动。记忆持久化至 `Data/AIMemory.json` |
| | JoinTime.js | 记录并查询玩家首次加入时间；支持模糊搜索历史玩家。数据持久化至 `Data/PlayerTime/`（LevelDB） |
| | Mail.js | 全服公告系统，支持附件领取与过期逻辑；JSON配置驱动。状态持久化至 `Data/PlayerMail/`（LevelDB） |
| | MobSummon.js | 实体生成控制；低TPS自动抑制刷怪、防空刷，`testfor`后台诊断命令 |
| | Prefect.js | 社区风纪系统；风纪委员举报/踢出/禁言，名单配置驱动（`Config/config.js`） |
| | UniteBan.js | 接入公共云黑API；加入时校验XUID/客户端ID/IP，命中即踢出封禁 |
| | UserBind.js | 邮箱+验证码绑定流程；二次验证安全保障。数据持久化至 `Data/PlayerBind/`（LevelDB） |
| | UserMigrate.js | 双邮箱验证的跨XUID自助迁移；同步领地数据到新账户 |
| **Game** | BlockLock.js | 领地方块锁；受信任领地内上锁，领地失效自动解锁。数据持久化至 `Data/BlockLock.json` |
| | BoxUI.js | 协议层伪造容器UI；支持自定义点击回调的交互界面（如鞘翅皮肤商店） |
| | CloudLift.js | 识别特殊方块实现的立体电梯；支持上下20层快速传送 |
| | Doll.js | 可购买的收藏玩偶系统；支持多种互动效果与商店集成 |
| | EnderDragonEx.js | 强化末影龙Boss战；提升血量、召唤小弟、按伤害占比分配奖励 |
| | OPmgr.js | 管理员专用工具集；OP剑快捷删实体、切换模式 |
| | SkinEffect.js | 皮肤装备触发药水效果的检测系统；支持动态增减效果 |
| | VillagerMigrate.js | 村民交易迁移；手持书本可导出/覆盖交易列表 |
| **World** | AfkTestfor.js | 基于坐标+视角变化的挂机检测；自动标记并触发挂机动作 |
| | AxolotlDamage.js | 美西螈攻击鱼类保护开关；潜行交互设置 |
| | Cdk.js | 兑换码生成/使用/限量管理；支持命令+物品混合发放。数据持久化至 `Data/cdk.json` |
| | MainCityShop.js | 主城商店；蜡烛/金币双货币商品兑换，配置驱动（`Config/config.js`） |
| | ScoreChanged.js | 金币/蜡烛数值变动实时提示；正负增量可视化 |
| | ShowBiome.js | 定时检测群系变化并显示中文名称；3秒刷新一次 |
| | WorldBorder.js | 基于坐标的边界围栏系统；越界自动回弹安全位置 |

***

## 📜 命令一览

插件注册了大量命令，可分为「直接命令」与「`/om` 功能项」两类。

### 直接命令（玩家 / 后台）

| 命令 | 权限 | 说明 |
| :--- | :--- | :--- |
| `/sinfo` | Any | 查询服务器运行状态（TPS / 内存 / 在线 / 数据文件大小等） |
| `/msgui` | Any | 打开快捷私聊菜单 |
| `/msg <玩家> <内容>` | Any | 向指定玩家发送私聊 |
| `/me` | Any | 查看自身设备、延迟、模式等详细信息 |
| `/fc` | Any | 开关自由飞行视角 |
| `/chattag` | Any | 切换已拥有的聊天称号 |
| `/offhand` | Any | 主手与副手物品交换 |
| `/helmet` | Any | 主手与头盔物品交换 |
| `/scale [倍数]` | Any | 自定义玩家体型大小（1–35） |
| `/nodeui`（`/server`） | Any | 在多个高速线路节点间切换 |
| `/tpserver`（`/qyserver`） | Any | 前往创造服 / 小游戏服等其他服务器 |
| `/issues [内容]` | Any | 反馈问题（写入 `Data/issues.txt` 并邮件通知管理） |
| `/mail` | Any | 查看 / 领取邮件与附件 |
| `/cdk [兑换码]` | Any | 兑换码系统 |
| `/onmode`（`/om`） | Any | 触发一个功能项（见下表） |
| `/logger <模式> <文本>` | GameMasters | 向控制台输出分级日志 |
| `/saydata <密钥> <模式> <数据>` | GameMasters | 脚本间数据通信 |
| `testfor [--type\|--player]` | 后台 | 诊断全服 / 玩家附近实体分布 |
| `reload` | OP | 热重载（触发 `noChat` 标记跳过启动问候） |

### `/om` 功能项（部分）

| 功能项 | 权限 | 说明 |
| :--- | :--- | :--- |
| `/om help` | Any | 列出所有可用功能项 |
| `/om new` | Any | 重新打开新手指南（仅主世界） |
| `/om meSet` | Any | 打开个人设置（群系提示 / 每日一言 / 横扫之刃等开关） |
| `/om xpfix` | Any | 经验修补手持装备 |
| `/om rc` | Any | 强制刷新客户端区块 |
| `/om firework` | Any | 消耗 50 蜡烛发射烟花 |
| `/om musicMenu` | Any | 打开钢琴 UI |
| `/om voteweather` | Any | 发起切换天气投票 |
| `/om giveskin` | Any | 打开皮肤商店 |
| `/om boxui <id>` | Any | 打开指定假箱子 UI（如鞘翅商店） |
| `/om disitem <add\|remove\|list>` | Any | 广播 / 查看手持物品展示 |
| `/om mainCityShop` | Any | 打开主城商店（蜡烛 / 金币） |
| `/om aichat <give\|rua>` | Any | 投喂 / rua 服务器娘实体 |
| `/om pltime` | Any | 查询玩家加入时间（今日 / 历史 / 模糊搜索） |
| `/om prefect` | Any | 社区风纪管理（举报 / 投票踢人 / 禁言 / 强制踢出） |
| `/om setmail` | Any | 邮箱绑定流程 |
| `/om migrate` | Any | 跨 XUID 账户自助迁移 |
| `/om elytraShop <密钥>` | 密钥 | 600 蜡烛购买鞘翅皮肤 |
| `/om fuckcost` | Any | 去除主手物品附魔惩罚 |
| `/om crash` / `/om killme` | Any | 恶搞崩溃 / 回出生点 |
| `/om tpch` / `/om getNbt` / `/om setNbt` / `/om getbin` | OP | 区块传送 / NBT 读写 / 地图画转化 |

***

## 🧠 技术详解与实现细节

### ✉️ 全自动邮件系统 (`Core/Mail.js`)
*   **配置驱动**：只需向 `mail.js` 的数组里新增一个对象，服务器就能自动在指定时间向全体（或某一时间后加入的）玩家推送公告，并支持附件领取。
*   **时效性与状态管理**：通过 `KVDatabase` 持久化每个玩家对每一封邮件的“已读”与“已领取”状态。`ignoreTime` 字段允许公告打破时间限制，对所有人可见。
*   **附件解析**：附件使用 SNBT 格式存储，可以直接包含 NBT 标签，支持给予任何复杂的自定义物品。

### 🔷 用户账户迁移系统 (`Core/UserBind.js` & `UserMigrate.js`)
这是专为“正版验证导致 XUID 变更”的棘手问题设计的解决方案：
1.  **绑定邮箱 (`/om setmail`)**：玩家通过验证码将自己的账户与邮箱绑定。验证码通过 `nodemailer` 发送，验证过程支持进出游戏（缓存有效期内）。
2.  **自助迁移 (`/om migrate`)**：
    *   玩家输入旧账户名。
    *   系统校验旧账户是否已绑定邮箱。
    *   向旧邮箱发送二次验证码。
    *   迁移执行：交换新旧账户的玩家 NBT 数据（背包、末影箱等），并调用 **iLand** 领地插件的导出 API (`ILAPI_SetOwner` / `ILAPI_AddTrust`) 批量转移领地所有权与信任列表。

### 🌐 跨服 & 多节点支持 (`src/index.js`)
服务器支持跨服传送和多个物理节点，以降低延迟：
*   **节点选择**：`/nodeui` 列出所有节点的 UI，通过 `player.transServer(ip, port)` 将玩家转移到速度更优的线路。
*   **跨服传送**：`/tpserver` 将玩家传送至创造服、小游戏服等其他游戏模式。客户端协议版本不匹配时，会直接阻止传送并提示，避免玩家崩溃。

### 🎀 “兮兮” AI 聊天 (`Core/AIChat.js`)
服务器娘“兮兮”已经成长为具备复杂推理能力的智能体：
*   **模型升级**：核心模型已升级为 `deepseek-v4-flash`，响应速度更快，逻辑更清晰。
*   **七种工具调用**：AI 不仅能闲聊，还能按需调用工具来真正“做事”：
    *   `query_knowledge_data` —— 检索**内置知识库**（涵盖所有规则、指令、功能）来回答规则问题；
    *   `query_chat` / `query_chat_data` —— 回顾当天聊天记录、按关键词检索，形成短期“记忆”；
    *   `query_player_data` —— 查询玩家信息（加入时间、金币/蜡烛、击杀数、在线时长）；
    *   `query_web_info` —— 联网搜索实时信息；
    *   `query_updata` —— 查询服务器更新日志；
    *   `run_mc_command` —— 在**白名单**内执行 `/give`、`/issues`、`/msg`、`/sinfo` 等指令。
*   **互动玩法**：玩家可以投喂食物或 `rua` 服务器娘，AI 会根据情况撒娇或回礼。
*   **记忆管理**：通过 `AIMemory.json` 保存上下文，避免“失忆”。系统会自动裁剪过长记忆。
*   **安全输出**：所有指令执行均受限白名单，回复同时过滤敏感字符与 emoji，并广播到游戏和QQ群。

***

### 🛡️ 社区风纪 & 云黑 (`Core/Prefect.js` & `Core/UniteBan.js`)
双保险的社区秩序维护体系：
*   **风纪委员**（`Prefect.js`）：从 `Config/config.js` 读取风纪委员名单，实现举报、踢人、禁言等管理动作（权限分层在规划中）。
*   **云黑检测**（`UniteBan.js`）：玩家加入时向公共云黑 API 上报 XUID / 客户端 ID / IP 进行校验，命中即踢出并广播封禁原因，实现跨服联防。

### 🔒 领地方块锁 (`Game/BlockLock.js`)
针对漏斗分类被小白弄坏、门口总被破门而入等痛点设计：
*   玩家只能在**受信任的领地内**对容器/门类方块上锁（数据存 `Data/BlockLock.json`）。
*   领地主与创建者可自由解锁；领地失效时方块自动解锁。
*   非授权玩家右键会被拦截并提示，还贴心附带解谜提示（潜行+手持钟表右键解锁）。

### 🐉 强化末影龙 (`Game/EnderDragonEx.js`)
让末地Boss战更有史诗感：
*   末影龙生命值提升至 300，歇息时减伤，免疫爆炸伤害（仅玩家可造成伤害）。
*   低血量有概率召唤“末影侍卫”小弟；水晶被破坏会反噬破坏者。
*   击杀奖励按**伤害占比**分配，末影龙击杀玩家会回复血量。

### 🏪 主城商店 (`World/MainCityShop.js`)
配置驱动的双货币商店系统（蜡烛 / 金币）：
*   商品列表完全由 `Config/config.js` 的 `shop` 字段定义，支持自定义图标与命令发放。
*   包含“光明魔法”“飞行药水”“云朵方块”等十余种特色商品，交互使用假箱子 UI 完成。

### 🧑‍🌾 村民交易迁移 (`Game/VillagerMigrate.js`)
村民交易“存档/搬运”工具：
*   潜行手持写有交易 NBT 的书本右键村民，可把当前村民的交易列表导出到书本。
*   再次右键可覆盖目标村民交易，或从书本恢复交易列表，方便迁移/备份村民交易。

### 🧟 实体生成控制 (`Core/MobSummon.js`)
面向高在线环境的性能守护：
*   服务器 TPS 低于阈值时自动抑制自然刷怪，20 格内无玩家的“空刷怪塔”区域不刷怪。
*   提供 `testfor` 系列后台命令，方便排查全服实体类型与数量。

***

## 🎮 部署与开发

虽然这是自用项目，但你可以这样让它跑起来：

### 配置环境
将本项目置于 LeviLamina 的 `plugins/` 目录下，并确保已安装上述的依赖插件。

### 配置文件
进入 `Config/` 目录，务必将 `config.js` 中的 AI 密钥、邮件账户等私人信息替换为你自己的（如果你只是想看看效果，不改的话 AI 和邮件功能会罢工 (｡ŏ﹏ŏ)）。

### 启动
*   **开发测试**：LL 启动后会自动加载。若要直接运行单文件（不推荐，会缺失上下文），可在插件目录下执行 `node index.js`。
*   **调试**：修改代码后，服内可用 `/reload` 重载全服脚本（会触发 `is_reload` 标记跳过启动问候等），大大提升你的 Debug 效率！

### 佛祖保佑，永无 BUG
启动时控制台会出现一只大佛。呃……这是来自上古版本的传统，心诚则灵（？）。如果你遇到了报错，佛旁边的日志总会在那里等你去读 (｡•ᴗ-)✨。

> ♡ 冰凌的话：这个项目从更多是单人开发时随心所欲提交的代码大杂烩。  
> 如果你觉得哪里写得像“屎山”，请轻点吐槽 QAQ，也欢迎提 Issue 或 PR。  
> 技术会进化，但想让服务器变得更好的决心不会变。辛苦了，异世界旅人。  

***

README最后更新时间：26/08/27

**爱来自凌凌 ❤ 遇境等你回家**