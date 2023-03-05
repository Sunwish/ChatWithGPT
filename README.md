# Chat With GPT

项目作者：ChatGPT

开发指导：Sunwish

## 基本介绍

本项目为基于 HTML+CSS+JS 的极简 ChatGPT 聊天应用，支持连续对话，每条对话后显示全程消耗的总token数和估算的总金钱开销。本应用 99% 的代码均由 ChatGPT 生成，另有 1% 的人工样式修改。

## 把玩步骤：

1. 克隆本仓库：`git clone https://github.com/Sunwish/ChatWithGPT.git`
2. 修改 `script.js` 文件中的 `OPENAI_API_KEY` 变量为你 OpenAI 账户的 API Key，`nickname` 变量为你的昵称，然后保存修改；
3. 打开 `index.html` 文件，开始聊天！

> 此外，也可修改 `script.js` 文件中 `data` 变量的 `max_tokens` 值，以控制每次响应消息所使用的 token 上限。若响应消息因超出 max_tokens 限制而导致不完整，回复“继续”即可。

## 界面截图：

![screenshot.png](https://s2.loli.net/2023/03/05/ETNBAzCu6UhLdFg.png)

![screenshot2.png](https://s2.loli.net/2023/03/05/D9LxIjBYXJycMRs.png)