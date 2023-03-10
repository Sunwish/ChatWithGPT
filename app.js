const configPath = './config.json';
const serverModePath = './serverMode.json';

const Koa = require('koa');
const router = new require('koa-router')(); // 路由模块
const cors = require('koa2-cors'); // 跨域处理模块
const { koaBody } = require('koa-body'); // koa body 接受格式配置模块
const static = require('koa-static');
const serverMode = require(serverModePath).mode;
const serverConfig = require(configPath)[serverMode];
const fs = require('fs');
const fetch = require('node-fetch');
var httpsProxyAgent;
if(serverConfig.proxy) {
    httpsProxyAgent = new require('https-proxy-agent')(`http://${serverConfig.proxy.host}:${serverConfig.proxy.port}`);
}

console.log(`server mode: ${serverMode}`);
console.log(serverConfig);

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

    if (!fs.existsSync(chatsDir)) { fs.mkdirSync(chatsDir); }
    if (!fs.existsSync(chatDir)) { fs.mkdirSync(chatDir); }
    if (!fs.existsSync(chatPath)) {
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
    let chatsDir = serverConfig.chatsDir;
    let chatDir = `${chatsDir}/${body.username}`;
    
    if (!fs.existsSync(chatsDir)) { fs.mkdirSync(chatsDir); }
    if (!fs.existsSync(chatDir)) { fs.mkdirSync(chatDir); }
    let info = await fs.promises.writeFile(`${chatsDir}/${body.username}/${body.chat.title}.json`, chat, 'utf8')
        .then(() => "Saved!");
    ctx.body = info;
})

router.post('/completions', async ctx => {
    let options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: ctx.request.headers.authorization,
        },
        body: JSON.stringify(ctx.request.body),
    };
    if(httpsProxyAgent) { options.agent = httpsProxyAgent }
    await fetch(serverConfig.api.path, options)
    .then(response => response.json())
    .then(res => { ctx.body = res; })
    .catch(err => { ctx.body = err; })
})

server.listen(serverConfig.port, () => {
    console.log('[Server] Koa listening on port ' + serverConfig.port + '.');
})