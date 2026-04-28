const playerMailDB = new KVDatabase("./plugins/QYServer/Data/PlayerMail");
const mailConfig = new JsonConfigFile("./plugins/QYServer/Config/mail.json");

// 数据操作 
const data = {
    getPlayer(xuid) {
        return JSON.parse(playerMailDB.get(xuid) ?? null) || { read: {}, collected: {} };
    },

    savePlayer(xuid, obj) {
        return playerMailDB.set(xuid, JSON.stringify(obj));
    },

    getAllAnnouncements() {
        return mailConfig.get("mail") ?? [];
    },

    hasRead(xuid, id) {
        return (this.getPlayer(xuid)).read?.[id]?.includes(xuid) || false;
    },

    addRead(xuid, id) {
        const playerData = this.getPlayer(xuid);
        if (!playerData.read[id]) playerData.read[id] = [];
        if (!playerData.read[id].includes(xuid)) {
            playerData.read[id].push(xuid);
            this.savePlayer(xuid, playerData);
        }
    },

    hasCollected(xuid, id) {
        const playerData = this.getPlayer(xuid);
        return playerData.collected?.[id]?.includes(xuid) || false;
    },

    addCollected(xuid, id) {
        const playerData = this.getPlayer(xuid);
        if (!playerData.collected[id]) playerData.collected[id] = [];
        if (!playerData.collected[id].includes(xuid)) {
            playerData.collected[id].push(xuid);
            this.savePlayer(xuid, playerData);
        }
    }
};

// 辅助函数
function getPlayerJoinTime(pl) {
    return pl.getNbt()
        ?.getTag("DynamicProperties")
        ?.getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
        ?.getData("usfV2:id") || Date.now();
}

function giveAnnexItems(pl, ann) {
    if (!ann.annex?.items) return false;
    let count = 0;
    for (const snbt of ann.annex.items) {
        try {
            const item = mc.newItem(NBT.parseSNBT(snbt));
            if (item) {
                pl.giveItem(item);
                count++;
            }
        } catch (e) { }
    }
    return count > 0;
}

// 核心逻辑
const mailManager = {
    getAvailable(xuid) {
        const pl = mc.getPlayer(xuid);
        if (!pl) return [];

        const announcements = data.getAllAnnouncements();
        const joinTime = getPlayerJoinTime(pl);
        const now = Date.now();
        const available = [];

        for (const ann of announcements) {
            const expireTime = ann.expireDays ? ann.timestamp + (ann.expireDays * 86400000) : Infinity;
            const isExpired = now > expireTime;
            const isAfterJoin = ann.timestamp >= joinTime;
            const hasRead = data.hasRead(xuid, ann.id);

            // 规则：
            // 1. 必须在玩家加入后发布
            // 2. 已读的邮件：全部显示（包括过期的）
            // 3. 未读的邮件：只显示未过期的
            if (isAfterJoin && (hasRead || !isExpired)) {
                available.push(ann);
            }
        }
        return available.sort((a, b) => b.timestamp - a.timestamp);
    },

    // 获取未读邮件数量（只统计未过期的）
    getUnreadCount(xuid) {
        const announcements = data.getAllAnnouncements();
        const pl = mc.getPlayer(xuid);
        if (!pl) return 0;

        const joinTime = getPlayerJoinTime(pl);
        const now = Date.now();
        let count = 0;

        for (const ann of announcements) {
            // const expireTime = ann.expireDays ? ann.timestamp + (ann.expireDays * 86400000) : Infinity;
            // const isExpired = now > expireTime;
            const isAfterJoin = ann.timestamp >= joinTime;
            const hasRead = data.hasRead(xuid, ann.id);

            // 未读 + 未过期 + 在玩家加入后发布
            if (!hasRead /*&& !isExpired */ && isAfterJoin) {
                count++;
            }
        }
        return count;
    }
};

// 命令
const cmd = mc.newCommand('mail', '§a查看邮件', PermType.Any);
cmd.setCallback((_cmd, ori, out, _res) => {
    if (!ori.player) return;
    mailfm(ori.player);
});
cmd.overload([]);
cmd.setup();

// 界面
function mailfm(pl) {
    const xuid = pl.xuid;
    const announcements = mailManager.getAvailable(xuid);

    if (announcements.length === 0) return pl.tell("你没有收到任何邮件哦");

    const fm = mc.newSimpleForm();
    fm.setTitle("邮件");
    fm.setContent(`- 共收到了 ${announcements.length} 封邮件`);

    for (let i = 0; i < announcements.length; ++i) {
        const ann = announcements[i];
        const isRead = data.hasRead(xuid, ann.id);
        fm.addButton(
            (isRead ? ann.title : `[§e未读§r] ${ann.title}`),
            (ann.textures || (isRead ? "textures/ui/mail_icon.png" : "textures/ui/Envelope.png"))
        );
    }

    pl.sendForm(fm, (pl, id) => {
        if (id === null || id >= announcements.length) return;
        showContent(pl, id);
    });
}

function showContent(pl, index) {
    const xuid = pl.xuid;
    const announcements = mailManager.getAvailable(xuid);
    const ann = announcements[index];
    if (!ann) return;

    if (!data.hasRead(xuid, ann.id)) {
        data.addRead(xuid, ann.id);
    }

    const fm = mc.newSimpleForm();
    fm.setTitle(`§l${ann.title}`);

    const date = new Date(ann.timestamp);
    let content = `§l发布时间§r: §7${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}§r\n`;
    if (ann.expireDays) content += `§l有效时间§r: §7${ann.expireDays}天§r\n`;
    content += "\n§l------------------------------§r\n\n";
    content += `${ann.content}`;
    fm.setContent(content);

    const hasAnnex = ann.annex?.items?.length > 0;
    const isCollected = data.hasCollected(xuid, ann.id);

    if (hasAnnex && !isCollected) fm.addButton("领取附件", "textures/ui/Caution.png");
    else if (hasAnnex) fm.addButton("附件已领取", "textures/ui/check.png");

    fm.addButton("返回列表", "textures/ui/icon_import.png");

    pl.sendForm(fm, (pl, id2) => {
        if (id2 === 0 && hasAnnex && !isCollected) {
            if (giveAnnexItems(pl, ann)) {
                data.addCollected(xuid, ann.id);
                pl.tell("§a附件领取成功！");
            } else {
                pl.tell("§c附件领取失败，请联系管理员");
            }
            showContent(pl, index);
        } else if (id2 === (hasAnnex ? 1 : 0)) {
            mailfm(pl);
        }
    });
}

// 事件
mc.listen("onJoin", (pl) => {
    const xuid = pl.xuid;
    const announcements = mailManager.getAvailable(xuid);

    if (announcements.length > 0) {
        const unreadCount = announcements.filter(ann => !data.hasRead(xuid, ann.id)).length;
        if (unreadCount > 0) {
            mc.runcmdEx(`execute as "${pl.realName}" run scriptevent qys:command toast 2 "§e邮件通知§r\n你有 ${unreadCount} 条未读邮件！\n可使用 /mail 指令查看邮件" textures/ui/Envelope`);
            pl.tell(`§l§e[Mail] §r你有 ${unreadCount} 条未读邮件，输入 /mail 查看`);
        }
    }
});

ll.onUnload(() => {
    playerMailDB.close();
})