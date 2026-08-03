export const env = {
    // DS 的密钥
    deepseek_key: "sk-KFCcrazyDay4Vme50quickly",

    // 联网搜索key
    web_key: "uapi-KFCcrazyDay4Vme50quickly",

    // 邮件
    mail_auth: {
        user: "KFC", // 账号
        pass: "sk_KFCcrazyDay4Vme50quickly"  // 授权码
    },

    // 服务器列表
    server_list: [
        {
            name: "§bJava 互通服",                      // 名称
            ip: "*.*.*.*",                             // IP
            port: 19132,                               // 端口
            ui: "textures/ui/controller_glyph_color",  // 显示图标
            version: [924, 944, 975, 1001]             // 支持的版本
        },
        {
            name: "§a测试服",
            ip: "*.*.*.*",
            port: 19132,
            ui: "textures/ui/World",
            version: [766, 776, 786, 800, 818, 819, 827, 844]
        },
        {
            name: "§6后室服", ip: "*.*.*.*",
            port: 19132,
            ui: "textures/ui/World",
            version: [766, 776, 786, 800, 818, 819, 827, 844]
        },
        {
            name: "§9创造服",
            ip: "*.*.*.*",
            port: 19132,
            ui: "textures/ui/World",
            version: [766, 776, 786, 800, 818, 819, 827, 844]
        }
    ],

    // 节点列表
    node_list: [
        { name: "宁波电信", ip: "*.*.*.*", port: 41657, ui: "textures/ui/World" },
        { name: "江苏", ip: "*.*.*.*", port: 41657, ui: "textures/ui/World" },
        { name: "上海", ip: "*.*.*.*", port: 41657, ui: "textures/ui/World" },
        { name: "广东", ip: "*.*.*.*", port: 41657, ui: "textures/ui/World" },
        { name: "美国", ip: "*.*.*.*", port: 41657, ui: "textures/ui/World" }
    ]
};