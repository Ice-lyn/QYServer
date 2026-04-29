import * as events from "../../lib/events.js";
import * as func from "../../lib/func.js";

const migrateMap = new Map();
const keys = new Map();

func.addOnmodeCmd("migrate", (player) => {
    if (keys.has(player.xuid) && keys.get(player.xuid).expire > Date.now()) {
        player.tell("§e检测到进行中的验证，请继续输入验证码");
        return verifyCode(player);
    }
    const fm = mc.newCustomForm()
        .setTitle("迁移账户")
        .addInput("请输入您的§l完整§r旧账户名：");

    player.sendForm(fm, (player, res) => {
        if (func.isNull(res)) return player.tell("输入错误，请重新输入");
        const oldPlayer = data.name2xuid(res[0]) ?? null;
        const playerMail = JSON.parse(
            (func.globalMap
                .get("Core::UserBind::PlayerBind")
            ).get(oldPlayer) ?? null
        )?.email || null;

        if (res[0] === player.realName) return player.tell("不要自己对自己迁移!")
        if (oldPlayer === null) return player.tell("旧账户不存在，请重新输入!");
        if (playerMail === null) return player.tell("旧账户没有绑定邮箱，请联系管理员手动迁移");

        migrateMap.set(player.xuid, oldPlayer);
        sendKeyMailForm(player, playerMail);
    })
});

function sendKeyMailForm(player, email) {
    const code = {
        key: (Math.floor(100000 + Math.random() * 900000).toString()),
        expire: (Date.now() + (10 * 60 * 1000))
    };

    const fm = mc.newSimpleForm()
        .setTitle("发送邮件验证")
        .setContent(
            "§a接下来将发送一封邮件到您旧账号绑定的邮箱，请注意查收\n"
            + "§b验证码有效期为10分钟，您可以§l退出游戏查看后再进入游戏输入"
        )
        .addButton("发送")
        .addButton("取消");

    player.sendForm(fm, (pl, id) => {
        if (id !== 0) return;
        keys.set(player.xuid, code);
        verifyCode(player, code);
        func.sendMail({
            from: '"月月呀" <xiaoyue0782@163.com>',
            to: email,
            subject: "QYServer | 账户迁移验证",
            text: ([
                `您好！${player.realName}：`,
                "我们收到了您的账户迁移申请。为确保是您本人操作，请使用以下验证码完成迁移验证：",
                "",
                `验证码：${code.key}`,
                "有效期10分钟，请勿泄露给他人哦~",
                "",
                "如非您本人操作，请立即修改密码或联系客服处理。祝您使用愉快！",
                "QYServer"
            ].join("\n")),
            html: ([
                `<div>您好！${player.realName}：</div>`,
                "<div>我们收到了您的账户迁移申请。为确保是您本人操作，请使用以下验证码完成迁移验证：</div>",
                "<div><br /></div>",
                `<div><b>验证码：${code.key}</b></div>`,
                "<div>有效期10分钟，请勿泄露给他人哦~</div>",
                "<div><br /></div>",
                "<div>如非您本人操作，请立即修改密码或联系客服处理。祝您使用愉快！</div>",
                "<div>QYServer</div>"
            ].join(""))
        }, (res, isSend) => {
            if (!isSend) {
                player.tell("§c验证码发送失败，请稍后再试或联系管理员。");
                logger.warn(JSON.stringify(res, (key, value) => {
                    if (key === 'request' || key === 'config' || key === 'headers') return undefined;
                    if (typeof value === 'bigint') return value.toString();
                    return value;
                }, 4));
                return;
            }
            player.tell("§a验证码已发送至你的邮箱，请查收！");
        });
    });
}

function verifyCode(player, code) {
    const fm = mc.newCustomForm()
        .setTitle("迁移账户")
        .addInput("请输入您收到的验证码：");

    player.sendForm(fm, (player, res) => {
        if (func.isNull(res)) return player.tell("输入错误，请重新输入");
        if (res[0] !== `${keys.get(player.xuid).key}`) return player.tell("验证码错误，请重新输入!");
        else player.sendModalForm(
            "二次确认",
            "您真的确定要迁移用户吗？\n这将会清除您目前账户的所有内容并覆盖旧账户上的部分数据！",
            "确定迁移", "取消迁移",
            (player, id) => {
                if (id === 0) return player.tell("§c已取消迁移");

                if (func.isNull(data.xuid2uuid(newXuid))
                    || func.isNull(data.xuid2uuid(oldXuid))
                ) return player.tell("§c迁移失败，请联系管理员手动迁移！");

                player.kick("正在迁移您的账户，请在稍后重新登录！");
                userMigrate(player.xuid, migrateMap.get(player.xuid));
            }
        )
    })
}

function userMigrate(newXuid, oldXuid) {
    // === MC === //
    const oldNbt = mc.getPlayerNbt(oldXuid);
    mc.setPlayerNbt(data.xuid2uuid(oldXuid), mc.getPlayerNbt(newXuid));
    mc.setPlayerNbt(data.xuid2uuid(newXuid), oldNbt);

    // === ILAND === //

    // 受信任的
    ll.imports("ILAPI_GetAllTrustedLand")(oldXuid).forEach((landId) => {
        ll.imports("ILAPI_AddTrust")(landId, newXuid);
        ll.imports("ILAPI_RemoveTrust")(landId, oldXuid);
    });

    // 拥有领地
    const oldLands = ll.imports("ILAPI_GetPlayerLands")(oldXuid);

    ll.imports("ILAPI_GetPlayerLands")(newXuid).forEach((id) => {
        ll.imports("ILAPI_SetOwner")(id, oldXuid);
    });

    oldLands.forEach((id) => {
        ll.imports("ILAPI_SetOwner")(id, newXuid);
    });
}

