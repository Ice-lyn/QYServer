# QYServer 插件

> 光遇主题 · 多功能综合服务器插件  
> "光是遇见，就很美好" —— 专为《光·遇》风格生存服打造  
> "不要在工位上打开，因为代码里藏着太多颜文字 (｡･ω･｡)ﾉ♡"

---

## ⚠️ 重要说明

本项目仅作为 LeviLamina + NodeJS 插件开发的技术参考开源。

- 配套的 **行为包 (Behavior Pack)** 与 **资源包 (Resource Pack)** 并未随本仓库开源，因此直接安装本插件将无法正常运行大部分功能（如云朵电梯、烟花、皮肤特效、自定义 UI 等）。
- 若您有意在生产环境中使用，请自行根据代码中的 scriptevent 调用和方块 ID 配置修改并适配您自己的行为包。
- 欢迎 Fork 并修改代码以符合您的服务器架构，但请保留原作者信息。

---

## 🌟 简介

**QYServer** 是一款为 LeviLamina + LegacyScriptEngine-NodeJS 环境设计的综合性基岩版服务器插件。它集成了 **玩家管理、趣味玩法、世界控制、AI聊天、邮件系统** 等大量功能，致力于为玩家营造一个温暖、有趣、充满细节的游戏世界。

本插件原本为私人服务器定制，现开源分享。代码中充满了 **颜文字、网络热梗、可爱的服务器娘** 风格，阅读代码时请保持心情愉快 (｡･ω･｡)ﾉ♡

---

## ✨ 主要特性

### 🧸 玩家系统增强

- **新手引导动画** —— 首次进服自动播放光遇风格镜头动画，介绍主城设施
- **个人设置菜单** —— 开关横扫之刃、群系提示、每日一言、自动补种等
- **称号系统** —— 玩家可自由佩戴获得的聊天前缀称号
- **主副手切换** (/offhand) / **头盔互换** (/helmet) 命令
- **自定义玩家大小** (/scale)
- **鞘翅颜色选择** —— 假箱子 UI 选择已解锁的鞘翅皮肤

### 🗺️ 世界机制

- **世界边界限制** —— 可配置矩形边界，超出自动传送回安全位置
- **云朵电梯** —— 站在特殊云朵方块上跳跃/潜行即可上下楼层
- **群系名称显示** —— 进入新群系时在屏幕上方显示中文名称
- **封禁方块** —— 防止玩家放置特定的方块
- **耕地防踩、防搬方块、凋零防爆、禁止主世界使用重生锚**

### 🤖 AI 聊天 & 反馈

- **服务器娘 AI 对话** —— 基于豆包 API，当玩家消息包含关键词时自动触发回复
- **问题反馈系统** (/issues) —— 玩家提交的反馈自动记录到 Data/issues.txt

### 📬 邮件系统

- 支持带附件的服务器公告邮件
- 玩家上线自动检测未读邮件，可领取附件物品
- 管理员通过修改 JSON 文件发送新邮件

### ⏱️ 挂机检测

- 10分钟无操作自动进入挂机状态，显示 BossBar 并修改玩家名牌

### 🎆 趣味内容

- **自定义烟花发射** —— 消耗蜡烛，多种烟花效果可选
- **玩偶系统** —— 放置特殊玩偶方块，右键触发不同效果（吹飞、播放坤坤音乐等）
- **钢琴弹奏** —— 简易 GUI 弹奏音符盒音效（需配套资源包）
- **经验修补重写** —— 潜行时右键工具消耗经验修复耐久
- **聊天表情替换** —— 内置大量 emoji 映射到资源包特殊字符

### 🛡️ 管理工具

- 封禁名单（按玩家名、XUID、设备ID）
- 崩溃玩家客户端功能（用于测试/惩罚）
- 运行状态查询 (/sinfo) —— 显示 TPS、内存、实体数等
- 跨服传送菜单 (/nodeui, /tpserver)

---

## ⚙️ 配置文件说明

### Config/config.js

| 配置项 | 说明 |
|--------|------|
| banName / banXuid / banClient | 封禁名单，玩家进入时自动踢出 |
| banBlock | 禁止普通玩家放置的方块列表 |
| serverList | 其他类型服列表（用于 /tpserver） |
| nodeList | 线路节点列表（用于 /nodeui） |
| sky_block_type | 云朵电梯使用的方块 ID |
| world_limits | 世界边界坐标范围 |
| meSetList | 个人设置开关列表（标签控制） |
| wordList | 每日一言轮播内容 |
| replaceMap | 聊天表情替换映射表 |
| FireworkList | 烟花种类配置 |
| SkinEffect | 皮肤装备时附加的药水效果 |

### Config/mail.json

邮件公告存储文件，格式如下：

```json
{
  "announcements": [
    {
      "id": "ann_001",
      "title": "公告标题",
      "content": "正文内容",
      "timestamp": 1734192000000,
      "expireDays": 30,
      "annex": {
        "items": ["物品SNBT字符串..."]
      }
    }
  ]
}
```

### Data/System/

- playerTime.json：记录玩家首次加入时间戳
- mail_playerData.json：记录玩家已读邮件和已领取附件状态
- BiomeName.json：群系中文名称映射表
- issues.txt：玩家反馈记录

---

## 🎮 命令列表

### 玩家命令

| 命令 | 功能 |
|------|------|
| /sinfo | 查看服务器运行状态 |
| /msgui | 快捷私聊菜单 |
| /chattag | 设置聊天称号 |
| /offhand | 交换主副手物品 |
| /helmet | 交换头盔与主手物品 |
| /scale [倍数] | 调整玩家大小（-2 ~ 35） |
| /issues [内容] | 提交问题反馈 |
| /nodeui | 选择线路节点（跨服） |
| /tpserver | 前往其他类型服 |
| /mail | 查看邮件 |
| /fc | 切换自由视角（需已骑乘） |
| /onmode <功能> | 触发特殊功能（见下文） |

### 特殊功能 /onmode 参数

| 参数 | 效果 |
|------|------|
| xpfix | 经验修补（等效潜行右键） |
| meSet | 打开个人设置 UI |
| firework | 烟花发射 UI |
| new | 重播新手引导 |
| giveskin | 获取皮肤商店商品（测试用） |
| crash | 5秒倒计时后崩溃自己客户端 |
| book | 小说阅读器 |
| killme | 返回重生点并满血（自救） |
| rc | 请求客户端刷新区块 |

### OP 命令（需 OP 权限或 op 标签）

| 命令 | 功能 |
|------|------|
| /logger <mode> <text> | 向控制台输出日志（0=info,1=warn,2=error,3=debug） |
| /saydata <key> <mode> <data> | 脚本间数据通信（需密钥） |
| /onmode tpch <chunkX> <chunkZ> | 传送到指定区块中心 |
| /onmode getNbt | 将手持物品 NBT 保存至文件 |
| /onmode setNbt | 从文件读取 NBT 并赋予手持物品 |
| /onmode getbin | 将图片转换为地图画（需配套 exe） |

---

## 📚 导出 API 文档

插件通过 ll.exports 导出了 func.js 中的全部函数，其他插件可通过以下方式调用：

```js
const QYServer = ll.imports("QYServer");
QYServer.crash(player);   // 崩溃玩家客户端
QYServer.getChatTag(player); // 获取玩家聊天称号
```

### 导出函数列表

| 函数名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| LandJudgment(Player, Pos) | 玩家对象、坐标 | Boolean | 判断玩家在领地内是否有操作权限（需 iLand） |
| getChatTag(player) | 玩家对象 | String | 获取玩家当前佩戴的聊天称号 |
| crash(player) | 玩家对象 | void | 发送破损数据包尝试崩溃客户端 |
| getFileSize(bytes, mode) | 字节数，模式(0=B,1=KB,2=MB,3=GB) | String | 格式化文件大小 |
| formatSeconds(seconds) | 秒数 | String | 格式化为 X天X小时X分钟X秒 |
| shuffleString(str) | 字符串 | String | 随机打乱字符串顺序 |
| probability(percent) | 百分比(0-100) | Boolean | 判断是否触发概率事件 |
| delStringCode(text) | 带 § 的文本 | String | 去除所有颜色代码 |
| textToEmoji(msg, mode) | 消息文本，模式(0=转emoji,1=转回来) | String | 表情符号转换 |
| isNull(enter) | 任意值 | Boolean | 判断是否为 null 或 undefined |
| titleLog | 对象 | {info, warn, error, debug} | 带标题的日志记录器 |
| enRuncmd(entity, cmd) | 实体对象、命令字符串 | Boolean | 以实体身份执行命令 |
| mcCode2Ansi(text, mode) | 文本，模式(0=MC→ANSI,1=ANSI→MC) | String | 颜色代码互转 |
| timeoutJoinServer(player, ip, port, timeout, err) | 玩家、IP、端口、倒计时、失败回调 | void | 带倒计时跨服传送 |

---

## 🛠️ 维护与调试

### 日志

- 所有聊天、命令执行都会通过 func.titleLog 输出到控制台，前缀为 Chat 或 Command。
- AI 聊天记录会带 AIChat 前缀。
- 反馈内容会写入 Data/issues.txt 并在控制台打印。

### 常见问题

**Q：玩家进服就崩溃？**  
A：检查 banName/banXuid/banClient 是否误封，或玩家客户端资源包冲突。

**Q：云朵电梯不工作？**  
A：确认 sky_block_type 配置的方块 ID 正确，且玩家站在方块上跳跃/潜行。

**Q：AI 聊天不触发？**  
A：API Token 可能失效，需更换 AIChat.js 中的 token。消息需包含关键词才会触发。

**Q：邮件附件无法领取？**  
A：物品 SNBT 格式错误，检查 mail.json 中 items 字段是否正确。

### 更新配置后

修改 Config/config.js 或 mail.json 后，无需重启服务器，插件会自动读取最新内容（部分数据有缓存机制）。

---

## 🙏 鸣谢

- 佛祖保佑，永无 Bug 🙏
- 感谢 YunzhiAPI 提供的 AI 与小说接口
- 感谢所有为本项目提供灵感和测试的玩家们

---

## 📄 开源许可

本项目采用 MIT 许可证。  
二次开发或转载时请保留原作者信息，并附上本仓库链接。

小提示：代码中充斥大量 "qys:" 前缀的 scriptevent，若您打算自用，建议全局搜索替换为您自己的命名空间，避免与我们的行为包冲突哦～

愿你的服务器也能成为玩家们心中温暖的"遇境" (๑•̀ㅂ•́)و✧
