const config = require("./QYServer/config/config.js")

// 玩家跳跃
mc.listen("onJump",(pl) => {
    const block = pl.getBlockStandingOn()
    if (block?.type !== config.sky_block_type) return
  
    const targetY = findUpBlock(pl.blockPos)
    if (!targetY) return pl.tell("楼上没有云朵啦>_<",5)
    pl.teleport(new FloatPos(pl.pos.x, targetY + 0.1, pl.pos.z, pl.pos.dimid)) && pl.tell("§a叮咚~上楼!",5)
    
});

// 玩家潜行
mc.listen("onSneak",(pl, isSneaking) => {   
    if (!isSneaking) return
    const block = pl.getBlockStandingOn()
    if (block?.type !== config.sky_block_type) return
  
    const targetY = findDownBlock(pl.blockPos)
    if (!targetY) return pl.tell("楼下没有云朵啦>_<",5)
    pl.teleport(new FloatPos(pl.pos.x, targetY + 0.1, pl.pos.z, pl.pos.dimid)) && pl.tell("§a叮咚~下楼!",5)
    
});

// 找楼上的云朵，返回目标Y坐标
function findUpBlock(pos) {
    for (let y = pos.y + 1; y <= pos.y + config.sky_max_floor; y++) {
        const checkPos = (inputY = y) => new IntPos(pos.x, inputY, pos.z, pos.dimid)
        if (mc.getBlock(checkPos())?.type != config.sky_block_type) continue
        if (mc.getBlock(checkPos(y + 1))?.type != config.sky_block_type) return y + 1
        const higherResult = findUpBlock(checkPos(y + 1))
        if (higherResult) return higherResult
        
    }
    return null
}

// 找楼下的云朵，返回目标Y坐标  
function findDownBlock(pos) {
    for (let y = pos.y - 2; y >= pos.y - config.sky_max_floor; y--) {
        const checkPos = (inputY = y) => new IntPos(pos.x, inputY, pos.z, pos.dimid)
        if (mc.getBlock(checkPos())?.type != config.sky_block_type) continue
        if (mc.getBlock(checkPos(y - 1))?.type != config.sky_block_type) return y + 1
        const lowerResult = findDownBlock(checkPos(y - 1))
        if (lowerResult) return lowerResult
        
    }
    return null
}