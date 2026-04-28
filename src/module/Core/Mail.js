import { config } from "../../../Config/config.js";
import { Inbox, Outbox } from "@papack/email";

// --- 1. 发送邮件 ---
async function test() {
    const outbox = new Outbox({
        from: "兮兮呀 <xiaoyue0782@163.com>",
        host: "smtp.163.com",
        port: 465,
        secure: true,
        user: "xiaoyue0782@163.com",
        pass: "*************",
        onError: async (error) => console.error("发信错误:", error)
    });

    await outbox.connect();
    await outbox.send({
        to: ["1669044502@qq.com"],
        subject: "来自轻量库的问候",
        content: "<p>这是一封测试邮件。</p>"
    });
    await outbox.disconnect();
    console.log("邮件发送成功！");
}
test()


// --- 2. 接收邮件 ---
/*
const inbox = new Inbox({
    host: "你的IMAP服务器", // 例如 imap.qq.com
    port: 993,
    secure: true,
    user: "receiver@example.com",
    pass: "你的密码或授权码",
    onError: async (error) => console.error("收信错误:", error)
});

await inbox.connect();
const status = await inbox.status();          // 查看油箱状态
console.log(`未读邮件数: ${status.unread}`);

const mail = await inbox.recv();              // 获取最旧的一封未读邮件
if (mail) {
    console.log(`主题: ${mail.subject}`);
    console.log(`正文: ${mail.body.text}`);
    await inbox.read(mail.id);                // 标记为已读
}
await inbox.disconnect();

*/
