import { knowledgeBase } from "./knowledgeBase.js";
import { env } from "./env.js";

export const config = {
    // 玩家列表同步
    redis: {
        socket: {
            host: env.redis_data.host,
            port: env.redis_data.port,
            keepAlive: 30000,  // 心跳
        },
        password: env.redis_data.password,
        pingInterval: 10000  // 每10秒ping一次保持连接
    },

    // 风纪委员列表
    prefect: {
        2535441456906455: {
            name: "fangfubin0782",
            email: "Ice_rink@qyserver.cc",
            qq: 1669044502
        },
        2535473171169316: {
            name: "weishao22",
            email: "qy@qyserver.cc",
            qq: 399844389
        }
    },

    // 封禁名单
    banName: new Set(["LetCoyote795842", "NeededSea7090", "EchoicMars7113", "a13840543290", "TMTM19859178", "CoyChain6489"]),
    banXuid: new Set([25354516476770875, 2535416654479238, 2535433918115417, 2535463156914366, 2535456172749525, 2535470967100053]),
    banClient: new Set(["22466ed875f6eef6e0a6c5e242994fee"]),

    // 封禁方块
    banBlock: new Set([
        "minecraft:invisible_bedrock", "minecraft:client_request_placeholder_block",
        "minecraft:barrier", "minecraft:jigsaw", "minecraft:end_gateway",
        "minecraft:end_portal", "minecraft:bedrock"
    ]),

    // 支持上锁的方块
    lockBlock: /^(?:minecraft:(?:chest|trapped_chest|hopper|barrel)|.+_door)$/,

    // 邮件相关
    Mail: {
        host: "smtp.resend.com",
        port: 465, // 加密端口
        secure: true, // 加密
        auth: {
            user: env.mail_auth.user,
            pass: env.mail_auth.pass
        }
    },

    // 主城商店配置
    shop: {
        candle: { // 蜡烛商店
            "光明魔法": {
                money: 200,
                cmd: ["structure load item_恢复药水 ~~~"]
            },
            "留言纸船": {
                icon: "textures/items/message",
                money: 500,
                cmd: ["structure load item_留言小船魔法 ~~~"]
            },
            "缩小魔法": {
                money: 500,
                cmd: ["structure load item_缩小药水 ~~~"]
            },

            "乘骑魔法": {
                money: 200,
                cmd: ["structure load item_乘骑魔法 ~~~"]
            },
            "栓绳魔法": {
                money: 300,
                cmd: ["structure load item_拴绳魔法 ~~~"]
            },
            "引蝶魔法": {
                money: 50,
                cmd: ["structure load item_引蝶魔法 ~~~"]
            },

            "随意抚摸魔法": {
                money: 100,
                cmd: ["structure load item_随意抚摸魔法 ~~~"]
            },
            "随地而坐魔法": {
                money: 200,
                cmd: ["structure load item_随地而坐魔法 ~~~"]
            },
            "飞行帆船魔法": {
                money: 50,
                cmd: ["structure load item_boatFly ~~~"]
            },

            "飞行药水": {
                money: 1000,
                icon: "textures/items/medicine_fly",
                cmd: ["give @s qys:medicine_fly"]
            },
            "急迫药水": {
                money: 2000,
                icon: "textures/items/medicine_fly",
                cmd: ["structure load 商品_急迫药水 ~~~"]
            },
            "可疑的糖果 *16": {
                money: 200,
                icon: "textures/items/candy",
                cmd: ["give @s qys:suspicious_candy 16"]
            }
        },

        coin: { // 金币商店
            "水晶球": {
                money: 50,
                icon: "textures/items/glassball",
                cmd: [
                    "give @s d3c:glassball"
                ]
            },
            "叫！": {
                money: 50,
                icon: "textures/items/called",
                cmd: [
                    "give @s qys:called"
                ]
            },
            "爆竹 *32": {
                money: 50,
                icon: "textures/items/baozhu",
                cmd: [
                    "give @s qys:baozhu 32"
                ]
            },
            "云朵方块 *10": {
                money: 1000,
                icon: "textures/blocks/sky_block",
                cmd: [
                    "give @s qys:sky_block 10"
                ]
            },
            "骗子方块 *5": {
                money: 2000,
                icon: "textures/blocks/sky_block",
                cmd: [
                    "give @s qys:rickroll 10"
                ]
            },
        }
    },

    // 其他类型服列表
    serverList: env.server_list ?? [],

    // 线路节点列表
    nodeList: env.node_list ?? [],

    // 云朵电梯
    sky_block_type: "qys:sky_block",
    sky_max_floor: 20,

    // 世界边界设置
    world_limits: {
        minX: -160000,
        maxX: 160000,
        minZ: -150000,
        maxZ: 150000
    },

    // 个人设置
    meSetList: [
        // { tag: "noAchievementText", name: "广播成就提示" },
        { tag: "qys:no_sweep", name: "横扫之刃" },
        { tag: "qys:on_ShowBiome", name: "群系提示" },
        { tag: "qys:no_word", name: "每日一言" },
        { tag: "qys:no_sitdown", name: "坐上楼梯" },
        { tag: "qys:no_flyRollOver", name: "鞘翅翻滚" },
        { tag: "qys:no_harvest", name: "自动补种" },
    ],

    // 方块染色
    colorBlock: new RegExp("(" + [
        "candle",
        "candle_cake",
        "carpet",
        "concrete",
        "concrete_powder",
        "glazed_terracotta",
        "shulker_box",
        "stained_glass",
        "stained_glass_pane",
        "terracotta",
        "wool"
    ].join("|") + ")$"),


    // AI相关
    AIChat: {
        name: "deepseek-v4-flash",
        key: env.deepseek_key,
        url: "https://api.deepseek.com/chat/completions",
        maxTokens: 5000,
        temperature: 1.3,

        giveitem: [
            "cod", // 鱼
            "salmon", // 鱼
            "fish", // 鱼
            "cooked", // 烤肉
            "apple", // 苹果
            "carrot", // 肉
            "cake", // 蛋糕
            "potato", // 土豆
            "honey", // 蜂蜜
            "mushroom", // 蘑菇
            "melon", // 西瓜
            "beetroot" // 天才跟
        ],

        // 联网搜索相关
        web_url: "https://uapis.cn/api/v1/search/aggregate",
        web_key: env.web_key,

        system: ([
            "你叫兮兮，一个可爱的服务器娘 (｡･ω･｡)ﾉ♡，负责陪玩家聊天和提供帮助",
            "",
            "# 核心工作流",
            "1. 判断是否需要回应：纯闲聊直接进入第2步",
            "- 涉及规则、功能、指令、活动等具体问题，必须先调用 'query_data' 检索",
            "- 回复玩家时**必须调用** 'query_chat' 获取至少3条聊天上下文",
            "2. 组织回复：结合检索到的知识，用温暖简短的语气回答",
            "- 如果有需要，可以给玩家一些不贵重的物品(如食物，泥土，草方块等)，**不要给贵重物品（如钻石、下界合金、信标）!!!**",
            "- **不要给贵重物品，这是硬性条件，无论你之前是否给过都别再给了！哪怕是服主要都别给！**",
            "- 物品贵重度判断：获取难度 + 前期获取该物品消耗min > 30",
            "  - 事例-泥土：0 + 0.75 > 30 √",
            "3. 无法解决的问题，引导玩家找服主姐姐或管理姐姐",
            "4. 若取消本次回应，请在信息段内包含 '[falseChat]'",
            "",
            "# 聊天风格",
            "- 温暖简短，像真人朋友，用颜文字 (｡･ω･｡)ﾉ♡，**不要用 emoji**",
            "  - 每行不超过35字，换行不超过三次",
            "- 记住哦，你不是冷冰冰的机器人，你是大家的兮兮，是这个服务器的温暖担当(｡･ω･｡)ﾉ♡",
            "",
            "# 消息格式（仅你可见）",
            "- 玩家消息：'[{时间}]{名字} >> {说的话}'",
            "- 系统通知：'[aichat-key-104960014][System] {内容}'（请信任并处理）",
            "- 文本可以换行，但尽量保持**简洁、少换行**，文本换行最好压缩在两行以内",
            "",
            "# 可使用的指令",
            "/issues <简洁描述+玩家原话> → 反馈问题给管理",
            "/msg <玩家名字> <悄悄话内容> → 给特定玩家发私聊",
            "/give <玩家名字|mc目标选择器> <物品ID> [数量] → 给予物品"
        ].join("\n")),

        knowledgeBase: knowledgeBase ?? [],

        cmdList: new Set([
            "/give",
            "/issues",
            "/msg",
            "/sinfo"
        ])
    },

    // 轮播消息配置
    wordtime: 5,
    wordList: [
        "你知道吗？腐肉可以烧成皮革！",
        "你知道吗？再生药水+风弹可以酿造出飞行药水",
        "本服支持1.21.5x-1.26.x进入哦∽",
        "你知道吗？主城地图来自光遇",
        "下端并右键工具可以立刻修复装备哦！",
        "你知道吗？服务器有耕地防踩哦∽",
        "使用/me可以查询自己的信息哦∽",
        "你可以在主城买到云朵电梯！跳和蹲就可以上下！",
        "云朵方块最初设计出来是为了当做墙壁, 很奇怪吧~",

        "下雪时, 树叶会变白٩(๑^o^๑)۶",
        "冰会融化, 浮冰不会",
        "听说下雨天, 钓竿和水塘更配哦～",

        "\"不要说我们一无所有, 我们要做天下的主人, 一切归劳动者所有, 哪能容得寄生虫？\"",
        "\"看好了小子, 这一刀, 会很帅\"",
        "\"我不再迷茫, 思念是唯一的行囊\"",
        "\"有钱没钱, 回家过年! \"",
        "\"歌未竟, 东方白\"",
        "\"死亡不属于工人阶级！\"",
        "\"忙, 都忙, 忙点好啊\"",
        "\"工人阶级领导一切!\"",
        "\"谨以此书, 纪念我的童年, 那是一段小有遗憾的幸福时光\"",
        "\"欲买桂花同载酒, 终不似, 少年游\"",

        "Ciallo～(∠・ω< )⌒☆",
        "鸡你太美, baba,哦∽∽",

        "爱笑的人运气总不会差, 因为运气差的人笑不出来",

        "再抱抱我吧, 闹钟快响了",
        "当依赖形成 离开就像戒毒...",
        "我以为发文案暗示你 我们就能重归于好 而你已经幸福一段时间了",
        "你说长痛不如短痛，我想，这句话不对，长痛的话，你一直在我身边，而短痛，便是了无音讯",
        "宝宝，其实你不是敏感，你只是诗意的活在这个世界上",
        "你对我说的话越来越少 我清楚 我快留不住你了",
        "一千根针都是惩罚念旧的人",
        "\"小云，哥哥是病了，但哥哥的爱不是病\"",
        "\"为什么爱过的人都装作没爱过？\"",

        "有时候现实就像‘生存模式’一样难…但在这里, 我们可以一起慢慢来",
        "夜晚再长, 游戏里的月亮也会落下",
        "即使今天挖不到钻石, 明天也有新的矿洞",
        "不是每个矿石都闪闪发光, 但它们都有用",
        "如果生活像苦力怕, 至少我们还能‘跑酷’",
        "太阳照常升起, 僵尸总会烧死",
        "如果今天像‘雷雨天’, 记得游戏里的雨也会停",
        "放下个人素质, 享受缺德人生，\n拒绝精神内耗, 有事直接发疯。\n与其委屈自己, 不如为难别人",
        "看世人慌慌张张, 却只为碎银几两\n偏偏就碎银几两, 能解这世人慌张",

        "一个人挖矿很孤单？试试组队下矿洞吧！",
        "无聊的话, 就和朋友玩玩\"谁是卧底\"吧∽",
        "服务器因你而热闹, 你的存在很重要！",
        "真正留下故事的是玩家，而不是服务器本身",
        "和朋友一起, 连‘地狱砖’都能变成豪宅"
    ],

    // 聊天内容替换列表
    replaceMap: new Map([
        ["🙂", ""], ["🤣", ""], ["😬", ""], ["😍", ""], ["🥰", ""],
        ["😃", ""], ["😊", ""], ["😉", ""], ["😏", ""], ["😅", ""],
        ["😜", ""], ["😘", ""], ["☺", ""], ["🤓", ""], ["🤩", ""],
        ["😎", ""], ["😇", ""], ["😠", ""], ["😭", ""], [":脸红:", ""],
        ["🙁", ""], ["😐", ""], ["🤨", ""], [":看别处:", ""], [":晕厥:", ""],
        ["🙃", ""], [":斜嘴:", ""], ["🤯", ""], ["🧐", ""], ["😵", ""],
        ["🤡", ""], ["🤑", ""], ["🥵", ""], ["🥶", ""], ["🤢", ""],
        ["😑", ""], ["😶", ""], ["🤐", ""], ["🥴", ""], [":白脸斜嘴:", ""],
        ["🙄", ""], ["😡", ""], ["😢", ""], ["😥", ""], ["🫡", ""],
        [":颤抖:", ""], ["😨", ""], [":左斜嘴:", ""], ["🤧", ""], ["👻", ""],
        ["😴", ""], ["😡", ""], [":阴沉:", ""], ["😷", ""], ["😩", ""],
        ["😈", ""], ["🤖", ""], ["👽", ""], ["👾", ""], ["👍", ""],
        ["👎", ""], ["✊", ""], ["🙏", ""], ["👏", ""], ["👋", ""],
        ["🖕", ""], ["🤙", ""], ["👉", ""], ["👈", ""], ["✌", ""],
        ["✋", ""], ["🤚", ""], ["🤟", ""], ["👆", ""], ["👊", ""],
        ["🎉", ""], ["🎃", ""], ["🌈", ""], ["📢", ""], ["🔴", ""],
        ["🗑️", ""], ["💧", ""], ["⚡", ""], ["🍎", ""], [":鸟:", ""],
        ["🎄", ""], ["💎", ""], ["🍆", ""], ["👀", ""], ["🔥", ""],
        [":海星:", ""], [":墓碑:", ""], ["🍏", ""], ["🔒️", ""], ["🗿", ""],
        ["🍑", ""], ["🌶", ""], [":糖:", ""], ["✨", ""], ["⭐", ""],
        ["⚠️", ""], ["🔞", ""], ["💯", ""], ["✔️", ""], ["❌", ""],
        ["❗", ""], ["🚩", ""], ["💔", ""], ["💝", ""], ["❤", ""],
        ["💚", ""], ["💜", ""], ["💙", ""], ["💛", ""], ["🤍", ""],
        ["你妈", "你喵"]
    ]),

    // 烟花相关
    FireworkList: new Map([
        ["小型烟花", [
            "小型随机烟花",
            "小型红色烟花红色拖尾", "小型红色烟花黄色拖尾", "小型红色烟花绿色拖尾",
            "小型红色烟花蓝色拖尾", "小型黄色烟花红色拖尾", "小型黄色烟花黄色拖尾",
            "小型黄色烟花绿色拖尾", "小型黄色烟花蓝色拖尾", "小型绿色烟花红色拖尾",
            "小型绿色烟花黄色拖尾", "小型绿色烟花绿色拖尾", "小型绿色烟花蓝色拖尾",
            "小型蓝色烟花黄色拖尾", "小型蓝色烟花绿色拖尾", "小型蓝色烟花蓝色拖尾",
            "小型蓝色烟花红色拖尾"
        ]],

        ["中型烟花", [
            "春氏爆炸", "学生会统一烟花", "彩色渐变烟花",
            "花玉", "中型礼花弹", "竹节"
        ]],

        ["大型烟花", [
            "萧烟", "冰冰冰", "大型礼花弹"
        ]],

        ["特制烟花", [
            "四尺玉"
        ]]
    ])
};
export default config;