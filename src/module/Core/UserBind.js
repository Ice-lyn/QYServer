import * as events from "../../lib/events.js";
import * as func from "../../lib/func.js";

const PlayerBind = new KVDatabase("./plugins/QYServer/Data/PlayerBind");

func.globalMap.set("Core::UserBind::PlayerBind", PlayerBind);
ll.onUnload(() => {
    func.globalMap.delete("Core::UserBind::PlayerBind");
    PlayerBind.close();
})

func.addOnmodeCmd("setmail", (player) => {
    setMailUI(player);
});

function setMailUI(player) {
    const playerData = playerDataMgr.get(player.xuid);

    // 已绑定邮箱 → 进入管理页面
    if (playerData.email) return showMailManageUI(player);

    // 未绑定 → 检查是否有有效的验证码缓存
    if (playerData.verifyCode
        && playerData.pendingEmail
        && Date.now() < playerData.verifyExpire
        // && false
    ) {
        // 已有有效验证码，直接跳转到验证码输入页面
        player.tell("§e检测到进行中的绑定，请继续输入验证码");
        showVerifyCodeForm(player);
    } else {
        // 清除过期缓存
        if (playerData.verifyCode) {
            delete playerData.verifyCode;
            delete playerData.verifyExpire;
            delete playerData.pendingEmail;
            playerDataMgr.save(player.xuid, playerData);
        }
        showBindEmailForm(player);
    }
}

// ==================== 数据操作 ====================
const playerDataMgr = {
    get: (xuid) => {
        const raw = PlayerBind.get(xuid);
        if (raw) return JSON.parse(raw);
        return { email: null, verifyCode: null, verifyExpire: 0, pendingEmail: null };
    },

    save: (xuid, data) => {
        PlayerBind.set(xuid, JSON.stringify(data));
    }
}

// ==================== 邮箱绑定流程 ====================
function showBindEmailForm(player) {
    const fm = mc.newCustomForm()
        .setTitle("邮箱绑定")
        .addInput("请输入你要绑定的邮箱地址：", "例如：123456@qq.com")
        .addLabel(
            "§a输入后，将发送一份验证码至您的邮箱，请注意查收§r\n" +
            "§b验证码有效期为5分钟，您可以§l退出游戏查看后再进入游戏输入§r"
        );

    player.sendForm(fm, (player, data) => {
        if (func.isNull(data)) return;
        const email = data[0];
        if (!email || !email.includes('@')) {
            player.tell("§c邮箱格式不正确，请重新输入！");
            return showBindEmailForm(pl);
        }
        player.tell("发送邮件中...")
        sendVerifyCode(player, email);
    });
}

function sendVerifyCode(player, email) {
    const xuid = player.xuid;
    const expire = Date.now() + 5 * 60 * 1000; // 有效期
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码和邮箱
    let playerData = playerDataMgr.get(xuid);
    playerData.verifyCode = code;
    playerData.verifyExpire = expire;
    playerData.pendingEmail = email;
    playerDataMgr.save(xuid, playerData);

    func.sendMail({
        from: '"QYBind" <admin@m.qyserver.cc>',
        to: email,
        subject: "QYServer | 邮箱绑定验证",
        text: ([
            `您好！${player.realName}：`,
            "感谢您选择我们的服务！为了确保您的账户安全，请查收本次绑定邮箱的验证码：",
            "",
            `验证码：${code}`,
            "有效期5分钟，请勿泄露给他人哦~",
            "",
            "如有任何疑问，欢迎随时联系我们。祝您使用愉快！",
            "QYServer"
        ].join("\n")),
        html: ([
            `<div>您好！${player.realName}：</div>`,
            "<div>感谢您选择我们的服务！为了确保您的账户安全，请查收本次绑定邮箱的验证码：</div>",
            "<div><br /></div>",
            `<div><b>验证码：${code}</b></div>`,
            "<div>有效期5分钟，请勿泄露给他人哦~</div>",
            "<div><br /></div>",
            "<div>如有任何疑问，欢迎随时联系我们。祝您使用愉快！</div>",
            "<div>QYServer</div>"
        ].join(""))
    }, (res, isSend) => {

        if (!isSend) {
            player.tell("§c验证码发送失败，请稍后再试或联系管理员。");
            // 清除暂存数据
            let data = playerDataMgr.get(xuid);
            delete data.verifyCode;
            delete data.verifyExpire;
            delete data.pendingEmail;
            playerDataMgr.save(xuid, data);
            logger.warn(JSON.stringify(res, (key, value) => {
                if (key === 'request' || key === 'config' || key === 'headers') return undefined;
                if (typeof value === 'bigint') return value.toString();
                return value;
            }, 4));
            return;
        }
        player.tell("§a验证码已发送至你的邮箱，请查收！");
        showVerifyCodeForm(player);
    });
}

function showVerifyCodeForm(player) {
    const fm = mc.newCustomForm()
        .setTitle("邮箱绑定")
        .addInput("请输入你收到的6位验证码：", "验证码");

    player.sendForm(fm, (pl, data) => {
        if (func.isNull(data)) return;
        const playerData = playerDataMgr.get(pl.xuid);
        const storedCode = playerData.verifyCode;
        const expire = playerData.verifyExpire;
        const pendingEmail = playerData.pendingEmail;

        // 检查是否有进行中的绑定
        if (!storedCode || !pendingEmail) {
            pl.tell("§c没有进行中的绑定，请重新开始。");
            return showBindEmailForm(pl);
        }

        // 检查是否过期
        if (Date.now() > expire) {
            pl.tell("§c验证码已过期，请重新获取。");
            // 清理过期数据
            delete playerData.verifyCode;
            delete playerData.verifyExpire;
            delete playerData.pendingEmail;
            playerDataMgr.save(pl.xuid, playerData);
            return showBindEmailForm(pl);
        }

        // 验证码校验
        if (data[0] !== storedCode) {
            pl.tell("§c验证码错误，请重新输入！");
            return showVerifyCodeForm(pl);
        }

        // 验证成功，绑定邮箱
        playerData.email = pendingEmail;
        delete playerData.verifyCode;
        delete playerData.verifyExpire;
        delete playerData.pendingEmail;
        playerDataMgr.save(pl.xuid, playerData);
        pl.tell("§a邮箱绑定成功！");
    });
}

// ==================== 邮箱管理页面 ====================
function showMailManageUI(player) {
    const isReceive = player.hasTag("qys:mail_receive");
    const fm = mc.newSimpleForm()
        .setTitle("§l邮箱管理")
        .setContent(`§7当前绑定的邮箱：§e${playerDataMgr.get(player.xuid).email || "未绑定"}`)
        .addButton("关闭菜单", "textures/ui/arrow_dark_left_stretch")
        .addButton("重新绑定", "textures/ui/refresh")
        .addButton("解除绑定", "textures/ui/trash")
        .addButton(`接收信息 - ${isReceive ? "§a开" : "§c关"}`);

    player.sendForm(fm, (player, id) => {
        if (!id) return;
        switch (id) {
            case 1: // 重新绑定
                confirmRebind(player);
                break;
            case 2: // 解除绑定
                confirmUnbind(player);
                break;
            case 3:
                isReceive ? player.removeTag("qys:mail_receive") : player.addTag("qys:mail_receive");
                showMailManageUI(player);
                break;
        }
    });
}

// 重新绑定确认
function confirmRebind(player) {
    const fm = mc.newSimpleForm()
        .setTitle("§l重新绑定邮箱")
        .setContent("§c重新绑定后，原邮箱将被解绑！\n是否继续？")
        .addButton("§c确认")
        .addButton("§a取消");

    player.sendForm(fm, (pl, id) => {
        if (id !== 0) return;
        // 清除原邮箱，重新开始绑定
        const xuid = pl.xuid;
        let playerData = playerDataMgr.get(xuid);
        playerData.email = null;
        // 同时清除可能存在的验证码缓存
        delete playerData.verifyCode;
        delete playerData.verifyExpire;
        delete playerData.pendingEmail;
        playerDataMgr.save(xuid, playerData);
        pl.tell("§e原邮箱已解绑！");
        showBindEmailForm(pl);
    });
}

// 解除绑定确认
function confirmUnbind(player) {
    const fm = mc.newSimpleForm()
        .setTitle("§l解除邮箱绑定")
        .setContent("§c解除绑定后，你将无法通过邮箱迁移账户/接收信息等服务！\n是否确认解除？")
        .addButton("§c确认")
        .addButton("§a取消");

    player.sendForm(fm, (pl, id) => {
        if (id !== 0) return;
        let playerData = playerDataMgr.get(pl.xuid);
        playerData.email = null;
        // 清除验证码缓存
        delete playerData.verifyCode;
        delete playerData.verifyExpire;
        delete playerData.pendingEmail;
        playerDataMgr.save(pl.xuid, playerData);
        pl.tell("§a邮箱已解除绑定");
    });
}