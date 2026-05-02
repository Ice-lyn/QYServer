import { config } from "../../../Config/config.js";
import * as func from "../../lib/func.js";
import axios from "axios";

const AIMemory = new JsonConfigFile("./plugins/QYServer/Data/AIMemory.json", '{"memory": []}');
const AIGiveItemMap = new Map(); // AI投喂缓存

mc.listen("onChat", (player, msg) => {
    if (msg[0] !== "+"
        && ["ai", "服务", "妈", "操"].some(i => msg.includes(i))
    ) AIChat(msg, player);
})

mc.listen("onConsoleCmd", (cmd) => {
    if (!cmd.startsWith("aichat ")) return;
    AIChat(cmd.slice(7), null, true, true);
    return false;
})

func.addOnmodeCmd("aichat", (player, cmd) => {
    switch (cmd[0]) {
        case "give":
            giveItemAI(player, player.getHand());
            break;
        case "rum":
            ruaAI(player);
            break;
    }
})

function ruaAI(player) {
    mc.broadcast(`${player.realName} rua了服务器娘一下~`);
    AIChat(`${player.realName} rua了你一下~`, "System", true);
    ll.imports("QQChatEx", "onSendChat")(`${player.realName} rua了服务器娘一下~`);
}

function giveItemAI(player, item) {
    if (item.isNull()) return player.tell("你没有拿起食物呢...");
    if (AIGiveItemMap.get(player.xuid) >= 10) return player.tell("唔...不想吃了...");
    if (!(item.type.includes("cod") // 鱼
        || item.type.includes("salmon") // 鱼
        || item.type.includes("fish") // 鱼
        || item.type.includes("cooked") // 烤肉
        || item.type.includes("apple") // 苹果
        || item.type.includes("carrot") // 肉
        || item.type.includes("cake") // 蛋糕
        || item.type.includes("potato") // 土豆
        || item.type.includes("honey") // 蜂蜜
        || item.type.includes("mushroom") // 蘑菇
        || item.type.includes("melon") // 西瓜
        || item.type.includes("beetroot") // 天才跟
    )) return player.tell("谢谢啦 服务器娘似乎不想吃这个东西呢~");

    item.setNull();

    mc.broadcast(`${player.realName} 投喂服务器娘${item.count}个 ${item.name}(${item.type})`);
    AIChat(`${player.realName} 投喂你${item.count}个 ${item.name}(${item.type})，你可以使用give指令回礼，本次是否可以回礼：${func.probability(40)}`, "System", true);
    ll.imports("QQChatEx", "onSendChat")(`${player.realName} 投喂服务器娘${item.count}个 ${item.name}(${item.type})`);
    AIGiveItemMap.set(player.xuid, AIGiveItemMap.get(player.xuid) + 1);
}

async function AIChat(msg, name = "nullptr", systemMsg = false, debug = false) {
    if (systemMsg) msg = `${name === null ? "" : `[${name}]`} ${msg}`;
    else msg = `[${(new Date()).toLocaleString('zh-CN', { hour12: false })}]${name} >> ${func.textToEmoji(msg, 1)}`;

    try {
        AIMemory.set("memory", [
            ...(AIMemory.get("memory") ?? []),
            { role: 'user', content: msg }
        ]);

        msg = [
            { role: 'system', content: config.AIChat.system },
            ...AIMemory.get("memory")
        ];

        logger.warn(JSON.stringify(msg.slice(1), null, 4));

        const response = await axios.post(config.AIChat.url, {
            model: config.AIChat.name,
            max_tokens: config.AIChat.maxTokens,
            temperature: config.AIChat.temperature,
            stream: false,
            messages: msg,
            // extra_body: { thinking: { type: "disabled" } }
        }, {
            headers: {
                'Authorization': `Bearer ${config.AIChat.key}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const aiReply = response.data.choices[0].message.content;
        const msgList = aiReply.split("\n");
        
        AIMemory.set("memory", [
            ...(AIMemory.get("memory") ?? []),
            { role: 'assistant', content: aiReply }
        ]);
        
        if (debug) {
            logger.warn(JSON.stringify(response, (key, value) => {
                if (key === 'request' || key === 'config' || key === 'headers') return undefined;
                if (typeof value === 'bigint') return value.toString();
                return value;
            }, 4));
            
            if (aiReply.includes("falseChat") || aiReply === "") return func.titleLog.info("AIChat", "AIChat 认为不需要回答，发言已取消...");

            msgList.forEach(cmd => {
                if (config.AIChat.cmdList.has(cmd.split(" ")[0])) logger.warn("执行命令: " + cmd)
            });
            return;
        }

        if (aiReply.includes("falseChat") || aiReply === "") return func.titleLog.info("AIChat", "AIChat 认为不需要回答，发言已取消...");

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
