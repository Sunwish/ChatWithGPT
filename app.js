const configPath = './config.json';

const Koa = require('koa');
const router = new require('koa-router')(); // 路由模块
const cors = require('koa2-cors'); // 跨域处理模块
const { koaBody } = require('koa-body'); // koa body 接受格式配置模块
const static = require('koa-static');
const serverConfig = require(configPath).dev;
const fs = require('fs');


const app = new Koa({
    proxy: true
}); // 创建 Koa 服务

const server = require('http').createServer(app.callback());

// 配置跨域
app.use(cors());
// 配置 body 体格式
app.use(koaBody());
// 配置路由
app.use(router.routes()).use(router.allowedMethods());
app.use(static('./'))

router.get('/chat', async ctx => {
    let username = ctx.request.query.username;
    let chatTitle = ctx.request.query.title;
    let chatsDir = serverConfig.chatsDir;
    let chatDir = `${chatsDir}/${username}`
    let chatPath = chatDir + `/${chatTitle}.json`;

    if(!fs.existsSync(chatDir)) { fs.mkdirSync(chatDir); }
    if(!fs.existsSync(chatPath)) {
        let templateChat = require(serverConfig.templateChatPath);
        templateChat.title = chatTitle;
        await fs.promises.writeFile(`${chatsDir}/${username}/${chatTitle}.json`, JSON.stringify(templateChat), 'utf8'); 
    }
    delete require.cache[require.resolve(chatPath)];
    let chat = require(chatPath);
    ctx.body = chat;
})

router.post('/save', async ctx => {
    let body = ctx.request.body;
    let chat = JSON.stringify(body.chat);
    let info = await fs.promises.writeFile(`${chatsDir}/${body.username}/${body.chat.title}.json`, chat, 'utf8')
    .then(() => "Saved!");
    ctx.body = info;
})

server.listen(serverConfig.port, () => {
    console.log('[Server] Koa listening on port ' + serverConfig.port + '.');
})