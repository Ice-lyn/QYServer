import { config } from "../../../Config/config.js";
import * as func from "../../lib/func.js";
import axios from "axios";

const AIMemory = new JsonConfigFile("./plugins/QYServer/Data/AIMemory.json", '{"memory": []}');
const AIGiveItemMap = new Map();
const AIInteractCD = new Set();
const playerChatList = [];

// === 工具定义 ===
const tools = [
    {
        type: "function",
        function: {
            name: "query_data",
            description: "当用户询问服务器规则、实时数据、技术文档或需要检索特定知识时，调用此工具。",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "用户在对话中想要搜索的关键问题",
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "query_chat",
            description: "当需要检索当天历史聊天记录时，调用此工具。",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "搜索的关键词",
                    },
                },
                required: ["query"],
            }
        }
    }
];


mc.listen("onChat", async (player, msg) => {
    playerChatList.push(`[${(new Date()).toLocaleString('zh-CN', { hour12: false })}]${player.realName} >> ${msg}`);
    if (msg[0] !== "+"
        && ["ai", "服务", "妈", "操"].some(i => msg.includes(i))
    ) AIChat(msg, player);
});

mc.listen("onConsoleCmd", (cmd) => {
    if (!cmd.startsWith("aichat ")) return;
    AIChat(cmd.slice(7), null, true, true);
    return false;
});

mc.listen("onPlayerInteractEntity", (player, entity) => {
    if (!(entity?.type === "qys:riru"
        && !AIInteractCD.has(player.xuid)
        && AICanItem(player?.getHand()?.type)
    )) return;

    setTimeout(() => AIInteractCD.delete(player.xuid), 500);

    if (player.isSneaking) giveItemAI(player, player.getHand());
    else {
        ruaAI(player);
        func.enRuncmd(entity, "function function/pat");
        func.enRuncmd(entity, "execute anchored eyes run particle minecraft:heart_particle ~~0.5~");
    }
});

func.addOnmodeCmd("aichat", (player, cmd) => {
    // logger.warn(JSON.stringify(cmd, null, 4));
    switch (cmd[0]) {
        case "give":
            giveItemAI(player, player.getHand());
            break;
        case "rua":
            ruaAI(player);
            break;
    }
});

function ruaAI(player) {
    mc.broadcast(`${player.realName} rua了服务器娘一下~`);
    AIChat(`${player.realName} rua了你一下~`, "System", true);
    ll.imports("QQChatEx", "onSendChat")(`${player.realName} rua了服务器娘一下~`);
}

function giveItemAI(player, item) {
    if (item.isNull()) return player.tell("你没有拿起食物呢...");
    if (AIGiveItemMap.get(player.xuid) >= 10) return player.tell("唔...不想吃了...");
    if (!AICanItem(item.type)) return player.tell("谢谢啦 服务器娘似乎不想吃这个东西呢~");

    item.setNull();
    player.refreshItems();

    mc.broadcast(`${player.realName} 投喂服务器娘${item.count}个 ${item.name}(${item.type})`);
    AIChat(`${player.realName} 投喂你${item.count}个 ${item.name}(${item.type})，你可以使用give指令回礼，本次是否可以回礼：${func.probability(40)}`, "System", true);
    ll.imports("QQChatEx", "onSendChat")(`${player.realName} 投喂服务器娘${item.count}个 ${item.name}(${item.type})`);
    AIGiveItemMap.set(player.xuid, (AIGiveItemMap.get(player.xuid) || 0) + 1);
}

function AICanItem(type) {
    return (item.type.includes("cod") // 鱼
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
    )
}

async function AIChat(msg, name = "nullptr", systemMsg = false, debug = false) {
    if (systemMsg) msg = `[aichat-key-104960014]${name === null ? "" : `[${name}]`} ${msg}`;
    else msg = `[${(new Date()).toLocaleString('zh-CN', { hour12: false })}]${name} >> ${func.textToEmoji(msg, 1)}`;

    try {
        AIMemory.set("memory", [
            ...(AIMemory.get("memory") ?? []),
            { role: 'user', content: msg }
        ]);

        const messages = [
            { role: 'system', content: config.AIChat.system },
            ...AIMemory.get("memory")
        ];

        const maxToolRounds = 5;
        let finalAiMessage = null;
        const totalUsage = {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            prompt_cache_hit_tokens: 0,
            prompt_cache_miss_tokens: 0
        };
        const processLogs = [];  // 收集思考过程和工具调用记录

        for (let round = 0; round < maxToolRounds; round++) {
            let response = await axios.post(config.AIChat.url, {
                model: config.AIChat.name,
                max_tokens: config.AIChat.maxTokens,
                temperature: config.AIChat.temperature,
                stream: false,
                tools: tools,
                tool_choice: "auto",
                messages: messages,
                extra_body: {
                    thinking: {
                        type: "disabled"
                    }
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${config.AIChat.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            // 累计 token 消耗
            if (response.data.usage) {
                totalUsage.prompt_tokens += response.data.usage.prompt_tokens || 0;
                totalUsage.completion_tokens += response.data.usage.completion_tokens || 0;
                totalUsage.total_tokens += response.data.usage.total_tokens || 0;
                totalUsage.prompt_cache_hit_tokens += response.data.usage.prompt_cache_hit_tokens || 0;
                totalUsage.prompt_cache_miss_tokens += response.data.usage.prompt_cache_miss_tokens || 0;
            }

            let aiMessage = response.data.choices[0].message;

            if (debug) {
                try {
                    logger.warn(JSON.stringify(response.data.choices, (key, value) => {
                        if (key === 'request' || key === 'config' || key === 'headers') return undefined;
                        if (typeof value === 'bigint') return value.toString();
                        return value;
                    }, 4));
                } catch (e) { }
            }

            // 如果没有工具调用，本轮消息就是最终回答，退出循环
            if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
                finalAiMessage = aiMessage;
                break;
            }

            // 如果有 content 内容（部分模型会在工具调用前给自然语言思考），记录为思考过程
            if (aiMessage.content && aiMessage.content.trim() !== '') {
                processLogs.push({ type: 'assistant', content: aiMessage.content });
            }

            // 将 AI 的工具调用请求加入上下文
            messages.push(aiMessage);

            // 处理每一个工具调用
            for (const toolCall of aiMessage.tool_calls) {
                const funcName = toolCall.function.name;
                const funcArgs = JSON.parse(toolCall.function.arguments);
                let toolResult;

                if (funcName === "query_data") {
                    toolResult = AIQuery(funcArgs.query, config.AIChat.knowledgeBase, -1);
                }
                if (funcName === "query_chat") {
                    toolResult = AIQuery(funcArgs.query, playerChatList, 20);
                }

                // 记录工具调用日志
                processLogs.push({
                    type: 'tool',
                    toolName: funcName,
                    args: funcArgs,
                    result: toolResult
                });

                // 把工具返回结果加入上下文
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }
        }

        // 如果轮数耗尽仍未得到最终回答，开启深度思考总结之前的消息
        if (!finalAiMessage) {
            let response = await axios.post(config.AIChat.url, {
                model: config.AIChat.name,
                max_tokens: config.AIChat.maxTokens,
                temperature: config.AIChat.temperature,
                stream: false,
                tools: tools,
                tool_choice: "none",
                messages: messages,
                // reasoning_effort: "max",
                extra_body: {
                    thinking: {
                        type: "enabled"
                    }
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${config.AIChat.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (response.data.usage) {
                totalUsage.prompt_tokens += response.data.usage.prompt_tokens || 0;
                totalUsage.completion_tokens += response.data.usage.completion_tokens || 0;
                totalUsage.total_tokens += response.data.usage.total_tokens || 0;
                totalUsage.prompt_cache_hit_tokens += response.data.usage.prompt_cache_hit_tokens || 0;
                totalUsage.prompt_cache_miss_tokens += response.data.usage.prompt_cache_miss_tokens || 0;
            }

            finalAiMessage = response.data.choices[0].message;
        }

        const aiReply = finalAiMessage.content || '';
        const msgList = aiReply.replace(/\n\n/g, '\n').split("\n");

        // 保存 AI 回复到记忆
        AIMemory.set("memory", [
            ...(AIMemory.get("memory") ?? []),
            { role: 'assistant', content: aiReply }
        ]);

        // === 生成 Token 消耗日志 ===
        const tokenCost = ((totalUsage.completion_tokens || 0) / 1000000) * 2
            + ((totalUsage.prompt_cache_miss_tokens || 0) / 1000000) * 1
            + ((totalUsage.prompt_cache_hit_tokens || 0) / 1000000) * 0.2;
        const tokenLog = `📊 Token消耗 (预计: ${tokenCost.toFixed(6)} 元)\n`
            + `  ├─ 输入: ${totalUsage.prompt_tokens || 0}\n`
            + `  │  ├─ 命中: ${totalUsage.prompt_cache_hit_tokens || 0}\n`
            + `  │  └─ 未命中: ${totalUsage.prompt_cache_miss_tokens || 0}\n`
            + `  ├─ 输出: ${totalUsage.completion_tokens || 0}\n`
            + `  └─ 总计: ${totalUsage.total_tokens || 0}`;
        func.titleLog.info("AIToken", tokenLog);

        // 指令执行与广播
        if (aiReply.includes("falseChat") || aiReply === "") return func.titleLog.info("AIChat", "AIChat 认为不需要回答，发言已取消...");

        msgList.forEach(msg => {
            if (msg[0] !== "/") mc.runcmdEx(`say ${msg.replace(/[`^$&\\]/g, '')}`);
            else if (config.AIChat.cmdList.has(msg.split(" ")[0])) {
                if (debug) logger.warn(msg);
                else mc.runcmd(msg);
            }
        });

        func.titleLog.info("AIChat", aiReply);
    } catch (e) {
        if (e.response?.data?.error) func.titleLog.error("AIChat", "API错误:", e.response.data.error.message);
        else func.titleLog.error("AIChat", "请求失败:", e.message || e);
    }
}

// === 调用工具 === //

// 关键词匹配知识库
function AIQuery(query, data, maxResults = 10) {
    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const doc of data) {
        if (doc.toLowerCase().includes(lowerQuery)) {
            results.push(doc);
        }
    }

    func.titleLog.warn("AIQuery", `${query} -> ${JSON.stringify(results ?? ["未找到相关内容，请尝试缩短关键词并重新搜索"])}`);

    if (results.length === 0) return ["未找到相关内容，请尝试缩短关键词并重新搜索"];
    if (maxResults !== -1) return results.slice(0, maxResults);
    return results
}