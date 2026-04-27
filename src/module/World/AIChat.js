import { config } from "../../../Config/config.js";
import * as func from "../../lib/func.js";
import axios from "axios";

mc.listen("onChat", (player, msg) => {
    if (msg[0] !== "+"
        && ["ai", "服务", "妈", "操"].some(i => msg.includes(i))
    ) aiChatServer(msg, player);
})

mc.listen("onConsoleCmd", (cmd) => {
    if (!cmd.startsWith("aichat ")) return;
    AIChat(cmd, "Debug", true);
    return false;
})

async function AIChat(msg, name = "nullptr", debug = false) {
    try {
        msg = [
            { role: 'system', content: config.AIChat.system },
            { role: 'user', content: `[${(new Date()).toLocaleString('zh-CN', { hour12: false })}]${name} >> ${func.textToEmoji(msg, 1)}` }
        ];

        const response = await axios.post(config.AIChat.url, {
            model: config.AIChat.name,
            max_tokens: config.AIChat.maxTokens,
            temperature: config.AIChat.temperature,
            stream: false,
            messages: msg
        }, {
            headers: {
                'Authorization': `Bearer ${config.AIChat.key}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const aiReply = response.data.choices[0].message.content;

        if (debug) return logger.warn(JSON.stringify(response, (key, value) => {
            if (key === 'request' || key === 'config' || key === 'headers') return undefined;
            if (typeof value === 'bigint') return value.toString();
            return value;
        }, 4));

        const msgList = aiReply.split("\n");
        if (aiReply.includes("falseChat")) return func.titleLog.info("AIChat", "AIChat 认为不需要回答，发言已取消...");

        msgList.forEach(cmd => {
            if (config.AIChat.cmdList.has(cmd.split(" ")[0])) mc.runcmdEx(cmd)
        });

        mc.runcmd(`say ${msgList[0].replace(/[`^$&\\]/g, '')}`);
        func.titleLog.info("AIChat", aiReply);
    } catch (e) {
        if (e.response?.data?.error) func.titleLog.error("AIChat", "API错误:", e.response.data.error.message);
        else func.titleLog.error("AIChat", "请求失败:", e.message || e);
        // func.titleLog.error("AIChat", "接口请求时发生错误\n" + e);
    }
}
