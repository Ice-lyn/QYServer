import { config } from "../../../Config/config.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport(config.Mail);

const key = 114514;
sendMail({
    from: '"月月呀" <xiaoyue0782@163.com>',
    to: "1669044502@qq.com",
    subject: "QYServer | 邮箱绑定验证",
    text: ([
        "亲爱的玩家：",
        "您好！",
        "感谢您选择我们的服务！为了确保您的账户安全，请查收本次绑定邮箱的验证码：",
        "",
        `验证码：${key}`,
        "有效期15分钟，请勿泄露给他人哦~",
        "",
        "如有任何疑问，欢迎随时联系我们。祝您使用愉快！",
        "QYServer 团队"
    ].join("\n")),
    html: ([
        "<div>亲爱的玩家：<br /></div>",
        "<div>您好！</div>",
        "<div>感谢您选择我们的服务！为了确保您的账户安全，请查收本次绑定邮箱的验证码：</div>",
        "<div><br /></div>",
        `<div><b>验证码：${key}</b></div>`,
        "<div>有效期15分钟，请勿泄露给他人哦~</div>",
        "<div><br /></div>",
        "<div>如有任何疑问，欢迎随时联系我们。祝您使用愉快！</div>",
        "<div>QYServer 团队</div>"
    ].join(""))
}, (res, isSend) => {
    logger.warn(JSON.stringify(res, (key, value) => {
        if (key === 'request' || key === 'config' || key === 'headers') return undefined;
        if (typeof value === 'bigint') return value.toString();
        return value;
    }, 4));
})



ll.onUnload(() => { transporter.close() });
async function sendMail(mailData, callback = (() => { })) {
    try {
        await transporter.verify();
        const info = await transporter.sendMail(mailData);
        callback(info, true);
    } catch (error) {
        callback(error, false);
    }
}