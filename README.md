# Chat With GPT

项目作者：ChatGPT

开发指导：Sunwish

## 基本介绍

本项目为基于 HTML+CSS+JS 的极简 ChatGPT 聊天应用，支持连续对话，每条对话后显示全程消耗的总token数和估算的总金钱开销。本应用 99% 的代码均由 ChatGPT 生成，另有 1% 的人工样式修改。

## 把玩步骤

- no-server 模式：
  1. 克隆本仓库：`git clone https://github.com/Sunwish/ChatWithGPT.git`
  2. 修改 `script.js` 文件中的 `nickname` 变量为你的昵称，然后保存修改；
  3. 打开 `index.html` 文件，输入 OpenAI APK Key，开始聊天！
  4. 可点击 Save 按钮保存聊天记录，或点击 Load 按钮加载聊天记录。
- on-server 模式：
  - on-server 模式尚在施工中...（计划用于提供在线访问、聊天数据在线存储、聊天数据自动存储、角色配置、聊天配置、聊天列表等服务）
  1. 克隆本仓库：`git clone https://github.com/Sunwish/ChatWithGPT.git`
  2. 修改 `script.js` 文件中的 `nickname` 变量为你的昵称，然后保存修改；
  3. 依次执行：`npm install`、`node app.js`
  4. 浏览器中访问：`http://localhost:5050/`

> 此外，也可修改 `script.js` 文件中 `data` 变量的 `max_tokens` 值，以控制每次响应消息所使用的 token 上限。若响应消息因超出 max_tokens 限制而导致不完整，回复“继续”即可。

## 声明

请注意，本项目前后端均不会以任何形式向除 openai.com 以外的域发送或存储用户私人的 OpenAI API Key，用户的 OpenAI API Key 只以 localStorage 的形式存储在用户浏览器本地，并只在请求 OpenAI API 时作为凭证发往 openai.com。

## 界面截图

v1.0（基础聊天）：
![screenshot.png](https://s2.loli.net/2023/03/05/ETNBAzCu6UhLdFg.png)

v1.1（支持 Markdown 渲染和代码高亮）：
![screenshot2.png](https://s2.loli.net/2023/03/05/D9LxIjBYXJycMRs.png)

v1.2（支持聊天数据保存与加载，API Key 转移到前端设置并通过 localStorage 存储）：
![screenshot3.png](https://s2.loli.net/2023/03/07/7mUdWBatYKnAcz9.png)