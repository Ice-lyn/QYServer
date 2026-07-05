export const mailConfig = [
    {
        id: "ann_005",
        title: "五一劳动节快乐！(˶ᵔ ᵕ ᵔ˶)",
        expireDays: 5,
        content: ([
            "亲爱的旅人们：",
            "",
            "五月的风拂过云野，遇境的烛火依旧明亮。",
            "在这个属于辛勤与汗水的小长假里，愿你暂别忙碌，回到这片方块与星光交织的世界。",
            "",
            "无论是搭建新的小屋，还是和朋友在雨林漫步，都别忘了好好休息、好好玩耍。",
            "我们为你准备了一份小小的心意，愿它能为你的旅途添一分暖意。",
            "",
            "附件：",
            "- 附魔金苹果 x2",
            "- 烟花火箭 x10",
            "- 蛋糕 x10",
            "",
            "五一快乐，辛苦了(｡•̀ᴗ-)✧",
            "—— QYServer"
        ].join("\n")),
        items: [
            type2snbt("minecraft:enchanted_golden_apple", 2),
            type2snbt("minecraft:firework_rocket", 10),
            type2snbt("minecraft:cake", 10),
        ],
        time: time2date("2026/5/1")
    },
    {
        id: "ann_004",
        title: "邮箱绑定功能上线啦 (´▽`ʃ♡ƪ)",
        content: (["亲爱的旅人们：",
            "",
            "服务器现已新增邮箱绑定功能 ～ (｡•̀ᴗ-)✧",
            "绑定后，若原账号丢失，可自助迁移账号",
            "还能在游戏外更快收到游戏内的邮件！",
            "",
            "使用以下命令：",
            "- /om setmail —— 绑定一个邮箱",
            "- /om migrate —— 自助账户迁移",
            "",
            "愿你的旅途不再迷路，遇境的灯火随时为你点亮(˶ᵔ ᵕ ᵔ˶)",
            "",
            "—— QYServer"
        ].join("\n")),
        items: [
            "{\"Count\":40b,\"Damage\":0s,\"Name\":\"minecraft:book\",\"WasPickedUp\":0b}"
        ],
        time: time2date("2026/4/29")
    },
    {
        id: "ann_003",
        title: "关于Actions & Stuff材质版本说明",
        content: ([
            "出于对向低版本客户端兼容的考虑，我们使用的Actions & Stuff将停留在1.9.1版本",
            "如果你想使用 且 设备支持Actions & Stuff 2.0",
            "可以在 [设置-全局资源] 内手动安装启用 Actions & Stuff 2.0",
            "感谢你的理解与支持 (｡•̀ᴗ-)✧",
            "",
            "—— QYServer"
        ].join("\n")),
        ignoreTime: true,
        time: time2date("2026/2/20")
    },
    {
        id: "ann_002",
        title: "除夕共守岁，心火暖云城",
        expireDays: 30,
        content: ([
            "炉火在遇境燃起，云野大厅挂上了红灯笼。",
            "今夜除夕，烟花将点亮每一片夜空——无论是你用方块搭建的小屋，还是我们并肩飞过的晨岛。",
            "",
            "感谢这一年的陪伴：记得你深夜建起的城堡，记得探索遗迹时的惊呼，也记得篝火旁分享的烤面包。",
            "在这个属于团圆与希望的夜晚，愿烟火为你驱散旧岁的疲惫，缩小药水带你看遍微观世界的奇妙，而抚摸魔法能轻轻传递彼此的祝福。",
            "",
            "附件：",
            "随意抚摸魔法 x3",
            "缩小药水魔法 x5",
            "彩色烟花魔法 x40",
            "",
            "愿新岁如烟火般绚烂，愿每一次下线都为了更好的重逢",
            "除夕快乐，我们在遇境等你回家。",
            "",
            "—— QYServer"
        ].join("\n")),
        items: [
            "{\"Count\":3b,\"Damage\":0s,\"Name\":\"qys:magic\",\"WasPickedUp\":0b,\"tag\":{\"RepairCost\":0,\"display\":{\"Lore\":[\"runner:6\"],\"Name\":\"§l随意抚摸魔法§r\\n§b(让您任意抚摸生物)§r\"}}}",
            "{\"Count\":5b,\"Damage\":0s,\"Name\":\"qys:magic\",\"WasPickedUp\":0b,\"tag\":{\"RepairCost\":0,\"display\":{\"Lore\":[\"runner:3\"],\"Name\":\"§l缩小魔法\\n§r§b(在一段时间内改变身高)\"}}}",
            "{\"Count\":40b,\"Damage\":0s,\"Name\":\"qys:firework_blue_spawn_egg\",\"WasPickedUp\":0b}"
        ],
        time: time2date("2026/2/17")
    },
    {
        id: "ann_001",
        title: "圣诞节快乐！",
        content: ([
            "圣诞钟声在云间回荡，霞谷赛道飘起细雪，暮土篝火旁也挂起了冬青花环。在这个属于温暖与重逢的时节，光之子们的点滴星光让整个世界都明亮了起来。",
            "",
            "记得每一次牵手飞越晨岛云海，记得雨林篝火旁分享的烤棉花糖，记得伊甸星河下无声的拥抱。这个冬天或许寒冷，但相遇让一切风雪都有了意义——你点亮的不只是陌生人的心火，更是某个灵魂独自前行时突然遇见的银河。",
            "",
            "我们为每位旅人准备了圣诞饼干*10，愿这点滴光芒能照亮你的圣诞夜。也别忘了去遇境寻找那棵巨大的圣诞树，和好友在树下合奏一曲，或者给远方那个久未上线的好友寄去一张手绘贺卡。",
            "",
            "愿圣岛的钟声为你带来平安，愿霞谷的雪花落成你肩上的祝福。这个圣诞节，你不是孤身一人。",
            "",
            "圣诞快乐，我们心火相逢处见",
            "—— QYServer"
        ].join("\n")),
        items: [
            "{id:\"minecraft:cookie\",Count:10b,tag:{display:{Name:\"圣诞饼干\"}}}"
        ],
        time: time2date("2025/12/25")
    }
];




// === 辅助函数 === //

function type2snbt(type, count = 1) {
    return (mc.newItem(type, count)).getNbt().toSNBT();
}

function time2date(time) {
    time = (new Date(time)).getTime();
    return ((time < 1e11)
        ? time * 1000
        : time
    );
}