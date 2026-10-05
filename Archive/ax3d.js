// 邻域偏移与移动代价（26邻域）
const DIR_OFFSETS = [
    // 轴向 (代价 10)
    [1, 0, 0, 10], [-1, 0, 0, 10], [0, 1, 0, 10], [0, -1, 0, 10], [0, 0, 1, 10], [0, 0, -1, 10],
    // 面对角线 (代价 14)
    [1, 1, 0, 14], [1, -1, 0, 14], [-1, 1, 0, 14], [-1, -1, 0, 14],
    [1, 0, 1, 14], [1, 0, -1, 14], [-1, 0, 1, 14], [-1, 0, -1, 14],
    [0, 1, 1, 14], [0, 1, -1, 14], [0, -1, 1, 14], [0, -1, -1, 14],
    // 体对角线 (代价 17)
    [1, 1, 1, 17], [1, 1, -1, 17], [1, -1, 1, 17], [-1, 1, 1, 17],
    [1, -1, -1, 17], [-1, 1, -1, 17], [-1, -1, 1, 17], [-1, -1, -1, 17]
];

const UNSAFE_KEYWORDS = ['lava', 'fire', 'web'];   // 危险方块（完全不可通过）
const MAX_DIST = 300;                               // 最大寻路距离
const MAX_FALL = 10;                                // 最大允许下落距离（格数）
const FALL_COST_PER_BLOCK = 10;                     // 每下落一格增加的代价（与移动代价统一）

// 无碰撞体积的方块
export const blocksWithoutCollision = new Set([
    // ==================== 植物类 ====================
    // 高草丛与蕨类
    "minecraft:short_grass",        // 草（矮草丛）
    "minecraft:tall_grass",         // 高草丛
    "minecraft:fern",               // 蕨
    "minecraft:large_fern",         // 大型蕨
    "minecraft:seagrass",           // 海草
    "minecraft:tall_seagrass",      // 高海草

    // 花卉类（无碰撞箱，玩家可穿过）
    "minecraft:dandelion",          // 蒲公英
    "minecraft:poppy",              // 罂粟
    "minecraft:blue_orchid",        // 兰花
    "minecraft:allium",             // 绒球葱
    "minecraft:azure_bluet",        // 蓝花美耳草
    "minecraft:red_tulip",          // 红色郁金香
    "minecraft:orange_tulip",       // 橙色郁金香
    "minecraft:white_tulip",        // 白色郁金香
    "minecraft:pink_tulip",         // 粉色郁金香
    "minecraft:oxeye_daisy",        // 滨菊
    "minecraft:cornflower",         // 矢车菊
    "minecraft:lily_of_the_valley", // 铃兰
    "minecraft:wither_rose",        // 凋零玫瑰
    "minecraft:sunflower",          // 向日葵
    "minecraft:lilac",              // 丁香
    "minecraft:rose_bush",          // 玫瑰丛
    "minecraft:peony",              // 牡丹
    "minecraft:spore_blossom",      // 孢子花

    // 下界/末地植物
    "minecraft:nether_sprouts",     // 下界苗
    "minecraft:crimson_roots",      // 绯红菌索
    "minecraft:warped_roots",       // 诡异菌索

    // 其他植物与真菌
    "minecraft:brown_mushroom",      // 棕色蘑菇
    "minecraft:red_mushroom",        // 红色蘑菇
    "minecraft:dead_bush",           // 枯死的灌木
    "minecraft:cave_vines",          // 洞穴藤蔓
    "minecraft:weeping_vines",       // 垂泪藤
    "minecraft:twisting_vines",      // 缠怨藤

    // ==================== 机械与红石元件 ====================
    "minecraft:redstone_wire",       // 红石粉
    "minecraft:redstone_torch",      // 红石火把
    "minecraft:redstone_wall_torch", // 墙上的红石火把
    "minecraft:lever",               // 拉杆
    "minecraft:tripwire",            // 绊线（需要搭配绊线钩）
    "minecraft:tripwire_hook",       // 绊线钩

    // 铁轨类
    "minecraft:rail",                // 铁轨
    "minecraft:powered_rail",        // 动力铁轨
    "minecraft:detector_rail",       // 探测铁轨
    "minecraft:activator_rail",      // 激活铁轨

    // ==================== 照明与火类 ====================
    "minecraft:torch",               // 火把
    "minecraft:wall_torch",          // 墙上的火把
    "minecraft:soul_torch",          // 灵魂火把
    "minecraft:soul_wall_torch",     // 墙上的灵魂火把
    "minecraft:fire",                // 火
    "minecraft:soul_fire",           // 灵魂火
    "minecraft:lantern",             // 灯笼
    "minecraft:soul_lantern",        // 灵魂灯笼
    "minecraft:sea_pickle",          // 海泡菜

    // ==================== 装饰与实用 ====================
    "minecraft:flower_pot",          // 花盆
    "minecraft:potted_*",            // 所有带花的花盆（通常无碰撞）
    "minecraft:painting",            // 画
    "minecraft:item_frame",          // 物品展示框
    "minecraft:glow_item_frame",     // 荧光物品展示框
    "minecraft:armor_stand",         // 盔甲架（实体，但通常被视为无碰撞）
    "minecraft:carpet",              // 地毯（有极薄碰撞箱，玩家可站上去，但通常被视为无碰撞）

    // ==================== 其他技术性/无碰撞 ====================
    "minecraft:structure_void",      // 结构空位（完全无碰撞）
    "minecraft:light",               // 光源方块
    "minecraft:sculk_vein",          // 幽匿脉络
    "minecraft:vine",                // 藤蔓
    "minecraft:big_dripleaf_stem",   // 大型垂滴叶茎
    "minecraft:small_dripleaf",      // 小型垂滴叶
    "minecraft:hanging_roots",       // 垂根
    "minecraft:glow_lichen",         // 发光地衣
    "minecraft:water",               // 水（流体，无固体碰撞）
    "minecraft:lava",                // 熔岩（流体，无固体碰撞）
    "minecraft:bubble_column",       // 气泡柱
    "minecraft:powder_snow"          // 细雪（有特殊碰撞行为）
]);

// 最小二叉堆 
class MinHeap {
    constructor() {
        this.heap = [];
    }
    push(node) {
        this.heap.push(node);
        this._siftUp(this.heap.length - 1);
    }
    pop() {
        if (this.heap.length === 0) return null;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = bottom;
            this._siftDown(0);
        }
        return top;
    }
    isEmpty() {
        return this.heap.length === 0;
    }
    _siftUp(idx) {
        while (idx > 0) {
            const parent = (idx - 1) >> 1;
            if (this.heap[parent].f <= this.heap[idx].f) break;
            [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
            idx = parent;
        }
    }
    _siftDown(idx) {
        const n = this.heap.length;
        while (true) {
            let smallest = idx;
            const left = idx * 2 + 1;
            const right = left + 1;
            if (left < n && this.heap[left].f < this.heap[smallest].f) smallest = left;
            if (right < n && this.heap[right].f < this.heap[smallest].f) smallest = right;
            if (smallest === idx) break;
            [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
            idx = smallest;
        }
    }
}

/**
 * 3D A* 寻路，支持流式回调，自动处理下落与爬坡
 * @param {IntPos} startPos 起点（包含维度）
 * @param {IntPos} targetPos 终点（包含维度）
 * @param {Function} [callback] 可选回调，每得到一个路径点时调用 callback(pos, isFullPath)
 * @returns {Object|void} 若无 callback，返回 { isFullPath, path: IntPos[] }；否则无返回值
 */
export function navigatePos(startPos, targetPos, callback) {
    // 维度不一致直接返回目标
    if (startPos.dimid !== targetPos.dimid) {
        const finalPos = new IntPos(targetPos.x, targetPos.y, targetPos.z, targetPos.dimid);
        if (callback) {
            callback(finalPos, true);
            return;
        }
        return { isFullPath: true, path: [finalPos] };
    }

    const sx = startPos.x, sy = startPos.y, sz = startPos.z;
    const tx = targetPos.x, ty = targetPos.y, tz = targetPos.z;
    const dim = startPos.dimid;

    // ---------- 方块属性判断（闭包，捕获 dim 和缓存） ----------
    const traversableCache = new Map();   // 缓存 (x,y,z) 是否可通行
    const standableCache = new Map();     // 缓存 (x,y,z) 是否可站立（作为地面）

    function isTraversable(block) {
        if (!block) return false;
        if (block.isAir || block.isButtonBlock || block.isCropBlock) return true;
        if (blocksWithoutCollision.has(block.type)) return true;
        const type = block.type;
        if (typeof type === 'string') {
            for (const kw of UNSAFE_KEYWORDS) {
                if (type.includes(kw)) return false;
            }
        }
        return false; // 其他固体默认为阻挡
    }

    function isStandable(block) {
        if (!block) return false;
        // 空气、无碰撞方块、按钮、农作物等不能站立
        if (block.isAir || block.isButtonBlock || block.isCropBlock) return false;
        if (blocksWithoutCollision.has(block.type)) return false;
        // 危险方块也不能站立
        const type = block.type;
        if (typeof type === 'string') {
            for (const kw of UNSAFE_KEYWORDS) {
                if (type.includes(kw)) return false;
            }
        }
        return true; // 其余固体可站立（包括台阶、楼梯、地毯等）
    }

    function isTraversableAt(x, y, z) {
        const key = `${x},${y},${z}`;
        let cached = traversableCache.get(key);
        if (cached !== undefined) return cached;
        const block = mc.getBlock(new IntPos(x, y, z, dim));
        const pass = isTraversable(block);
        traversableCache.set(key, pass);
        return pass;
    }

    function isStandableAt(x, y, z) {
        const key = `${x},${y},${z}`;
        let cached = standableCache.get(key);
        if (cached !== undefined) return cached;
        const block = mc.getBlock(new IntPos(x, y, z, dim));
        const stand = isStandable(block);
        standableCache.set(key, stand);
        return stand;
    }

    // ---------- 辅助函数 ----------
    function heuristic(dx, dy, dz) {
        return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) * 10;
    }

    function packKey(x, y, z) { return `${x},${y},${z}`; }

    // 创建节点
    function createNode(x, y, z, parent, g, h) {
        return { x, y, z, parent, g, h, f: g + h };
    }

    // 核心：获取一个稳定可站立的目标点（若原节点悬空则自动下落）
    // 返回 { x, y, z, additionalCost }，若无法找到稳定点则返回 null
    function getStableStandingPoint(x, y, z, originY) {
        // 如果脚下已经是可站立地面，则直接使用原节点
        if (isStandableAt(x, y - 1, z)) {
            return { x, y, z, additionalCost: 0 };
        }
        // 尝试下落，最多 MAX_FALL 格
        for (let fall = 1; fall <= MAX_FALL; fall++) {
            const newY = y - fall;
            if (newY < 0) break;
            if (isStandableAt(x, newY - 1, z)) {
                // 下落高度差，增加额外代价（每格代价 FALL_COST_PER_BLOCK）
                const additionalCost = fall * FALL_COST_PER_BLOCK;
                return { x, y: newY, z, additionalCost };
            }
        }
        return null; // 无法找到稳定点，标记危险
    }

    // ---------- 快速距离剪枝 ----------
    const dx = Math.abs(sx - tx), dy = Math.abs(sy - ty), dz = Math.abs(sz - tz);
    if (Math.max(dx, dy, dz) > MAX_DIST) {
        const finalPos = new IntPos(tx, ty, tz, dim);
        if (callback) {
            callback(finalPos, true);
            return;
        }
        return { isFullPath: true, path: [finalPos] };
    }

    // 起点修正：如果起点悬空，则尝试将其下落至稳定点
    let startStable = getStableStandingPoint(sx, sy, sz, sy);
    if (!startStable) {
        // 起点完全无法站立，直接返回起点（避免错误）
        const startIntPos = new IntPos(sx, sy, sz, dim);
        if (callback) {
            callback(startIntPos, false);
            return;
        }
        return { isFullPath: false, path: [startIntPos] };
    }
    const startX = startStable.x, startY = startStable.y, startZ = startStable.z;
    const startExtraCost = startStable.additionalCost;

    // 终点修正：同样要求终点稳定（若悬空则下落）
    let targetStable = getStableStandingPoint(tx, ty, tz, ty);
    const finalTarget = targetStable ? { x: targetStable.x, y: targetStable.y, z: targetStable.z } : { x: tx, y: ty, z: tz };
    const targetX = finalTarget.x, targetY = finalTarget.y, targetZ = finalTarget.z;

    // ---------- A* 初始化 ----------
    const openHeap = new MinHeap();
    const closedSet = new Set();
    const gScore = new Map();
    const parentMap = new Map();

    const startKey = packKey(startX, startY, startZ);
    const startG = startExtraCost;
    const startH = heuristic(targetX - startX, targetY - startY, targetZ - startZ);
    const startNode = createNode(startX, startY, startZ, null, startG, startH);
    gScore.set(startKey, startG);
    openHeap.push(startNode);

    let finalNode = null;

    // ---------- A* 主循环 ----------
    while (!openHeap.isEmpty()) {
        const current = openHeap.pop();
        const curKey = packKey(current.x, current.y, current.z);
        if (closedSet.has(curKey)) continue;
        closedSet.add(curKey);

        // 到达终点区域（允许终点稍有偏差，但 y 必须匹配）
        if (current.x === targetX && current.y === targetY && current.z === targetZ) {
            finalNode = current;
            break;
        }

        // 扩展邻居
        for (const [dx, dy, dz, baseCost] of DIR_OFFSETS) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            const nz = current.z + dz;
            if (Math.abs(nx) > 20000 || Math.abs(ny) > 256 || Math.abs(nz) > 20000) continue;

            // 检查原始位置是否可通行（基本通过性）
            if (!isTraversableAt(nx, ny, nz)) continue;

            // 爬坡特殊检查：如果向上移动一格 (dy === 1)，必须保证新位置脚下有支撑
            if (dy === 1) {
                if (!isStandableAt(nx, ny - 1, nz)) continue;
            }

            // 下落/站立稳定处理
            const stable = getStableStandingPoint(nx, ny, nz, ny);
            if (!stable) continue; // 无法找到稳定点 → 标记危险，跳过此邻居

            const actualX = stable.x, actualY = stable.y, actualZ = stable.z;
            const additionalCost = stable.additionalCost;
            const totalMoveCost = baseCost + additionalCost;

            const nKey = packKey(actualX, actualY, actualZ);
            if (closedSet.has(nKey)) continue;

            const tentativeG = gScore.get(curKey) + totalMoveCost;
            const prevG = gScore.get(nKey);
            if (prevG === undefined || tentativeG < prevG) {
                gScore.set(nKey, tentativeG);
                const h = heuristic(targetX - actualX, targetY - actualY, targetZ - actualZ);
                const neighborNode = createNode(actualX, actualY, actualZ, current, tentativeG, h);
                parentMap.set(nKey, curKey);
                openHeap.push(neighborNode);
            }
        }
    }

    // ---------- 回溯路径 ----------
    let path = [];
    if (finalNode) {
        let cur = finalNode;
        while (cur) {
            path.unshift(new IntPos(cur.x, cur.y, cur.z, dim));
            const parentKey = parentMap.get(packKey(cur.x, cur.y, cur.z));
            if (!parentKey) break;
            const [px, py, pz] = parentKey.split(',').map(Number);
            cur = createNode(px, py, pz, null, 0, 0);
        }
    } else {
        // 未找到完整路径，选取 openSet 中离目标最近的节点
        let bestNode = null;
        let bestDist = Infinity;
        for (const node of openHeap.heap) {
            const d = Math.abs(node.x - targetX) + Math.abs(node.y - targetY) + Math.abs(node.z - targetZ);
            if (d < bestDist) {
                bestDist = d;
                bestNode = node;
            }
        }
        if (bestNode) {
            let cur = bestNode;
            while (cur) {
                path.unshift(new IntPos(cur.x, cur.y, cur.z, dim));
                const parentKey = parentMap.get(packKey(cur.x, cur.y, cur.z));
                if (!parentKey) break;
                const [px, py, pz] = parentKey.split(',').map(Number);
                cur = createNode(px, py, pz, null, 0, 0);
            }
        }
    }

    // 确保起点存在且不重复
    if (path.length === 0 || (path[0].x !== startX || path[0].y !== startY || path[0].z !== startZ)) {
        path.unshift(new IntPos(startX, startY, startZ, dim));
    }

    const isFullPath = finalNode !== null;

    // ---------- 流式回调或返回结果 ----------
    if (callback) {
        for (let i = 1; i < path.length; i++) {
            callback(path[i], i === path.length - 1 ? isFullPath : false);
        }
        if (path.length === 1 && isFullPath) {
            callback(path[0], true);
        }
        return;
    }

    return { isFullPath, path };
}


