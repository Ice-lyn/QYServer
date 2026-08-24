import { mailList } from "../../../Config/mail.js";
import * as func from "../../lib/func.js";

/**
 * TODO
 * - 增加fm自定义
 * - 增加更多附件
 */

const playerMailDB = new KVDatabase("./plugins/QYServer/Data/PlayerMail");
const mailDataMap = new Map();

ll.onUnload(() => playerMailDB.close());

// 邮件数据 增删查
const mailData = {

    // 获取玩家邮件数据
    getPlayer: (xuid) => JSON.parse(playerMailDB.get(xuid) ?? null) || { read: {}, collected: {} },

    // 保存玩家邮件数据
    savePlayer: (xuid, obj) => playerMailDB.set(xuid, JSON.stringify(obj)),

    // 附件是否已领取
    hasCollected: (xuid, id) => (mailData.getPlayer(xuid)).collected?.[id]?.includes(xuid) || false,

    // 邮件是否已读
    hasRead: (xuid, id) => (mailData.getPlayer(xuid)).read?.[id]?.includes(xuid) || false,

    // 获取所有邮件
    getAllMail: () => {
        return (mailList || [])
            .filter(({id}) => id !== undefined)
            .map(mail => ({
                id: mail.id, // id
                title: mail.title, // 标题
                content: mail.content, // 内容
                days: mail.days ?? false, // 有效期

                items: mail.items || [], // 附件

                time: mail.time, // 发布时间
                ignoreTime: mail.ignoreTime || false, // 忽略加入时间
            }))
    },

    // 添加已读邮件
    addRead: (xuid, id) => {
        if (mailDataMap.has(xuid))
            mailDataMap.delete(xuid);
        const playerData = mailData.getPlayer(xuid);
        if (!playerData.read[id]) playerData.read[id] = [];
        if (!playerData.read[id].includes(xuid)) {
            playerData.read[id].push(xuid);
            mailData.savePlayer(xuid, playerData);
        }
    },

    // 添加已领取附件的邮件
    addCollected: (xuid, id) => {
        if (mailDataMap.has(xuid))
            mailDataMap.delete(xuid);
        const playerData = mailData.getPlayer(xuid);
        if (!playerData.collected[id]) playerData.collected[id] = [];
        if (!playerData.collected[id].includes(xuid)) {
            playerData.collected[id].push(xuid);
            mailData.savePlayer(xuid, playerData);
        }
    },

    // 获取玩家邮件列表
    getAvailable(xuid) {
        if (mailDataMap.has(xuid))
            return [...mailDataMap.get(xuid)];

        const time = Date.now();
        const joinTime = func.getJoinTime(data.xuid2uuid(xuid));

        const available = [];
        mailData.getAllMail().forEach(mail => {
            const expireTime = mail.days
                ? mail.time + (mail.days * 86400000)
                : Infinity;

            // 规则：
            // 1. 如果 IgnoreTime 为 true，所有玩家都能看到（但受过期和已读状态影响）
            // 2. IgnoreTime 为 false 时，必须在玩家加入后发布
            // 3. 已读的邮件：全部显示（包括过期的）
            // 4. 未读的邮件：只显示未过期的
            if ((mail.ignoreTime || mail.time >= joinTime)
                && (mailData.hasRead(xuid, mail.id) || time <= expireTime)
            ) available.push(mail);
        })

        const data = available.sort((a, b) => b.time - a.time);
        mailDataMap.set(xuid, data);
        return data;
    }
}

mc.listen("onLeft", (player) => mailDataMap.delete(player.xuid));
mc.listen("onJoin", (player) => {
    if (!player?.inWorld) return;
    const mails = mailData.getAvailable(player.xuid)
        .filter(mail => !mailData.hasRead(player.xuid, mail.id));

    if (mails.length > 0) {
        mc.runcmdEx(`execute as "${player.realName}" run scriptevent qys:command toast 2 "§e邮件通知§r\n你有 ${mails.length} 条未读邮件！\n可使用 /mail 指令查看邮件" textures/ui/Envelope`);
        player.tell(`§l§e[Mail]§r 你有 ${mails.length} 条未读邮件，输入 /mail 查看`);
    }
});

{ // 命令注册
    const cmd = mc.newCommand('mail', '§a查看邮件', PermType.Any);
    cmd.setCallback((_cmd, ori, out, _res) => {
        if (func.isNull(ori.player)) return;
        mailMainUI(ori.player)
    });
    cmd.overload([]);
    cmd.setup();
}


function mailMainUI(player) {
    const mailList = mailData.getAvailable(player.xuid);

    if (mailList.length === 0) return player.tell("你没有收到任何邮件哦");
    const fm = mc.newSimpleForm()
        .setTitle("邮件")
        .setContent(`- 共收到了 ${mailList.length} 封邮件`);

    mailList.forEach(mail => {
        const isRead = mailData.hasRead(player.xuid, mail.id);

        fm.addButton(
            `${isRead ? "" : "[§e未读§r]"}${mail.title}`,
            (mail.textures || (isRead ? "textures/ui/mail_icon.png" : "textures/ui/Envelope.png"))
        );
    })

    player.sendForm(fm, (player, id) => {
        if (func.isNull(id)) return;

        if (func.isNull(mailList[id]))
            return player.tell("邮件数据不存在!");
        else
            return mailInfoUI(player, mailList[id]);
    });
}

function mailInfoUI(player, data) {
    if (!mailData.hasRead(player.xuid, data.id))
        mailData.addRead(player.xuid, data.id);

    const hasAnnex = data?.items?.length > 0;
    const fm = mc.newSimpleForm()
        .setTitle(`§l${data.title}§r`)
        .setContent([
            `§l发布时间§r: §7${(new Date(data.time)).toISOString().split('T')[0]}§r`,
            ...data.days ? [`§l有效时间§r: §7${data.days}天§r`] : [],
            " ",
            "§l------------------------------§r",
            " ",
            " ",
            data.content
        ].join("\n"));

    if (hasAnnex) {
        if (mailData.hasCollected(player.xuid, data.id))
            fm.addButton("附件已领取", "textures/ui/check.png");
        else
            fm.addButton("领取附件", "textures/ui/Caution.png");
    }

    fm.addButton("返回列表", "textures/ui/icon_import.png");

    player.sendForm(fm, (player, id) => {
        if (func.isNull(id)
            || id === (hasAnnex ? 1 : 0)
            || mailData.hasCollected(player.xuid, data.id)
        ) return mailMainUI(player);

        mailData.addCollected(player.xuid, data.id);
        data.items.forEach(snbt => {
            try {
                player.giveItem(mc.newItem(NBT.parseSNBT(snbt)));
            } catch (e) {
                func.titleLog.warn("Mail", player, " 领取邮件时发生错误: ", e);
            }
        })

        player.tell("§a附件领取成功！");
        mailInfoUI(player, data);
    })
}