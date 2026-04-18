import { config } from "../../../Config/config.js";
const { minX, maxX, minZ, maxZ } = config.world_limits;
const lastPositions = new Map();

setInterval(() => {
    mc.getOnlinePlayers().forEach(pl => {
        if (pl.pos.dimid == -1) return;

        const pos = pl.pos;
        const key = pl.realName;
        const lastPos = lastPositions.get(key);

        // 1. 位置未变化检测（最轻量）
        if (lastPos && Math.abs(lastPos.x - pos.x) < 1 && Math.abs(lastPos.z - pos.z) < 1) {
            return;
        }

        // 2. 快速边界预判（比100格检测更高效）
        // 如果玩家在边界内且有足够安全距离，直接跳过
        if (pos.x > minX + 200 && pos.x < maxX - 200 &&
            pos.z > minZ + 200 && pos.z < maxZ - 200) {
            lastPositions.set(key, pos); // 仍需更新位置
            return;
        }

        // 3. 精确边界检测（仅对靠近边界的玩家执行）
        if (pos.x < minX || pos.x > maxX || pos.z < minZ || pos.z > maxZ) {
            pl.teleport(getNearestValidPos(pos));
            pl.tell(`§c你已超出世界边界！\nX: (${minX} - ${maxX}), Z: (${minZ} - ${maxZ})`);
        }

        lastPositions.set(key, pos);
    });
}, 4 * 1000);

// 或许最近有效位置
function getNearestValidPos(pos) {
    let x = Math.max(minX, Math.min(maxX, pos.x));
    let z = Math.max(minZ, Math.min(maxZ, pos.z));

    // 稍微向边界内侧移动，避免卡边界
    if (pos.x < minX) x = minX + 2;
    else if (pos.x > maxX) x = maxX - 2;
    if (pos.z < minZ) z = minZ + 2;
    else if (pos.z > maxZ) z = maxZ - 2;

    return mc.newFloatPos(x, pos.y, z, pos.dimid);
}