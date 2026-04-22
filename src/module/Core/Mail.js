const MAIL_CONFIG_PATH = "./plugins/QYServer/config/mail.json";
const PLAYER_DATA_PATH = "./plugins/QYServer/Data/System/mail_playerData.json";
const debug_mode = false;

// 邮件配置文件
const mailConfig = new JsonConfigFile(MAIL_CONFIG_PATH, JSON.stringify({
    announcements: [
        {
            id: "ann_001",
            title: "服务器更新公告",
            content: "服务器已更新至1.20版本，新增功能...",
            textures: "textures/ui/mail_icon.png",
            annex: {
                items: [
                    '{id:"minecraft:diamond",Count:3b,tag:{display:{Name:\'{"text":"测试钻石"}\'}}}',
                    '{id:"minecraft:gold_ingot",Count:5b}'
                ]
            },
            timestamp: 1734192000000
        }
    ]
}))

{
    const cmd = mc.newCommand('mail', '§a查看邮件', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (!ori.player) return;
        mailfm(ori.player);
    });
    cmd.overload([]);
    cmd.setup();
}

// 玩家数据文件
const playerData = new JsonConfigFile(PLAYER_DATA_PATH, JSON.stringify({
    // 这个是初始化的！不是重复定义！
    read: {},      // ann_001: ["xuid1", "xuid2"]
    collected: {}  // ann_001: ["xuid1"]
}));

// 数据管理
const data = {
    getAllAnnouncements: () => {
        const allData = JSON.parse(mailConfig.read());  // 直接读取
        return allData.announcements || [];
    },

    hasPlayerRead: (xuid, annId) => {
        const allData = JSON.parse(playerData.read());  // 直接读取
        const readers = allData.read?.[annId] || [];
        return readers.includes(xuid);
    },

    addReadRecord: (xuid, annId) => {
        const allData = JSON.parse(playerData.read());

        if (!allData.read) allData.read = {};
        if (!allData.read[annId]) allData.read[annId] = [];

        if (!allData.read[annId].includes(xuid)) {
            allData.read[annId].push(xuid);
            playerData.write(JSON.stringify(allData, null, 4));  // 只有写操作
        }
    },

    isAnnexCollected: (xuid, annId) => {
        const allData = JSON.parse(playerData.read());
        const collected = allData.collected?.[annId] || [];
        return collected.includes(xuid);
    },

    markAnnexCollected: (xuid, annId) => {
        const allData = JSON.parse(playerData.read());

        if (!allData.collected) allData.collected = {};
        if (!allData.collected[annId]) allData.collected[annId] = [];

        if (!allData.collected[annId].includes(xuid)) {
            allData.collected[annId].push(xuid);
            playerData.write(JSON.stringify(allData, null, 4));  // 只有写操作
        }
    }
};
/*const data = {
    getAllAnnouncements: () => {
        mailConfig.reload();
        const allData = JSON.parse(mailConfig.read());
        return allData.announcements || [];
    },
    
    hasPlayerRead: (xuid, annId) => {
        playerData.reload();
        const allData = JSON.parse(playerData.read());
        const readers = allData.read?.[annId] || [];
        return readers.includes(xuid);
    },
    
    addReadRecord: (xuid, annId) => {
        playerData.reload();
        const allData = JSON.parse(playerData.read());
        
        if (!allData.read) allData.read = {};
        if (!allData.read[annId]) allData.read[annId] = [];
        
        if (!allData.read[annId].includes(xuid)) {
            allData.read[annId].push(xuid);
        }
        
        playerData.write(JSON.stringify(allData, null, 4));
    },
    
    isAnnexCollected: (xuid, annId) => {
        playerData.reload();
        const allData = JSON.parse(playerData.read());
        const collected = allData.collected?.[annId] || [];
        return collected.includes(xuid);
    },
    
    markAnnexCollected: (xuid, annId) => {
        playerData.reload();
        const allData = JSON.parse(playerData.read());
        
        if (!allData.collected) allData.collected = {};
        if (!allData.collected[annId]) allData.collected[annId] = [];
        
        if (!allData.collected[annId].includes(xuid)) {
            allData.collected[annId].push(xuid);
        }
        
        playerData.write(JSON.stringify(allData, null, 4));
    }
};*/

// 从NBT获取玩家加入时间
function getPlayerJoinTime(player) {
    try {
        const nbt = player.getNbt();
        const joinTime = nbt
            ?.getTag("DynamicProperties")
            ?.getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
            ?.getData("usfV2:id");
        return joinTime ? parseInt(joinTime) : 0;
    } catch {
        return 0;
    }
}

// 邮件管理（恢复加入时间判断）
/*const mailManager = {
    getAvailableAnnouncements: (xuid) => {
        const player = mc.getPlayer(xuid);
        if (!player) return [];
        
        mailConfig.reload();
        const allData = JSON.parse(mailConfig.read());
        const announcements = allData.announcements || [];
        
        const playerJoinTime = getPlayerJoinTime(player);
        const now = Date.now();
        const available = [];
        
        for (const ann of announcements) {
            const expireTime = ann.expireDays ? ann.timestamp + (ann.expireDays * 86400000) : Infinity;
            const isExpired = now > expireTime;
            const isAfterJoin = ann.timestamp >= playerJoinTime;
            
            // 已读过 或 （未过期且在加入时间之后）
            if (data.hasPlayerRead(xuid, ann.id) || (!isExpired && isAfterJoin)) {
                available.push(ann);
            }
        }
        
        return available.sort((a, b) => b.timestamp - a.timestamp);
    }
};*/
const mailManager = {
    getAvailableAnnouncements: (xuid) => {
        const player = mc.getPlayer(xuid);
        if (!player) return [];

        const announcements = data.getAllAnnouncements();  // 用缓存的数据
        const playerJoinTime = getPlayerJoinTime(player);
        const now = Date.now();
        const available = [];

        for (const ann of announcements) {
            const expireTime = ann.expireDays ? ann.timestamp + (ann.expireDays * 86400000) : Infinity;
            const isExpired = now > expireTime;
            const isAfterJoin = ann.timestamp >= playerJoinTime;

            if (data.hasPlayerRead(xuid, ann.id) || (!isExpired && isAfterJoin)) {
                available.push(ann);
            }
        }

        return available.sort((a, b) => b.timestamp - a.timestamp);
    }
};

// 附件处理（保持不变）
function giveAnnexItems(pl, announcement) {
    if (!announcement.annex?.items) return false;

    const items = announcement.annex.items;
    let givenCount = 0;

    for (const snbt of items) {
        try {
            const item = mc.newItem(NBT.parseSNBT(snbt));
            if (item) {
                pl.giveItem(item);
                givenCount++;
            }
        } catch (e) {
            log(`发放物品失败: ${snbt}`, e);
        }
    }

    return givenCount > 0;
}

// 邮件列表界面（保持不变）
export function mailfm(pl) {
    const xuid = pl.xuid;
    const announcements = mailManager.getAvailableAnnouncements(xuid);

    if (announcements.length === 0) {
        return pl.tell("你没有收到任何邮件哦");
    }

    const fm = mc.newSimpleForm();
    fm.setTitle("邮件");
    fm.setContent(`- 共收到了 ${announcements.length} 封邮件`);

    for (let i = 0; i < announcements.length; ++i) {
        const ann = announcements[i];
        const isRead = data.hasPlayerRead(xuid, ann.id);
        const icon = ann.textures || (isRead ? "textures/ui/mail_icon.png" : "textures/ui/Envelope.png");
        const title = isRead ? ann.title : `[§e未读§r] ${ann.title}`;

        fm.addButton(title, icon);
    }

    pl.sendForm(fm, (pl, id) => {
        if (id === null || id >= announcements.length) return;
        showAnnouncementContent(pl, id);
    });
}

// 查看公告内容界面（保持不变）
function showAnnouncementContent(pl, index) {
    const xuid = pl.xuid;
    const announcements = mailManager.getAvailableAnnouncements(xuid);
    const ann = announcements[index];

    if (!ann) return;

    if (!data.hasPlayerRead(xuid, ann.id)) {
        data.addReadRecord(xuid, ann.id);
    }

    const fm = mc.newSimpleForm();
    fm.setTitle(`§l${ann.title}`);

    const date = new Date(ann.timestamp);
    let content = `发布时间: ${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}\n`;
    if (ann.expireDays) content += `有效期: ${ann.expireDays}天\n`;
    content += "§l---------------§r\n\n";
    content += `${ann.content}`;

    fm.setContent(content);

    const hasAnnex = ann.annex?.items?.length > 0;
    const isCollected = data.isAnnexCollected(xuid, ann.id);

    if (hasAnnex && !isCollected) {
        fm.addButton("领取附件", "textures/ui/Caution.png");
    } else if (hasAnnex) {
        fm.addButton("附件已领取", "textures/ui/check.png");
    }

    fm.addButton("返回列表", "textures/ui/icon_import.png");

    pl.sendForm(fm, (pl, id2) => {
        if (id2 === 0 && hasAnnex && !isCollected) {
            if (giveAnnexItems(pl, ann)) {
                data.markAnnexCollected(xuid, ann.id);
                pl.tell("§a附件领取成功！");
            } else {
                pl.tell("§c附件领取失败，请联系管理员");
            }
            showAnnouncementContent(pl, index);
        } else if (id2 === (hasAnnex ? 1 : 0)) {
            mailfm(pl);
        }
    });
}

// 事件监听（恢复新玩家判断）
mc.listen("onJoin", (pl) => {
    if (!debug_mode && pl.realName !== "fangfubin0782") return;

    const xuid = pl.xuid;
    const announcements = mailManager.getAvailableAnnouncements(xuid);

    if (announcements.length > 0) {
        const unreadCount = announcements.filter(ann => !data.hasPlayerRead(xuid, ann.id)).length;

        if (unreadCount > 0) {
            mc.runcmdEx(`execute as "${pl.realName}" run scriptevent qys:command toast 2 \"§e邮件通知§r\n你有 ${unreadCount} 条未读邮件！\n可使用 /mail 指令查看邮件\" textures/ui/Envelope`)
            pl.tell(`§l§e[Mail] §r你有 ${unreadCount} 条未读邮件，输入 /mail 查看`);
        }
    }
})