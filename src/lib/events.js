const eventMap = new Map();

/**
 * 注册事件监听器
 * @param {string} name - 事件名称
 * @param {Function} fn - 事件回调函数
 * @returns {Function} - 返回取消监听的函数
 */
export const on = (name, fn) => {
    eventMap.has(name) || eventMap.set(name, []);
    eventMap.get(name).push(fn);
    return () => off(name, fn); // 返回取消函数
};

/**
 * 检查事件是否存在有效监听器
 */
export const has = (name) => {
    return eventMap.has(name) && eventMap.get(name).length > 0;
};

/**
 * 触发事件 - 收集所有返回值
 * @param {string} name - 事件名称
 * @param {...*} args - 传递给回调函数的参数
 * @returns {Array} - 所有监听器的返回值数组
 * 
 * 说明：按注册顺序执行所有监听器，收集并返回所有返回值
 */
export const emit = (name, ...args) => {
    if (!eventMap.has(name)) return [];
    const results = [];
    for (const fn of eventMap.get(name)) {
        try {
            const result = fn(...args);
            results.push(result);
        } catch (error) {
            logger.error(`事件 ${name} 执行错误:`, error);
            results.push(null);
        }
    }
    return results;
};

/**
 * 触发事件 - 遇到第一个假值（false/null/undefined）就停止
 * @param {string} name - 事件名称
 * @param {...*} args - 传递给回调函数的参数
 * @returns {*} - 第一个假值，如果没有假值则返回最后一个结果
 * 
 * 适用场景：命令拦截，第一个返回 false 的监听器会阻止后续执行
 */
export const emitUntilFalse = (name, ...args) => {
    if (!eventMap.has(name)) return true;
    for (const fn of eventMap.get(name)) {
        const result = fn(...args);
        if (result === false || result === null || result === undefined) {
            return false; // 被拦截
        }
    }
    return true;
};

/**
 * 触发事件 - 获取第一个有效返回值
 * @param {string} name - 事件名称
 * @param {...*} args - 传递给回调函数的参数
 * @returns {*} - 第一个不是 undefined 的返回值
 */
export const emitFirst = (name, ...args) => {
    if (!eventMap.has(name)) return undefined;
    for (const fn of eventMap.get(name)) {
        const result = fn(...args);
        if (result !== undefined) return result;
    }
    return undefined;
};

/**
 * 移除事件监听器
 */
export const off = (name, fn) => {
    if (!eventMap.has(name)) return;
    if (fn) {
        const filtered = eventMap.get(name).filter(f => f !== fn);
        filtered.length ? eventMap.set(name, filtered) : eventMap.delete(name);
    } else {
        eventMap.delete(name);
    }
};

/**
 * 注册一次性事件监听器
 */
export const once = (name, fn) => {
    const wrapper = (...args) => {
        fn(...args);
        off(name, wrapper);
    };
    on(name, wrapper);
};