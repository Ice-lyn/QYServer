const BiomeNameCn = new JsonConfigFile("./plugins/QYServer/Data/System/BiomeName.json")
const playerBiome = new Map()

mc.listen("onLeft", (pl) => playerBiome.delete(pl.xuid))

setInterval(() => {
    mc.getOnlinePlayers().forEach(pl => {
        if (pl?.hasTag("qys:on_ShowBiome")) return
        const BiomeName = pl.getBiomeName()
        if (playerBiome.get(pl.xuid) === BiomeName) return
        //pl.setTitle(`${BiomeNameCn.get(BiomeName,BiomeName)}`,2)
        pl.setTitle(`§§\n\n\n\n\n\n${BiomeNameCn.get(BiomeName,BiomeName)}                  §§`,2)
        //pl.setTitle("§8此提示为早期测试版本，未来可能会修改或删除",3)
        playerBiome.set(pl.xuid,BiomeName)
    })
},3000)