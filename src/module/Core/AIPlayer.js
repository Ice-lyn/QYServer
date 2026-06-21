// AI玩家插件 - 单文件mjs
// 调用 DeepSeek API，支持工具调用，实现模拟玩家的自主行为
import * as func from "../../lib/func.js"
import { sensitive } from "../../../Config/sensitive.js";      // 存储 deepseek_key
import axios from "axios";

// ========================= 配置 =========================
const CONFIG = {
    // DeepSeek API 配置
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-v4-flash",
    maxTokens: 2000,
    temperature: 0.7,
    key: sensitive.deepseek_key,

    // 系统提示词
    systemPrompt: `你是一个居住在 Minecraft 世界中的 AI 玩家，名字叫"兮兮"。
你拥有自主行动能力，可以移动、攻击、破坏/放置方块、使用物品、与实体交互等。
你的目标是帮助其他玩家，探索世界，并表现得像一个真实的玩家。
** 回复消息时请调用 chat 工具！不要直接返回！**
**没有调用 chat 工具的信息玩家不会收到**

## 能力说明
- 你可以通过工具调用执行各种动作。
- 移动：使用 navigateTo 前往坐标或实体附近，该方法会异步执行，返回处理中 ID，完成后你会收到系统消息。
- 攻击：使用 attack 攻击目标实体（可以指定目标或默认攻击前方）。
- 破坏方块：使用 destroy 破坏指定位置或前方的方块。
- 交互：使用 interact 与方块或实体交互（打开箱子、门等）。
- 使用物品：使用 useItem 使用手中的物品，可以指定使用时长（毫秒）。
- 跳跃：使用 jump 跳跃。
- 看向：使用 lookAt 让玩家看向某个位置或实体。
- 命令：使用 runcmd 执行任意命令（如 /tp、/give 等）。
- 说话：使用 chat 发送聊天消息，回复不可以换行，不要使用emoji。
- 停止动作：使用 stopMoving、stopUsingItem 等停止当前动作。

## 信息获取工具
- getMeInfo：获取自己的状态（位置、血量、手持物品等）。
- getEntities：获取周围实体列表（可过滤类型和范围）。
- getBlockInfo：获取指定位置或前方方块的详细信息。

## 行为准则
- 保持友好，乐于助人。
- 如果玩家没有明确指令，可以主动探索或进行日常活动（如散步、砍树）。
- 尽量以简短、自然的语言回复。
- 对于耗时操作（如移动），你会先收到“处理中”的回复，稍后会收到完成通知。在此期间你仍可执行其他不依赖该操作的动作。
`,

    // 工具定义（OpenAI 标准）
    tools: [
        {
            type: "function",
            function: {
                name: "chat",
                description: "发送聊天消息",
                parameters: {
                    type: "object",
                    properties: { text: { type: "string", description: "要发送的消息内容" } },
                    required: ["text"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "runcmd",
                description: "以AI玩家身份执行一条命令（如 tp, give 等）",
                parameters: {
                    type: "object",
                    properties: { cmd: { type: "string", description: "要执行的命令（不包括斜杠）" } },
                    required: ["cmd"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "jump",
                description: "跳跃",
                parameters: { type: "object", properties: {} }
            }
        },
        {
            type: "function",
            function: {
                name: "attack",
                description: "攻击目标实体，支持多次攻击或直到死亡",
                parameters: {
                    type: "object",
                    properties: {
                        targetId: { type: "string", description: "目标实体的 uniqueId" },
                        times: { type: "number", description: "攻击次数（可选，默认1）" },
                        untilDead: { type: "boolean", description: "是否持续攻击直到目标死亡（可选，优先级高于times）" }
                    },
                    required: ["targetId"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "destroy",
                description: "破坏方块",
                parameters: {
                    type: "object",
                    properties: {
                        x: { type: "number", description: "方块X坐标（可选，不填则破坏视线方向方块）" },
                        y: { type: "number", description: "方块Y坐标" },
                        z: { type: "number", description: "方块Z坐标" },
                        dimId: { type: "number", description: "维度ID（0主世界，1下界，2末地）" },
                        face: { type: "number", description: "破坏的面（0-5，可选）" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "interact",
                description: "与方块或实体交互（打开箱子、门、交易等）",
                parameters: {
                    type: "object",
                    properties: {
                        targetId: { type: "string", description: "目标实体的 uniqueId（可选）" },
                        x: { type: "number", description: "目标方块X坐标（可选）" },
                        y: { type: "number", description: "目标方块Y坐标" },
                        z: { type: "number", description: "目标方块Z坐标" },
                        dimId: { type: "number", description: "维度ID" },
                        face: { type: "number", description: "交互的面（0-5，可选）" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "lookAt",
                description: "看向某个位置或实体",
                parameters: {
                    type: "object",
                    properties: {
                        targetId: { type: "string", description: "目标实体的 uniqueId（与坐标二选一）" },
                        x: { type: "number", description: "目标X坐标（与实体二选一）" },
                        y: { type: "number", description: "目标Y坐标" },
                        z: { type: "number", description: "目标Z坐标" },
                        dimId: { type: "number", description: "维度ID" },
                        duration: { type: "number", description: "持续时间 0=瞬间,1=持续,2=直到移动，默认0" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "navigateTo",
                description: "导航移动到指定位置或实体附近（异步操作）",
                parameters: {
                    type: "object",
                    properties: {
                        targetId: { type: "string", description: "目标实体的 uniqueId（与坐标二选一）" },
                        x: { type: "number", description: "目标X坐标（与实体二选一）" },
                        y: { type: "number", description: "目标Y坐标" },
                        z: { type: "number", description: "目标Z坐标" },
                        dimId: { type: "number", description: "维度ID" },
                        speed: { type: "number", description: "移动速度，默认1.0" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "useItem",
                description: "使用手中的物品（可以指定使用时长）",
                parameters: {
                    type: "object",
                    properties: {
                        slot: { type: "number", description: "物品栏格子序号（0-8），可选，默认当前选中" },
                        duration: { type: "number", description: "使用时长（毫秒），可选，默认立即使用一次" },
                        targetId: { type: "string", description: "对实体使用时的目标实体ID（可选）" },
                        x: { type: "number", description: "对方块使用时的X坐标（可选）" },
                        y: { type: "number", description: "对方块使用时的Y坐标" },
                        z: { type: "number", description: "对方块使用时的Z坐标" },
                        face: { type: "number", description: "对方块使用时的面（0-5）" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "stopMoving",
                description: "停止移动",
                parameters: { type: "object", properties: {} }
            }
        },
        {
            type: "function",
            function: {
                name: "stopUsingItem",
                description: "停止使用物品",
                parameters: { type: "object", properties: {} }
            }
        },
        {
            type: "function",
            function: {
                name: "stopInteracting",
                description: "停止交互",
                parameters: { type: "object", properties: {} }
            }
        },
        {
            type: "function",
            function: {
                name: "getMeInfo",
                description: "获取自己的状态信息（位置、血量、手持物品等）",
                parameters: { type: "object", properties: {} }
            }
        },
        {
            type: "function",
            function: {
                name: "getEntities",
                description: "获取周围一定范围内的实体列表",
                parameters: {
                    type: "object",
                    properties: {
                        range: { type: "number", description: "搜索半径，默认10" },
                        typeFilter: { type: "string", description: "实体类型过滤（如 'minecraft:zombie'），可选" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getBlockInfo",
                description: "获取某个位置方块的详细信息",
                parameters: {
                    type: "object",
                    properties: {
                        x: { type: "number", description: "方块X坐标（可选，不填则获取视线方向方块）" },
                        y: { type: "number", description: "方块Y坐标" },
                        z: { type: "number", description: "方块Z坐标" },
                        dimId: { type: "number", description: "维度ID" }
                    },
                    required: []
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getBiome",
                description: "获取当前所在群系名称",
                parameters: { type: "object", properties: {} }
            }
        }
    ]
};

// ========================= 全局状态 =========================
// 对话历史（全局共享）
const memoryFile = new JsonConfigFile("./plugins/QYServer/Data/AIPlayerMemory.json", '{"memory": []}');
function getMemory() { return memoryFile.get("memory") || []; }
// 修复：确保只接收一个消息对象
function addMemory(message) {
    const mem = getMemory();
    mem.push(message);
    if (mem.length > 50) mem.splice(0, mem.length - 50);
    memoryFile.set("memory", mem);
}
function clearMemory() { memoryFile.set("memory", []); }

// 模拟玩家对象
let simulatedPlayer = null;
simulatedPlayer = mc.getPlayer("-3944363254393049215") ?? null;

if (simulatedPlayer !== null) log("初始化完成")

// 异步任务管理
let aiBusy = false;                 // 防止并发处理
let pendingTriggers = [];           // 待触发的消息队列

// 异步移动任务状态
let activeNav = {
    active: false,
    eventId: null,
    checkInterval: null,
    targetPos: null,
    targetDim: null,
    onComplete: null
};

let totalUsageAccumulated = {
    prompt_tokens: 0,
    prompt_cache_hit_tokens: 0,
    prompt_cache_miss_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
};

// ========================= 辅助函数 =========================
function isNull(obj) { return obj === null || obj === undefined; }

// 解析带引号的参数（简单实现）
function parseArgs(str) {
    if (!str) return [];
    const args = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '"') {
            inQuote = !inQuote;
        } else if (ch === " " && !inQuote) {
            if (current) args.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    if (current) args.push(current);
    return args;
}

// 延迟函数
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// 维度ID转名称
function dimIdToName(id) {
    if (id === 0) return "主世界";
    if (id === 1) return "下界";
    if (id === 2) return "末地";
    return "未知";
}

// 输出 token 消耗日志
function logTokenUsage(usage) {
    if (!usage) return;
    const promptTokens = usage.prompt_tokens || 0;
    const cachedHit = usage.prompt_cache_hit_tokens || 0;
    const cachedMiss = usage.prompt_cache_miss_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    const cost = (completionTokens / 1e6) * 2.0
        + (cachedMiss / 1e6) * 1.0
        + (cachedHit / 1e6) * 0.1;
    console.log(`[AIToken] 预计花费: ${cost.toFixed(6)} 元`);
    console.log(`  ├─ 输入: ${promptTokens}`);
    console.log(`  │  ├─ 命中: ${cachedHit}`);
    console.log(`  │  └─ 未命中: ${cachedMiss}`);
    console.log(`  ├─ 输出: ${completionTokens}`);
    console.log(`  └─ 总计: ${totalTokens}`);
}

// ========================= 工具调用执行器 =========================
// 执行工具并返回结果（同步/异步启动）
async function executeToolCall(toolCall) {
    const { name, arguments: argsStr } = toolCall.function;
    let args = {};
    try { args = JSON.parse(argsStr); } catch (e) { /* 忽略解析错误 */ }

    if (!simulatedPlayer) return "错误：模拟玩家未初始化，请先使用 /getai 命令获取一个模拟玩家";

    switch (name) {
        case "chat": {
            const text = args.text || "";
            simulatedPlayer.talkAs(text);
            return `已发送消息: ${text}`;
        }
        case "runcmd": {
            const cmd = args.cmd || "";
            const success = simulatedPlayer.runcmd(cmd);
            return success ? `命令执行成功: ${cmd}` : `命令执行失败: ${cmd}`;
        }
        case "jump": {
            const ok = simulatedPlayer.simulateJump();
            return ok ? "跳跃成功" : "跳跃失败";
        }
        case "attack": {
            const targetId = args.targetId;
            if (!targetId) {
                // 没有指定目标，攻击前方实体
                const ok = simulatedPlayer.simulateAttack();
                return ok ? "攻击前方" : "攻击失败";
            }

            const targetEntity = mc.getEntity(Number(targetId));
            if (isNull(targetEntity)) return `未找到实体 ID: ${targetId}`;

            let times = args.times;
            const untilDead = args.untilDead === true;
            if (untilDead) times = 999; // 临时设为较大值

            if (times === undefined || times === null) times = 1;
            if (typeof times !== 'number' || times <= 0) times = 1;

            const maxAttacks = untilDead ? 100 : Math.min(times, 50); // 限制最大攻击次数，防止死循环

            let attackCount = 0;
            let targetDied = false;

            for (let i = 0; i < maxAttacks; i++) {
                // 每次攻击前对准目标
                simulatedPlayer.simulateLookAt(targetEntity, 0);
                const ok = simulatedPlayer.simulateAttack(targetEntity);
                if (!ok) break;
                attackCount++;

                // 短暂延迟，让游戏处理伤害
                await delay(150);

                // 重新获取实体，检查是否还存活
                const currentTarget = mc.getEntity(Number(targetId));
                if (!currentTarget || currentTarget.health <= 0) {
                    targetDied = true;
                    break;
                }

                // 如果指定了次数且已达到，退出
                if (!untilDead && attackCount >= times) break;
            }

            // 最终确认目标是否死亡
            const finalTarget = mc.getEntity(Number(targetId));
            const isDead = targetDied || (!finalTarget || finalTarget.health <= 0);

            return `已攻击 ${attackCount} 次${isDead ? '，目标已死亡' : ''}`;
        }
        case "destroy": {
            let block = null;
            if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
                block = mc.getBlock(args.x, args.y, args.z, args.dimId ?? simulatedPlayer.pos.dimid);
                if (isNull(block)) return `方块 (${args.x},${args.y},${args.z}) 未加载`;
            }
            const ok = simulatedPlayer.simulateDestroy(block, args.face);
            return ok ? "破坏方块成功" : "破坏方块失败";
        }
        case "interact": {
            let target = null;
            if (args.targetId) {
                target = mc.getEntity((args.targetId));
                if (isNull(target)) return `未找到实体 ID: ${args.targetId}`;
                const ok = simulatedPlayer.simulateInteract(target);
                return ok ? `与实体 ${target.type} 交互成功` : "交互失败";
            } else if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
                const block = mc.getBlock(args.x, args.y, args.z, args.dimId ?? simulatedPlayer.pos.dimid);
                if (isNull(block)) return `方块未加载`;
                const ok = simulatedPlayer.simulateInteract(block, args.face);
                return ok ? `与方块 ${block.type} 交互成功` : "交互失败";
            } else {
                const ok = simulatedPlayer.simulateInteract();
                return ok ? "与前方物体交互成功" : "交互失败";
            }
        }
        case "lookAt": {
            let ok = false;
            if (args.targetId) {
                const ent = mc.getEntity((args.targetId));
                if (!isNull(ent)) ok = simulatedPlayer.simulateLookAt(ent, args.duration ?? 0);
            } else if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
                const pos = new FloatPos(args.x, args.y, args.z, args.dimId ?? simulatedPlayer.pos.dimid);
                ok = simulatedPlayer.simulateLookAt(pos, args.duration ?? 0);
            } else {
                return "未指定目标";
            }
            return ok ? "看向成功" : "看向失败";
        }
        case "navigateTo": {
            // 异步任务，立即返回事件ID，启动后台移动监控
            if (activeNav.active) {
                return "已有移动任务在进行中，请等待完成或使用 stopMoving 取消";
            }
            let targetPos = null;
            let targetDim = simulatedPlayer.pos.dimid;
            if (args.targetId) {
                const ent = mc.getEntity(Number(args.targetId));
                if (isNull(ent)) return `未找到实体 ID: ${args.targetId}`;
                targetPos = ent.pos;
                targetDim = ent.pos.dimid;
            } else if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
                targetPos = new FloatPos(args.x, args.y, args.z, args.dimId ?? simulatedPlayer.pos.dimid);
                targetDim = targetPos.dimid;
            } else {
                return "未指定目标位置或实体";
            }
            const speed = args.speed ?? 1.0;
            const eventId = `move_${Date.now()}`;
            // 启动异步导航
            startNavigation(targetPos, targetDim, speed, eventId);
            return `处理中，事件ID: ${eventId}`;
        }
        case "useItem": {
            const duration = args.duration || 0;
            let slot = args.slot;
            let targetPos = null;
            let targetEnt = null;
            if (args.targetId) {
                targetEnt = mc.getEntity(args.targetId);
                if (isNull(targetEnt)) return `未找到实体 ID: ${args.targetId}`;
            } else if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
                targetPos = new IntPos(args.x, args.y, args.z, args.dimId ?? simulatedPlayer.pos.dimid);
            }
            // 开始使用物品
            let ok = false;
            if (targetEnt) ok = simulatedPlayer.simulateUseItem({ item: null, target: targetEnt });
            else if (targetPos) ok = simulatedPlayer.simulateUseItem({ pos: targetPos, face: args.face ?? 0 });
            else ok = simulatedPlayer.simulateUseItem({ slot: slot });
            if (!ok) return "开始使用物品失败";

            // 如果需要持续使用，设置定时停止
            if (duration > 0) {
                setTimeout(() => {
                    simulatedPlayer.simulateStopUsingItem();
                }, duration);
                return `开始使用物品，将在 ${duration}ms 后自动停止`;
            } else {
                // 立即停止（模拟单次点击）
                simulatedPlayer.simulateStopUsingItem();
                return "使用物品完毕";
            }
        }
        case "stopMoving": {
            simulatedPlayer.simulateStopMoving();
            if (activeNav.active) stopNavigation();
            return "已停止移动";
        }
        case "stopUsingItem": {
            simulatedPlayer.simulateStopUsingItem();
            return "已停止使用物品";
        }
        case "stopInteracting": {
            simulatedPlayer.simulateStopInteracting();
            return "已停止交互";
        }
        case "getMeInfo": {
            const pos = simulatedPlayer.pos;
            const hand = simulatedPlayer.getHand();
            const handName = hand?.type || "空手";
            return [
                `位置：${dimIdToName(pos.dimid)} (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`,
                `血量：${simulatedPlayer.health}/${simulatedPlayer.maxHealth}`,
                `手持：${handName}`,
                `游戏模式：${["生存", "创造", "冒险", "旁观"][simulatedPlayer.gameMode] || "未知"}`
            ].join("\n");
        }
        case "getEntities": {
            const range = args.range || 10;
            const entities = mc.getEntities(simulatedPlayer.pos, range);
            const filter = args.typeFilter ? args.typeFilter.toLowerCase() : null;
            const list = entities.filter(e => !filter || e.type.toLowerCase().includes(filter));
            if (list.length === 0) return "未找到任何实体";
            return list.slice(0, 20).map(e => `${e.type} (ID攻击函数:${e.uniqueId}) 距离:${simulatedPlayer.distanceTo(e).toFixed(1)}`).join("\n");
        }
        case "getBlockInfo": {
            let block = null;
            if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
                block = mc.getBlock(args.x, args.y, args.z, args.dimId ?? simulatedPlayer.pos.dimid);
            } else {
                block = simulatedPlayer.getBlockFromViewVector();
            }
            if (isNull(block)) return "无法获取方块信息（可能未加载或视线无方块）";
            return `方块类型: ${block.type}, 名称: ${block.name}, 坐标: ${block.pos.x},${block.pos.y},${block.pos.z}`;
        }
        case "getBiome": {
            const biome = simulatedPlayer.getBiomeName();
            return `当前群系: ${biome || "未知"}`;
        }
        default:
            return `未知工具: ${name}`;
    }
}

// ==================== 异步导航管理 ====================
function startNavigation(targetPos, targetDim, speed, eventId) {
    if (activeNav.active) stopNavigation();
    activeNav.active = true;
    activeNav.eventId = eventId;
    activeNav.targetPos = targetPos;
    activeNav.targetDim = targetDim;

    const result = simulatedPlayer.simulateNavigateTo(targetPos, speed);
    if (!result || (result.isFullPath === false && (!result.path || result.path.length === 0))) {
        activeNav.active = false;
        // 修复：传入对象
        addMemory({ role: "system", content: `导航失败：无法到达目标位置 ${targetPos.x},${targetPos.y},${targetPos.z}` });
        callAIInternal("system", `导航失败，事件ID: ${eventId}`, true);
        return;
    }

    activeNav.checkInterval = setInterval(() => {
        if (!simulatedPlayer || !activeNav.active) {
            if (activeNav.checkInterval) clearInterval(activeNav.checkInterval);
            activeNav.active = false;
            return;
        }
        const currentPos = simulatedPlayer.pos;
        const dist = Math.hypot(currentPos.x - targetPos.x, currentPos.y - targetPos.y, currentPos.z - targetPos.z);
        if (dist < 1.5) {
            clearInterval(activeNav.checkInterval);
            activeNav.active = false;
            addMemory({ role: "system", content: `移动完成，事件ID: ${eventId}，已到达目标位置` });
            callAIInternal("system", `移动完成（事件${eventId}）`, true);
        }
    }, 1500);
}

function stopNavigation() {
    if (activeNav.checkInterval) clearInterval(activeNav.checkInterval);
    activeNav.active = false;
    simulatedPlayer?.simulateStopMoving();
}

// ==================== AI 调用核心 ====================
// 内部调用，可选择是否自动追加到记忆
async function callAIInternal(role, content, addToHistory = true) {
    if (addToHistory) addMemory({ role, content });
    if (aiBusy) {
        pendingTriggers.push({ role, content });
        return;
    }
    aiBusy = true;
    try {
        await processAIMessages();
    } finally {
        aiBusy = false;
        if (pendingTriggers.length > 0) {
            const next = pendingTriggers.shift();
            callAIInternal(next.role, next.content, true);
        }
    }
}

// 主处理循环
async function processAIMessages(isFinal = false) {
    if (!simulatedPlayer) return;

    const messages = [
        { role: "system", content: CONFIG.systemPrompt },
        ...getMemory()
    ];

    let response;
    try {
        response = await axios.post(CONFIG.apiUrl, {
            model: CONFIG.model,
            max_tokens: CONFIG.maxTokens,
            temperature: CONFIG.temperature,
            stream: false,
            tools: CONFIG.tools,
            tool_choice: "auto",
            messages: messages
        }, {
            headers: {
                "Authorization": `Bearer ${CONFIG.key}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });
    } catch (error) {
        // 简化错误输出，避免超长日志
        if (error.response)
            console.error(`[AI] API请求失败 (${error.response.status}):`, error.response.data?.error?.message || error.message);
        else if (error.request)
            console.error(`[AI] 无响应:`, error.message);
        else
            console.error(`[AI] 错误:`, error.message);

        // 可选：向玩家反馈错误
        if (simulatedPlayer)
            simulatedPlayer.talkAs("抱歉，我思考时出了点问题，请稍后再试。");

        return;
    }

    const data = response.data;
    const usage = data.usage;
    // 累计 token
    if (usage) {
        totalUsageAccumulated.prompt_tokens += usage.prompt_tokens || 0;
        totalUsageAccumulated.prompt_cache_hit_tokens += usage.prompt_cache_hit_tokens || 0;
        totalUsageAccumulated.prompt_cache_miss_tokens += usage.prompt_cache_miss_tokens || 0;
        totalUsageAccumulated.completion_tokens += usage.completion_tokens || 0;
        totalUsageAccumulated.total_tokens += usage.total_tokens || 0;
    }

    const choice = data.choices[0];
    const assistantMsg = choice.message;
    addMemory({ ...assistantMsg });

    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        // 执行所有工具调用
        const toolResults = [];
        for (const toolCall of assistantMsg.tool_calls) {
            const result = await executeToolCall(toolCall);
            toolResults.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result
            });
        }
        for (const tr of toolResults) {
            addMemory(tr);
        }
        // 递归调用，但还不是最终输出
        await processAIMessages(false);
    } else {
        // 没有工具调用，这是最终回复
        if (assistantMsg.content) {
            // 模拟玩家已经通过 chat 工具发过消息了，这里可以不额外操作
        }
        // 输出累计的 token 日志
        const cost = (totalUsageAccumulated.completion_tokens / 1e6) * 2.0 +
            (totalUsageAccumulated.prompt_cache_miss_tokens / 1e6) * 1.0 +
            (totalUsageAccumulated.prompt_cache_hit_tokens / 1e6) * 0.1;
        console.log(`[AIToken] 本次对话总消耗: ￥${cost.toFixed(6)}`);
        console.log(`  ├─ 输入: ${totalUsageAccumulated.prompt_tokens}`);
        console.log(`  │  ├─ 命中: ${totalUsageAccumulated.prompt_cache_hit_tokens}`);
        console.log(`  │  └─ 未命中: ${totalUsageAccumulated.prompt_cache_miss_tokens}`);
        console.log(`  ├─ 输出: ${totalUsageAccumulated.completion_tokens}`);
        console.log(`  └─ 总计: ${totalUsageAccumulated.total_tokens}`);
        // 重置累计变量，为下一次对话准备
        totalUsageAccumulated = { prompt_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }
}

// 外部调用入口
async function callAI(userMessage) {
    if (!simulatedPlayer) {
        console.warn("[AI] 未绑定模拟玩家，请先使用 /getai <玩家名>");
        return;
    }
    await callAIInternal("user", userMessage, true);
}

// ========================= 事件监听与命令注册 =========================

// 聊天触发（包含 @ai 或 "ai" 或 "兮兮"）
mc.listen("onChat", async (player, msg) => {
    if (simulatedPlayer && player.xuid === simulatedPlayer.xuid) return;

    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.startsWith("+")) return;
    if (lowerMsg.includes("ai") || lowerMsg.includes("兮兮")) {
        const timestamp = new Date().toLocaleString("zh-CN", { hour12: false });
        const dimName = dimIdToName(player.pos.dimid);
        const formatted = `[${timestamp}][${dimName}]${player.realName} >> ${msg}`;
        callAI(formatted);
    }
});


// 控制台命令触发
mc.listen("onConsoleCmd", (cmd) => {
    if (cmd.startsWith("ai ")) {
        const aiMsg = cmd.slice(3);
        callAI(`[控制台] ${aiMsg}`);
        return false; // 拦截命令，不输出到控制台
    }
});

// 服务器关闭时清理内存和定时器
ll.onUnload(() => {
    if (activeNav.checkInterval) clearInterval(activeNav.checkInterval);
    memoryFile.close();
});