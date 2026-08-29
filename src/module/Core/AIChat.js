import config from "../../../Config/config.js";
import * as func from "../../lib/func.js";
import axios from "axios";

const AIMemory = new JsonConfigFile("./plugins/QYServer/Data/AIMemory.json", '{"memory": []}');
const isDebug = false;
let tools = {};

// === 触发 === //

const chatList = [];
mc.listen("onChat", async (player, msg) => {
    if (msg[0] !== "+"
        && ["ai", "兮兮", "服务", "妈", "操"].some(i => msg.includes(i))
    ) AIChat(msg, { name: player.realName });
    chatList.push(`[${(new Date()).toLocaleString('zh-CN', { hour12: false })}]${player.realName} >> ${msg}`);
    if (chatList.length > 100) chatList.shift();
});

mc.listen("onConsoleCmd", (cmd) => {
    if (!cmd.startsWith("aichat ")) return;
    AIChat(cmd.slice(7), { say: false });
    return false;
});

const AIGiveCD = new Set();
mc.listen("onPlayerInteractEntity", (player, entity) => {
    if (!(entity?.type === "qys:riru"
        && !AICallCD.has(player.xuid)
    )) return;

    AICallCD.add(player.xuid);
    setTimeout(() => AICallCD.delete(player.xuid), 1000);

    const item = player.getHand();
    if (player.isSneaking) {
        if (item.isNull()) return player.tell("你没有拿起食物呢...");
        if (AIGiveCD.has(player.xuid)) return player.tell("唔...吃不下了...");
        if (!item.type.some(type => config.AIChat.giveitem.includes(type)))
            return player.tell("谢谢啦 兮兮似乎不想吃这个东西呢~");

        item.setNull();
        player.refreshItems();

        mc.broadcast(`${player.realName} 投喂服务器娘${item.count}个 ${item.name}(${item.type})`);
        ll.imports("QQChatEx", "onSendChat")(`${player.realName} 投喂服务器娘${item.count}个 ${item.name}(${item.type})`);
        AIChat(
            `${player.realName} 投喂你${item.count}个 ${item.name}(${item.type})，你可以使用give指令回礼，本次是否可以回礼：${func.probability(40)}`,
            { name: "System", isSystem: true }
        );

        AIGiveCD.add(player.xuid);
        setTimeout(() => AIGiveCD.delete(player.xuid), 1000);

    } else {
        func.enRuncmd(entity, "function function/pat");
        func.enRuncmd(entity, "execute anchored eyes run particle minecraft:heart_particle ~~0.5~");
    }
});


// === AICalls === //

function AIChat(msg, status) {
    status = {
        name: status.name ?? "",
        say: status.noSay ?? true,
        isSystem: status.isSystem ?? false,
    }
    const timeStr = new Date().toLocaleString('zh-CN', { hour12: false });
    if (status.isSystem)
        msg = `[${status.name}][aichat-key-104960014] ${msg}`;
    else
        msg = `[${timeStr}]${status.name} >> ${func.textToEmoji(msg, 1)}`

    callAPI(msg, async (msg, res) => {
        // === Token Info === //
        const usage = res?.data?.usage;
        if (usage) {
            const {
                prompt_tokens,
                prompt_cache_hit_tokens,
                prompt_cache_miss_tokens,
                completion_tokens,
                total_tokens
            } = usage;

            // 一大坨的价格计算
            const money = (prompt_cache_hit_tokens / 1000000 * 0.1) // 命中
                + (prompt_cache_miss_tokens / 1000000 * 3) // 未命中
                + (completion_tokens / 1000000 * 9) // 输出
                + ((total_tokens - (completion_tokens
                    + prompt_cache_hit_tokens
                    + prompt_cache_miss_tokens
                ) / 1000000) * 3);

            func.titleLog.info("AIToken", `📊 Token消耗 (预计消耗 ${money} ¥)`
                + `\n  ├─ 输入: ${prompt_tokens}`
                + (prompt_cache_hit_tokens
                    ? `\n  │ ├─ 命中: ${prompt_cache_hit_tokens}`
                    : ""
                )
                + (prompt_cache_miss_tokens
                    ? `\n  │ └─ 未命中: ${prompt_cache_miss_tokens || 0}`
                    : ""
                )
                + `\n  ├─ 输出: ${completion_tokens}`
                + `\n  └─ 总计: ${total_tokens}`
                + `\n=================`
            );
        };

        // === Message === //
        if (msg.includes("[falseChat]")) return;
        const msgList = msg.replace(/\n\n/g, '\n').split("\n");
        for (let i = 0; i < msgList.length; i++) {
            const msg = msgList[i];
            if (!status.noSay) mc.runcmd(`say ${func.str2say(msg)}`);
            func.titleLog.info("AISend", msg);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    })
}

async function callAPI(data, callback = (() => { }), canAddMemory = true) {
    if (canAddMemory) addMemory('user', data);

    try {
        const sendData = {
            model: config.AIChat.name,
            max_tokens: config.AIChat.maxTokens,
            temperature: config.AIChat.temperature,
            stream: false,
            tools: tools.definition,
            tool_choice: 'auto',
            messages: [
                { role: 'system', content: config.AIChat.system },
                ...getMemory()
            ]
        };

        if (isDebug) logger.warn(JSON.stringify(sendData, null, 4));

        const response = await axios.post(config.AIChat.url, sendData, {
            headers: {
                'Authorization': `Bearer ${config.AIChat.key}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (isDebug) logger.warn(JSON.stringify(response, (key, value) => {
            if (key === 'request' || key === 'config' || key === 'headers') return undefined;
            if (typeof value === 'bigint') return value.toString();
            return value;
        }, 4));

        const message = response.data.choices[0].message;

        // 处理工具调用
        if (message.tool_calls && message.tool_calls.length > 0) {
            // 添加助手消息（包含工具调用）
            addMemory('assistant', message.content || '', message.tool_calls);

            // 执行所有工具调用
            const toolResults = [];

            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

                // 执行工具
                let toolResult;
                if (tools.calls[toolName]) {
                    try {
                        const argsArray = Object.values(toolArgs);
                        toolResult = await Promise.resolve(tools.calls[toolName](...argsArray));
                        toolResult = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
                    } catch (e) {
                        toolResult = `工具执行错误: ${e.message}`;
                        logger.error(`工具 ${toolName} 执行失败: ${e}`);
                    }
                } else {
                    toolResult = `未知工具: ${toolName}`;
                }

                toolResults.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            }

            // 添加工具结果到记忆
            toolResults.forEach(result => addMemory(result.role, result.content, null, result.tool_call_id));

            // 递归调用继续对话（不重复添加用户消息）
            if (message.content) callback(message.content, response);
            return callAPI(data, callback, false);
        }

        // 处理普通文本回复
        if (message.content) {
            addMemory('assistant', message.content);
            callback(message.content, response);
        }
    } catch (e) {
        logger.error('API 调用失败: ' + e);
        callback(`这道题有点难呢...我们等下再来学习吧!  ${e.message}`, null);
    }
}

// === memory === //

function addMemory(role, content, tool_calls = null, tool_call_id = null) {
    const memory = getMemory()
    const message = { role, content };

    if (tool_calls) message.tool_calls = tool_calls;
    if (tool_call_id) message.tool_call_id = tool_call_id;

    memory.push(message);
    AIMemory.set("memory", memory);
    return memory;
}

function getMemory() {
    return AIMemory.get("memory") ?? [];
}

// === 工具 === //
tools = ((tools) => {
    const result = { definition: [], calls: {} };
    for (const [name, tool] of Object.entries(tools)) {
        const def = JSON.parse(JSON.stringify(tool.definition));
        def.function.name = name;
        result.definition.push(def);
        result.calls[name] = tool.call;
    }
    return result;
})({
    "run_mc_command": {
        definition: {
            type: "function",
            function: {
                description: "运行MC指令",
                parameters: {
                    type: "object",
                    properties: {
                        command: {
                            type: "string",
                            description: "完整MC指令",
                        }
                    },
                    required: ["command"]
                }
            }
        },
        call: async (command) => {
            func.titleLog.info("AICommand", "Runcmd => " + command);
            if (!config.AIChat.cmdList.has(command.split(" ")[0]))
                return "指令不存在或没有执行权限";
            else
                return await JSON.stringify(mc.runcmdEx(command));
        }
    },

    "query_player_data": {
        definition: {
            type: "function",
            function: {
                description: "查询玩家的一些信息",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "完整玩家名称",
                        }
                    },
                    required: ["query"]
                }
            }
        },
        call: (query) => {
            const uuid = data.name2uuid(query);
            if (!uuid) return toolResult = ["无法查找玩家信息，请检查玩家名称是否正确或完整"];

            const playerNbt = mc.getPlayerNbt(uuid);

            const time = playerNbt
                ?.getTag("DynamicProperties")
                ?.getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
                ?.getData("usfV2:id") ?? 0;

            const diePos = new IntPos(
                playerNbt.getData("DeathDimension"),
                playerNbt.getData("DeathPositionX"),
                playerNbt.getData("DeathPositionY"),
                playerNbt.getData("DeathPositionZ"),
            );

            return [
                `玩家名称：${query}`,
                `加入时间：${new Date(time).toLocaleString('zh-CN', { hour12: false })}`,
                `货币：${mc.getPlayerScore(uuid, "金币")}金币, ${mc.getPlayerScore(uuid, "蜡烛")}蜡烛`,
                `击杀数：${mc.getPlayerScore(uuid, "击杀数")}`,
                `在线时间：${mc.getPlayerScore(uuid, "time")} 分钟`,
                `死亡地点: ${diePos}`
            ]
        }
    },

    "query_web_info": {
        definition: {
            type: "function",
            function: {
                description: "联网查询信息，非必要情况下不要使用！他返回很慢",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "关键词或信息",
                        }
                    },
                    required: ["query"]
                }
            }
        },
        call: async (query) => {
            const res = await axios.post(config.AIChat.web_url, {
                query: query,
                fetch_full: false,
                sort: "relevance"
            }, {
                headers: {
                    'Authorization': `Bearer ${config.AIChat.web_key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return res.data.results?.map(data => JSON.stringify({
                title: data.title,
                snippet: data.snippet,
                position: data.position,
                score: data.score,
                publish_time: data.publish_time
            })) ?? [];
        }
    },

    "query_updata": {
        definition: {
            type: "function",
            function: {
                description: "可以调用此工具查询更新日志",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "要搜索的关键词;返回 all 获取所有;可使用空格分隔多个关键词",
                        }
                    },
                    required: ["query"]
                }
            }
        },
        call: async (query) => {
            const data = await axios.get("https://www.qyserver.top/Configs/updata.json");
            return AIQuery(query, data.data.map(i => JSON.stringify(i)), -1);
        }
    },

    "query_chat": {
        definition: {
            type: "function",
            function: {
                description: "当需要当天聊天记录时调用；以最新一条信息为起点，输入1-100的正整数",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "number",
                            description: "查询的条数",
                        },
                    },
                    required: ["query"],
                }
            }
        },
        call: (query) => chatList.slice(-query)
    },

    "query_chat_data": {
        definition: {
            type: "function",
            function: {
                description: "当需要检索当天聊天记录中包含关键词的记录时，调用此工具",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "要搜索的关键词;返回 all 获取所有;可使用空格分隔多个关键词",
                        },
                    },
                    required: ["query"],
                }
            }
        },
        call: (query) => AIQuery(query, chatList, -1)
    },

    // 知识库
    "query_knowledge_data": {
        definition: {
            type: "function",
            function: {
                description: "当用户询问特定知识时，调用此工具查询相关信息，确保关键词简洁，如空返回可再次调用",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "要搜索的关键词;输入 all 获取所有;可使用空格分隔多个关键词",
                        }
                    },
                    required: ["query"]
                }
            }
        },
        call: async (query) => {
            const keywords = query.trim().toLowerCase().split(/\s+/);
            if (keywords[0] === "all" && keywords.length === 1) return config.AIChat.knowledgeBase;
            if (keywords.length === 1 && keywords[0] === "") return ["请输入有效的搜索关键词"];

            // 使用 Set 去重 + 过滤 + 排序
            const results = config.AIChat.knowledgeBase
                .filter(doc => keywords.some(kw => doc.toLowerCase().includes(kw)))
                .sort((a, b) => {
                    // 按匹配关键词数量排序（包含更多关键词的排前面）
                    const aScore = keywords.filter(kw => a.toLowerCase().includes(kw)).length;
                    const bScore = keywords.filter(kw => b.toLowerCase().includes(kw)).length;
                    return bScore - aScore;
                });

            return results.length === 0 ? [] : results;
        }
    }
})

// 关键词匹配知识库
function AIQuery(query, data, maxResults = 10) {
    const keywords = query.trim().toLowerCase().split(/\s+/);
    if (keywords[0] === "all" && keywords.length === 1) return data;
    if (keywords.length === 1 && keywords[0] === "") return ["请输入有效的搜索关键词"];

    // 使用 Set 去重 + 过滤 + 排序
    const results = data
        .filter(doc => keywords.some(kw => doc.toLowerCase().includes(kw)))
        .sort((a, b) => {
            // 按匹配关键词数量排序（包含更多关键词的排前面）
            const aScore = keywords.filter(kw => a.toLowerCase().includes(kw)).length;
            const bScore = keywords.filter(kw => b.toLowerCase().includes(kw)).length;
            return bScore - aScore;
        });

    if (results.length === 0) return [];
    return maxResults === -1 ? results : results.slice(0, maxResults);
}
