import * as events from "./events.js";
import { config } from "../../Config/config.js";
import { omExpList } from "../index.js";
import nodemailer from "nodemailer";

// ==== 内部常量声明 ==== //
// 我不行了，直接在函数上面写变量vscode会解析错误
const mailObj = nodemailer.createTransport(config.Mail);
const regex = /"([^"]*)"|(\S+)/g;

const units = [
    { value: 86400, label: '天' },
    { value: 3600, label: '小时' },
    { value: 60, label: '分钟' },
    { value: 1, label: '秒' }
];

const mc2ansi = {
    '§0': '\x1b[30m', '§1': '\x1b[34m', '§2': '\x1b[32m', '§3': '\x1b[36m',
    '§4': '\x1b[31m', '§5': '\x1b[35m', '§6': '\x1b[33m', '§7': '\x1b[37m',
    '§8': '\x1b[90m', '§9': '\x1b[94m', '§a': '\x1b[92m', '§b': '\x1b[96m',
    '§c': '\x1b[91m', '§d': '\x1b[95m', '§e': '\x1b[93m', '§f': '\x1b[97m',
    '§l': '\x1b[1m', '§o': '\x1b[3m', '§n': '\x1b[4m', '§m': '\x1b[9m',
    '§r': '\x1b[0m'
};

const ansi2mc = {
    '\x1b[30m': '§0', '\x1b[34m': '§1', '\x1b[32m': '§2', '\x1b[36m': '§3',
    '\x1b[31m': '§4', '\x1b[35m': '§5', '\x1b[33m': '§6', '\x1b[37m': '§7',
    '\x1b[90m': '§8', '\x1b[94m': '§9', '\x1b[92m': '§a', '\x1b[96m': '§b',
    '\x1b[91m': '§c', '\x1b[95m': '§d', '\x1b[93m': '§e', '\x1b[97m': '§f',
    '\x1b[1m': '§l', '\x1b[3m': '§o', '\x1b[4m': '§n', '\x1b[9m': '§m',
    '\x1b[0m': '§r'
};

export const dimidStr = {
    0: "§b主世界§r",
    1: "§c下界§r",
    2: "§d末地§r"
}

let BehaviorLogObj = null;

ll.onUnload(() => { mailObj.close() });

// ==== 函数实现 ==== //

/**
 * 将坐标对象转换为字符串
 * @param {IntPos|FloatPos|Object} pos - 坐标对象
 * @param {number} [mode=0] - 输出模式
 * @returns {string} 格式化后的坐标字符串
 * 
 * 模式说明：
 * - mode=0：输出 `${x} ${y} ${z}`（空格分隔）
 * - mode=1：输出 `${x},${y},${z},${dimid}`（逗号分隔，含维度）
 */
export function pos2str(pos, mode = 0) {
    if (mode === 0) return `${pos.x} ${pos.y} ${pos.z}`;
    if (mode === 1) return `${pos.x},${pos.y},${pos.z},${pos.dimid}`;
}

/**
 * 坐标对象类型转换函数
 * @param {IntPos|FloatPos|Object} pos - 要转换的坐标对象/obj
 * @returns {IntPos} 转换后的整数坐标对象
 */
export function toIntPos(pos) {
    return new IntPos(
        pos.x,
        pos.y,
        pos.z,
        pos.dimid
    );
}

/**
 * 坐标对象类型转换函数
 * @param {IntPos|FloatPos|Object} pos - 要转换的坐标对象/obj
 * @returns {FloatPos} 转换后的浮点坐标对象
 */
export function toFloatPos(pos) {
    return new FloatPos(
        pos.x,
        pos.y,
        pos.z,
        pos.dimid
    );
}

/**
 * 全局数据存储Map
 * @constant {Map} globalMap
 * 
 * 功能说明：
 * - 用于在模块间共享数据
 * - 支持任意类型的键和值
 * - 全局唯一实例，可直接导入使用
 */
export const globalMap = new Map();

/**
 * 添加/onmode命令参数函数
 * @param {string} cmd - 要匹配的命令字符串
 * @param {Function} [callback] - 命令执行时的回调函数
 * @param {Object} callback.player - 执行命令的玩家对象
 * @param {string} callback.cmd - 执行的完整命令字符串
 */
export function addOnmodeCmd(setcmd, callback = (() => { })) {
    omExpList.push(setcmd);
    events.on("onModeCallback", (player, cmd) => {
        if (cmd[0] !== setcmd) return;
        callback(player, cmd.slice(1));
        return true;
    });
};

/**
 * 写入行为日志
 * @param {number} mode - 1: 完整参数模式 | 2: 简化模式 (event, name, pos, msg)
 * @param  {...any} data - 参数列表 (...) | (event, name, pos, msg)
 */
export function addBehaviorLog(mode = 0, ...data) {
    try {
        // 初始化（只执行一次）
        if (BehaviorLogObj === null) {
            BehaviorLogObj = ll.imports("BehaviorLog_WriteLog");
            if (!BehaviorLogObj) {
                // 备选方案：模拟日志输出
                BehaviorLogObj = (event, dim, doer, dx, dy, dz, target, tx, ty, tz, notes, logToConsole, logToFile) => {
                    logger.info(`[BehaviorLog] ${event} | ${doer} @ ${dim}(${Math.round(dx)},${Math.round(dy)},${Math.round(dz)}) | ${notes || ''}`);
                };
            }
        }

        if (mode === 1) {
            // 完整参数模式：直接传递所有参数
            // data = [event, dim, doer, dx, dy, dz, target, tx, ty, tz, notes, logToConsole, logToFile]
            return BehaviorLogObj(...data);
        }

        if (mode === 2) {
            const [event, name, pos, msg] = data;
            return BehaviorLogObj(
                event,                  // 事件名称
                pos.dimid ?? "",        // 维度
                name,                   // 操作者
                pos.x, pos.y, pos.z,    // 坐标
                "", "", "", "",         // 目标相关字段（留空）
                msg ?? "",              // 备注信息
                false,                  // 是否输出到控制台（由BehaviorLog配置控制）
                true                    // 是否写入文件
            );
        }
    } catch (e) {
        logger.warn(`[BehaviorLog] 写入失败: mode=${mode}`, ...data, "\n", e);
    }
}

/**
 * 命令行参数字符串解析函数
 * @param {string} input - 待解析的命令行参数字符串
 * @returns {string[]} - 解析后的参数数组
 * 
 * 解析规则：
 * - 双引号内的内容作为一个完整参数（忽略其中的空格）
 * - 非引号内容按空格分割为多个参数
 * - 不支持引号转义（即引号内不能包含转义的引号）
 * 
 * @example
 * parseArgs('hello "world test" 123')
 * // 返回: ['hello', 'world test', '123']
 */
export function parseArgs(input) {
    // 匹配引号内容或非空格序列
    const matches = []
    let match
    while ((match = regex.exec(input)) !== null) {
        // match[1] 是引号内容，match[2] 是非引号内容
        matches.push(match[1] !== undefined ? match[1] : match[2])
    }
    return matches
}

/**
 * 判断是否有权限在领地内操作
 * @param {Player} Player 玩家对象
 * @param {IntPos} Pos 方块的坐标对象
 * @returns {Boolean} - 返回是否有权限
 */
export function LandJudgment(Player, Pos) {
    // iLand
    if (ll.hasExported('ILAPI_PosGetLand')) {
        /** 领地ID @type {Number} */
        const LandId = ll.imports('ILAPI_PosGetLand')({
            'x': Pos.x,
            'y': Pos.y,
            'z': Pos.z,
            'dimid': Pos.dimid
        });
        if (LandId != -1 &&
            !(
                ll.imports('ILAPI_IsLandOwner')(LandId, Player.xuid)// 领地主人
                || ll.imports('ILAPI_IsLandOperator')(Player.xuid)// 领地管理
                || ll.imports('ILAPI_IsPlayerTrusted')(LandId, Player.xuid)// 被信任的
            )
        ) return false;
    }

    // PLand
    if (ll.hasExported("PLand_LDAPI", "PLand_getLandAt")) {
        /** 领地ID @type {Number} */
        let LandId = ll.imports('PLand_LDAPI', "PLand_getLandAt")(Pos);
        if (LandId != -1) return true;
    }
    return true;
}

/**
 * 获取聊天称号
 * @param {Player} player - 目标玩家对象
 * @return {string} - 返回称号字符串
 */
export function getChatTag(player) {
    const tag = player.getNbt()// 从USF数据里获取
        ?.getTag("DynamicProperties")
        ?.getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
        ?.getData("usfV2:chat_tag");
    return tag || "§e萌§a新§b求§d带§r";
}

export function getJoinTime(uuid) {
    return mc.getPlayerNbt(uuid)
        ?.getTag("DynamicProperties")
        ?.getTag("9472c503-5a92-43c8-7ddf-0492de2362d7")
        ?.getData("usfV2:id") || 0;
}

/**
 * 设置物品数量
 * @param {Item} item - 要修改的物品对象
 * @param {number} count - 目标数量
 * @returns {boolean} 是否设置成功
 * @example 设置完成后需要手动刷新
 */
export function setItemCount(item, count) {
    return item.setNbt(
        item.getNbt()
            .setByte("Count", count)
    )
}

/**
 * 崩溃玩家客户端
 * @param {Player} player - 目标玩家对象
 */
export function crash(player) {
    const pack = new BinaryStream()
    pack.writeVarInt64(Number(player.uniqueId))
    player.sendPacket(pack.createPacket(0x0E))
    setTimeout(() => {// 如果玩家没有被崩掉，就直接踢
        player?.despawn() || player?.kick("服务器发送了破损的数据包")
    }, 100)
    logger.warn(`向 ${player.realName} 发送客户端崩溃请求...`)
}

/**
 * 文件大小格式化函数
 * @param {number} bytes - 文件大小的字节数
 * @param {number} mode - 输入单位模式 (0:B, 1:KB, 2:MB, 3:GB)
 * @returns {string} - 格式化后的文件大小字符串（自动选择合适单位）
 */
export function getFileSize(bytes, mode = 0) {
    const bytesValue = bytes * 1024 ** mode;
    const unitIndex = Math.min(3, Math.floor(Math.log2(bytesValue) / 10));
    return (bytesValue / 1024 ** unitIndex).toFixed(2) + " " + ["B", "KB", "MB", "GB"][unitIndex];
}

/**
 * 秒数格式化函数
 * @param {number} seconds - 要格式化的秒数
 * @returns {string} - 格式化后的时间字符串
 */
export function formatSeconds(seconds) {
    let result = '';
    units.forEach(({ value, label }) => {
        if (seconds >= value) {
            const count = Math.floor(seconds / value);
            result += `${count}${label} `;
            seconds %= value;
        }
    })
    return result.trim() || '0秒';
}

/**
 * 随机打乱字符串
 * @param {string} str - 要打乱的字符串
 * @returns {string} 返回打乱后的字符串
 */
export function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

/**
 * 概率判断函数
 * @param {number} percent - 触发概率百分比，范围 0-100
 * @returns {boolean} 是否触发概率事件
 */
export function probability(percent) {
    return Math.random() * 100 < Math.max(0, Math.min(100, percent))
}

/**
 * 去除一段字符串内所有§颜色代码
 * @param {string} text - 原始文本
 * return {string} 返回去除后的文本
 */
export function delStringCode(text) {
    return text.replace(/§./g, '')
}

/**
 * 表情替换函数
 * @param {string} msg - 需要过滤的原始消息文本
 * @param {number} mode - 替换模式 0:emoji转特殊表情 1:特殊表情转emoji
 * @returns {string} - 过滤替换后的消息文本
 */
export function textToEmoji(msg, mode = 0) {
    const words = Array.from(config.replaceMap.keys()).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(words.join('|'), 'gi');
    return mode === 0
        ? msg.replace(regex, m => config.replaceMap.get(m.toLowerCase()) || m)
        : msg.replace(regex, m => Array.from(config.replaceMap).find(([k, v]) => v === m)?.[0] || m);
}

/**
 * 空值检查函数
 * @param {*} enter - 需要检查的输入值
 * @returns {boolean} - 如果值为null或undefined则返回true，否则返回false
 */
export function isNull(enter) {
    if (enter === null) return true
    if (enter === undefined) return true
    return false
}

/**
 * 创建标题日志记录器对象
 * @returns {Object} - 返回包含info、warn、error、debug四个方法的日志对象
 * 
 * 返回值说明：
 * - info(title, ...data): 以指定标题输出info级别日志
 * - warn(title, ...data): 以指定标题输出warn级别日志  
 * - error(title, ...data): 以指定标题输出error级别日志
 * - debug(title, ...data): 以指定标题输出debug级别日志
 */
export const titleLog = {
    info: ((title, ...data) => {
        logger.setTitle(title);
        logger.info(...data);
        logger.setTitle("Server");
    }),
    warn: ((title, ...data) => {
        logger.setTitle(title);
        logger.warn(...data);
        logger.setTitle("Server");
    }),
    error: ((title, ...data) => {
        logger.setTitle(title);
        logger.error(...data);
        logger.setTitle("Server");
    }),
    debug: ((title, ...data) => {
        logger.setTitle(title);
        logger.debug(...data);
        logger.setTitle("Server");
    })
}


/**
 * 为实体执行Minecraft命令
 * @param {Entity} entity - 要执行命令的实体对象
 * @param {string} cmd - 要执行的Minecraft命令
 * @returns {boolean} - 命令执行结果，失败返回false
 */
export function enRuncmd(entity, cmd) {
    if (entity === null) return false;

    // isPlayer在这里会炸，用realName绕过一下，也能判断玩家
    if (entity.realName) return mc.runcmdEx(`execute as "${entity.realName}" at @s run ${cmd}`);

    entity.addTag(`qys:runcmd_${entity.uniqueId}`); // 使用唯一ID做判断
    setTimeout(() => entity?.removeTag(`qys:runcmd_${entity?.uniqueId}`), 5);
    return mc.runcmdEx(`execute as @e[tag="qys:runcmd_${entity.uniqueId}"] at @s run ${cmd}`);
}

/**
 * Minecraft格式代码与ANSI颜色代码相互转换函数
 * @param {string} text - 需要转换的文本
 * @param {number} [mode=0] - 转换模式：0-Minecraft代码转ANSI，1-ANSI转Minecraft代码
 * @returns {string} - 转换后的文本
 * 
 * 转换对应关系：
 * - §0-§f ↔ 对应的ANSI颜色代码（如§0 → 黑色，§a → 亮绿色等）
 * - §l(粗体) ↔ \x1b[1m
 * - §o(斜体) ↔ \x1b[3m
 * - §n(下划线) ↔ \x1b[4m
 * - §m(删除线) ↔ \x1b[9m
 * - §r(重置) ↔ \x1b[0m
 * - §k(随机字符)在Minecraft→ANSI转换时被忽略
 * 
 * 注意：支持ANSI组合代码（如\x1b[1;34m）的解析和转换
 */

export function mcCode2Ansi(text, mode = 0) {
    // MC → ANSI
    // §k直接跳过，其他未定义的也跳过
    if (mode === 0) return text.replace(/§[0-9a-fk-or]/gi, match => mc2ansi[match.toLowerCase()] || '');
    // ANSI → MC
    // 处理组合代码如\x1b[1;34m
    else return text.replace(/\x1b\[([0-9;]+)m/g, (full, codes) => {
        const mcCodes = codes.split(';').map(code => {
            const key = `\x1b[${code}m`;
            return ansi2mc[key] || '';
        }).join('');
        return mcCodes;
    });
}

/**
 * 带超时倒计时的跨服传送函数
 * @param {Player} player - 要传送的玩家对象
 * @param {string} ip - 目标服务器IP地址
 * @param {number|string} port - 目标服务器端口号
 * @param {number} timeout - 倒计时秒数
 * @param {Function} [err] - 传送失败时的回调函数，参数为玩家对象，默认为提示切换失败
 * 
 * 功能说明：
 * - 从timeout秒开始倒计时，每秒向玩家发送提示信息
 * - 倒计时结束时执行跨服传送操作
 * - 如果传送失败，执行err回调函数
 * 
 * 注意：
 * - 函数不会阻塞执行，倒计时通过setTimeout异步进行
 * - 传送失败回调默认发送"[TPServer] 切换失败，请联系op"
 */
export function timeoutJoinServer(player, ip, port, timeout, err = (pl) => pl.tell("[TPServer] 切换失败，请联系op")) {
    const timeoutList = [];
    for (let i = timeout; i >= 0; i--) timeoutList.push(i)
    timeoutList.forEach((sec, index) => {
        setTimeout(() => {
            player.tell(`[TPServer] 正在将您您切换至其他服务器，剩余 §a${sec}§r 秒`)
            if (sec === 1) player.transServer(`${ip}`, Number(port)) || err(player)
        }, (index + 1) * 1000)
    })
}

/**
 * 聊天消息转义/反转义函数
 * @param {string} msg - 待处理的消息字符串
 * @param {number} [mode=0] - 处理模式
 * @returns {string} 处理后的消息字符串
 * 
 * 模式说明：
 * - mode=0（转义模式）：将特殊字符 ^ $ & [ ] 前面添加反斜杠进行转义
 * - mode=1（反转义模式）：将已转义的 \^ \$ \& \[ \] 还原为原字符
 */
export function str2say(msg, mode = 0) {
    if (mode === 0) {
        msg = msg.replaceAll("^", "\\^")
            .replaceAll("$", "\\$")
            .replaceAll("&", "\\&")
            .replaceAll("[", "\\[")
            .replaceAll("]", "\\]");
    } else if (mode === 1) {
        msg = msg.replaceAll("\\^", "^")
            .replaceAll("\\$", "$")
            .replaceAll("\\&", "&")
            .replaceAll("\\[", "[")
            .replaceAll("\\]", "]");
    }
    return msg;
}

/**
 * 异步发送邮件函数
 * @param {Object} mailData - 邮件数据对象
 * @param {string} mailData.from - 发件人地址
 * @param {string|string[]} mailData.to - 收件人地址（支持数组）
 * @param {string} mailData.subject - 邮件主题
 * @param {string} [mailData.text] - 纯文本正文
 * @param {string} [mailData.html] - HTML格式正文
 * @param {Function} [callback] - 发送结果回调函数
 * @param {Object} callback.result - 发送成功时返回的邮件信息对象
 * @param {boolean} callback.success - 发送成功时为true，失败时为false
 * @param {Error} callback.error - 发送失败时的错误对象（仅在失败时存在）
 */
export async function sendMail(mailData, callback = (() => { })) {
    try {
        await mailObj.verify();
        const info = await mailObj.sendMail(mailData);
        callback(info, true);
    } catch (error) {
        callback(error, false);
    }
}

/**
 * 玩家标签数据存储
 * @param {Entity} entity - 实体对象
 * @param {string} mode - 操作模式: add, remove, set, delete, get
 * @param {string} name - 数据键名
 * @param {any} data - 数据（add/remove时为数组或逗号分隔字符串，set时为JSON字符串）
 * @returns {any} - get模式返回数据，其他模式返回是否成功
 */
export function tagData(entity, mode, name, data = null) {
    const prefix = `qys_data:${name}:`;
    const allTags = entity.getAllTags();
    let oldTag = null, oldStr = null;

    // 查找现有tag
    for (const tag of allTags) {
        if (tag.startsWith(prefix)) {
            oldTag = tag;
            oldStr = tag.slice(prefix.length);
            break;
        }
    }

    // get
    if (mode === "get") return oldStr ? JSON.parse(oldStr) : null;

    // delete
    if (mode === "delete") {
        if (oldTag) entity.removeTag(oldTag);
        return;
    }

    // 辅助：解析数据
    const parseData = (str) => {
        try { return JSON.parse(str); } catch { return []; }
    };

    // add
    if (mode === "add") {
        const old = oldStr ? parseData(oldStr) : [];
        const items = Array.isArray(data) ? data : String(data).split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...old, ...items])];
        if (oldTag) entity.removeTag(oldTag);
        if (merged.length) entity.addTag(`${prefix}${JSON.stringify(merged)}`);
        return;
    }

    // remove
    if (mode === "remove" && oldStr) {
        const old = parseData(oldStr);
        const removes = new Set(Array.isArray(data) ? data.map(String) : String(data).split(',').map(s => s.trim().toString()));
        const filtered = old.filter(item => !removes.has(String(item)));
        entity.removeTag(oldTag);
        if (filtered.length) entity.addTag(`${prefix}${JSON.stringify(filtered)}`);
        return;
    }

    // set / reset
    if (mode === "set" || mode === "reset") {
        if (oldTag) entity.removeTag(oldTag);
        if (data) entity.addTag(`${prefix}${typeof data === 'string' ? data : JSON.stringify(data)}`);
    }
}

/**
 * 音符音高映射表（用于乐器类插件/模组）
 * @constant {Object} pitchList
 * @property {number[]} 15 - 15键音高映射数组（F#3 ~ F5，共24个半音）
 * @property {number[]} 21 - 21键音高映射数组（F#3 ~ F#5，共25个半音）
 * 
 * 数值说明：
 * - 数值为相对于基准频率的播放速率倍数
 * - 1.0 对应 F#4（标准音高）
 * - 0.5 为低八度，2.0 为高八度
 * - 基于十二平均律，相邻半音比值为 2^(1/12) ≈ 1.059463
 * 
 * 音名对照（以15键为例）：
 * - key=0  → F#3 (0.5)
 * - key=6  → C4  (0.707107) 中央C区域起始
 * - key=12 → F#4 (1.0)      标准音高
 * - key=23 → F5  (1.887749)
 */
export const pitchList = {
    15: [
        0.5,     // F#3 (key=0)
        0.529732, // G3 (key=1)
        0.561231, // G#3 (key=2)
        0.594604, // A3 (key=3)
        0.629961, // A#3 (key=4)
        0.66742,  // B3 (key=5)
        0.707107, // C4 (key=6)
        0.749154, // C#4 (key=7)
        0.793701, // D4 (key=8)
        0.840896, // D#4 (key=9)
        0.890899, // E4 (key=10)
        0.943874, // F4 (key=11)
        1.0,      // F#4 (key=12) ← 中央 C 区域
        1.059463, // G4 (key=13)
        1.122462, // G#4 (key=14)
        1.189207, // A4 (key=15)
        1.259921, // A#4 (key=16)
        1.33484,  // B4 (key=17)
        1.414214, // C5 (key=18)
        1.498307, // C#5 (key=19)
        1.587401, // D5 (key=20)
        1.681793, // D#5 (key=21)
        1.781797, // E5 (key=22)
        1.887749  // F5 (key=23)
    ],
    21: [
        0.5,    // F#3 (第1个半音)
        0.529732, // G3
        0.561231, // G#3
        0.594604, // A3
        0.629961, // A#3
        0.66742,  // B3
        0.707107, // C4 (中央C)
        0.749154, // C#4
        0.793701, // D4
        0.840896, // D#4
        0.890899, // E4
        0.943874, // F4
        1.0,      // F#4 (标准音高)
        1.059463, // G4
        1.122462, // G#4
        1.189207, // A4
        1.259921, // A#4
        1.33484,  // B4
        1.414214, // C5
        1.498307, // C#5
        1.587401, // D5
        1.681793, // D#5
        1.781797, // E5
        1.887749, // F5
        2.0       // F#5
    ]
}