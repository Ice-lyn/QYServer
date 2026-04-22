import { config } from "../../../Config/config.js";

// 游戏类小说阅读器UI
export function getBook(text, pl) {
    network.httpGet(`https://yunzhiapi.cn/API/fqmfxs.php?token=${config.token}&name=` + text, (code, res) => {
        const resJson = JSON.parse(res);
        if (code !== 200
            || resJson.code !== 200
            || resJson.data?.length == 0
        ) return pl.tell("请求失败");
        const fm = mc.newSimpleForm()
            .setTitle("小说阅读器")
            .setContent("获取到以下小说: ");
        resJson.data.forEach(bookData => {
            fm.addButton(bookData.小说名称, "textures/ui/icon_bookshelf");
        });
        pl.sendForm(fm, (player, id) => {
            network.httpGet(resJson.data[id].章节目录, (_code, res) => {
                const resJson = JSON.parse(res);
                const fm = mc.newSimpleForm()
                    .setTitle("小说阅读器")
                    .setContent("选择阅读的章节: ");
                resJson.data.chapters.forEach(bookData => {
                    fm.addButton(bookData.章节名称, "textures/ui/icon_book_writable");
                });
                player.sendForm(fm, (player, id) => {
                    getBookTxt(resJson.data.chapters[id].开始阅读, player);
                });
            })
        })
    })
}

// 获取正文
function getBookTxt(url, pl) {
    network.httpGet(url, (_code, res) => {
        const params = url.split('?')[1].split('&');
        let href, num;
        params.forEach(param => {
            const [key, value] = param.split('=');
            if (key === 'href') href = value;
            if (key === 'num') num = parseInt(value);
        });

        const fm = mc.newSimpleForm()
            .setTitle("小说阅读器")
            .setContent(res)
            .addButton("上一页", "textures/ui/book_shiftleft_default")
            .addButton("退出阅读", "textures/items/book_portfolio")
            .addButton("下一页", "textures/ui/book_shiftright_default");

        pl.sendForm(fm, (player, id) => {
            let newNum = num;
            let newHref = href;

            if (id === 0 && num > 1) newNum--; // 上一页
            if (id === 2) newNum++; // 下一页

            if (newNum > 3) {
                const parts = href.split('/');
                const chapter = parseInt(parts[2].split('.')[0]) + 1;
                newHref = `${parts[0]}/${parts[1]}/${chapter}.html`;
                newNum = 1;
            }

            const newUrl = `https://yunzhiapi.cn/API/fqmfxs.php?token=${config.token}&href=${newHref}&num=${newNum}`;
            if (id !== 1) getBookTxt(newUrl, player);
        });
    });
}