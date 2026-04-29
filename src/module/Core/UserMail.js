// 在 Mail.js 中继续
import * as events from "../../lib/events.js";
import * as func from "../../lib/func.js";

const playerKey = new KVDatabase("./plugins/QYServer/Data/Player");
const mailKeys = new Map(); // 临时存储验证码（也可以使用 playerKey 统一存储，这里我们只用 playerKey）

events.on("onModeCallback", (player, cmd) => {
    if (cmd[0] !== "setmail") return;
    setMailUI(player);
    return true;
});

function setMailUI(player) {
    const xuid = player.xuid;
    const playerData = getPlayerData(xuid);
    const isBound = !!playerData.email;

    // 如果没有绑定，先进入“输入邮箱”表单
    if (!isBound) {
        showBindEmailForm(player);
    } else {
        // 如果已经绑定，可以询问是否修改邮箱（这里先简单提示已绑定）
        player.tell("你已经绑定了邮箱：" + playerData.email);
        // 可选：再提供一个修改邮箱的入口（类似 ─ 输入新邮箱 → 验证）
        showModifyEmailConfirm(player);
    }
}

// 获取玩家数据（含邮箱和验证码）
function getPlayerData(xuid) {
    const raw = playerKey.get(xuid);
    if (raw) {
        return JSON.parse(raw);
    }
    return { email: null, verifyCode: null, verifyExpire: 0 };
}

// 保存玩家数据
function savePlayerData(xuid, data) {
    playerKey.set(xuid, JSON.stringify(data));
}

// 生成6位数字验证码
function generateVerifyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 第一步：显示绑定邮箱表单（输入邮箱地址）
function showBindEmailForm(player) {
    const form = mc.newCustomForm();
    form.setTitle("邮箱绑定");
    form.addInput("请输入你要绑定的邮箱地址：", "例如：123456@qq.com");
    player.sendForm(form, (pl, data) => {
        if (data === null) return;
        const email = data[0];
        if (!email || !email.includes('@')) {
            pl.tell("§c邮箱格式不正确，请重新输入！");
            return showBindEmailForm(pl);
        }
        // 发送验证码
        sendVerifyCode(pl, email);
    });
}

// 发送验证码（生成、存储、发邮件、然后进入验证码输入界面）
function sendVerifyCode(player, email) {
    const xuid = player.xuid;
    const code = generateVerifyCode();
    const expire = Date.now() + 15 * 60 * 1000; // 15分钟有效

    // 存储验证码和邮箱（暂存，还未真正绑定）
    let playerData = getPlayerData(xuid);
    playerData.verifyCode = code;
    playerData.verifyExpire = expire;
    playerData.pendingEmail = email;
    savePlayerData(xuid, playerData);

    // 准备邮件内容
    const name = player.realName;
    const subject = "QYServer | 邮箱绑定验证";
    const text = [
        `亲爱的 ${name}：`,
        "您好！",
        "感谢您选择我们的服务！为了确保您的账户安全，请查收本次绑定邮箱的验证码：",
        "",
        `验证码：${code}`,
        "有效期15分钟，请勿泄露给他人哦~",
        "",
        "如有任何疑问，欢迎随时联系我们。祝您使用愉快！",
        "QYServer 团队"
    ].join("\n");

    const html = [
        `<div>亲爱的 ${name}：<br /></div>`,
        "<div>您好！</div>",
        "<div>感谢您选择我们的服务！为了确保您的账户安全，请查收本次绑定邮箱的验证码：</div>",
        "<div><br /></div>",
        `<div><b>验证码：${code}</b></div>`,
        "<div>有效期15分钟，请勿泄露给他人哦~</div>",
        "<div><br /></div>",
        "<div>如有任何疑问，欢迎随时联系我们。祝您使用愉快！</div>",
        "<div>QYServer 团队</div>"
    ].join("");

    func.sendMail({
        from: '"月月呀" <xiaoyue0782@163.com>',
        to: email,
        subject: subject,
        text: text,
        html: html
    }, (err, success) => {
        if (err || !success) {
            player.tell("§c验证码发送失败，请稍后再试或联系管理员。");
            // 清除暂存数据
            let data = getPlayerData(xuid);
            delete data.verifyCode;
            delete data.verifyExpire;
            delete data.pendingEmail;
            savePlayerData(xuid, data);
            return;
        }
        player.tell("§a验证码已发送至你的邮箱，请查收！");
        // 进入验证码输入界面
        showVerifyCodeForm(player);
    });
}

// 第二步：验证码输入界面
function showVerifyCodeForm(player) {
    const form = mc.newCustomForm();
    form.setTitle("邮箱绑定");
    form.addInput("请输入你收到的6位验证码：", "验证码");
    player.sendForm(form, (pl, data) => {
        if (data === null) return;
        const inputCode = data[0];
        const xuid = pl.xuid;
        const playerData = getPlayerData(xuid);
        const storedCode = playerData.verifyCode;
        const expire = playerData.verifyExpire;
        const pendingEmail = playerData.pendingEmail;

        if (!storedCode || !pendingEmail || Date.now() > expire) {
            pl.tell("§c验证码已过期或未发送，请重新开始绑定。");
            // 清理无效数据
            delete playerData.verifyCode;
            delete playerData.verifyExpire;
            delete playerData.pendingEmail;
            savePlayerData(xuid, playerData);
            return showBindEmailForm(pl);
        }

        if (inputCode !== storedCode) {
            pl.tell("§c验证码错误，请重新输入！");
            return showVerifyCodeForm(pl);
        }

        // 验证成功，绑定邮箱
        playerData.email = pendingEmail;
        delete playerData.verifyCode;
        delete playerData.verifyExpire;
        delete playerData.pendingEmail;
        savePlayerData(xuid, playerData);
        pl.tell("§a邮箱绑定成功！");
    });
}

// 第三步：如果已经绑定，询问是否修改（可选）
function showModifyEmailConfirm(player) {
    const form = mc.newSimpleForm();
    form.setTitle("邮箱管理");
    form.setContent("你已经绑定了邮箱，是否要修改？");
    form.addButton("§c修改邮箱");
    form.addButton("§a返回");
    player.sendForm(form, (pl, idx) => {
        if (idx === 0) {
            // 修改流程：先清除原邮箱，重新绑定
            const xuid = pl.xuid;
            let playerData = getPlayerData(xuid);
            playerData.email = null;
            savePlayerData(xuid, playerData);
            showBindEmailForm(pl);
        }
    });
}