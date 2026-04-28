import { config } from "../../../Config/config.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: config.Mail.host,
    port: config.Mail.port,
    secure: config.Mail.secure,
    auth: {
        user: config.Mail.auth.user,
        pass: config.Mail.auth.pass
    }
});

sendMail({
    from: '"月月呀" <xiaoyue0782@163.com>',
    to: "1669044502@qq.com",
    subject: "测试邮件",
    text: "这是一封测试邮件",
    html: "<p>这是一封测试邮件abc</p>"
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