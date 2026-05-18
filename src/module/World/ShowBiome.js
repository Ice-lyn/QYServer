const BiomeNameCn = new JsonConfigFile("./plugins/QYServer/Config/BiomeName.json");
const playerBiome = new Map();

mc.listen("onLeft", (pl) => playerBiome.delete(pl.xuid));

setInterval(() => {
    mc.getOnlinePlayers().forEach(pl => {
        if (pl?.hasTag("qys:on_ShowBiome")) return;

        let biomeName = pl.getBiomeName();
        biomeName = biomeName.startsWith("minecraft:") // 高版本lse兼容
            ? biomeName.slice(10)
            : biomeName;

        if (playerBiome.get(pl.xuid) === biomeName) return;
        playerBiome.set(pl.xuid, biomeName);
        
        pl.setTitle(`§§\n\n\n\n\n\n${BiomeNameCn.get(biomeName, biomeName)}              §§`, 2);
    })
}, 3000)