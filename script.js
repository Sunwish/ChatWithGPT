const topDiv = document.getElementById("title");
const messageList = document.getElementById("message-list");
const messageUl = document.getElementById("message-ul");
const messageInput = document.getElementById("message-input");
const apiKeyInput = document.getElementById("api-key-input");
const clearBtn = document.getElementById("clear-btn");
const sendBtn = document.getElementById("send-btn");
const saveBtn = document.getElementById("save-btn");
const loadBtn = document.getElementById("load-btn");

const configTitle = document.getElementById('configTitle');
const configUserNickname = document.getElementById('configUserNickname');
const configAINickname = document.getElementById('configAINickname');
const configMemoryCount = document.getElementById('configMemoryCount');
const characteristicSelect = document.getElementById('situationSelect');
const characteristicTextarea = document.getElementById('situationTextarea');

var chatConfig = {
  title: "小助手",
  userNickname: "Sunwish",
  aiNickname: "AI",
  characteristic: "You are a helpful assistant.",
  memory: 10
};
const characteristics = [
  {
    name: '默认',
    prompt: 'You are a helpful assistant.',
    memory: 10
  },
  {
    name: '自定义',
    prompt: '',
    memory: 10
  },
  {
    name: '中英翻译',
    prompt: 'I want you to act as an English And Chinese translator, spelling corrector and improver. I will speak to you in Chinese or English and you will detect the language, translate it and answer in the corrected and improved version of my text, in English when I speak Chinese to you, or in Chinese when I speak English to you. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level English or Chinese words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations. ',
    memory: 0
  },
  {
    name: 'Emoji翻译',
    prompt: `从现在开始，你的回答必须把所有字逐字地替换成emoji，并保持原来的含义。替换过程中你不能跳过任何字，不能使用任何汉字或英文。如果有的字没有合适的emoji，则将他们替换成谐音字的emoji。下面是一个例子：\n\n原文：爷吐啦\n\n翻译：👴🐰🌶️`,
    memory: 0
  },
  {
    name: 'Emoji逆向',
    prompt: `从现在开始，你的回答必须把我发送的所有emoji逐个地替换成汉字，尽可能每个emoji只替换成单个汉字，要使得转换完毕的汉字组成的句子是通顺的。替换过程中你不能跳过任何emoji，每个emoji替换得到的汉字允许是该emoji所蕴含的意思的同音字或谐音字以确保结果句通顺。下面是一个例子：\n\n原文：👴🐰🌶️\n\n翻译：爷吐啦`,
    memory: 0
  },
  {
    name: '欠揍的AI',
    prompt: `你是一个挑衅的AI，对于用户的每一条消息，你的回复都要以严肃、不屑以及嘲讽的语气和用户对着干，尽可能让用户生气。`,
    memory:10
  }
];
let totalTokenCost = 0;
const defaultSystemMessage = {
  role: 'system',
  content: characteristics[0].prompt
}
let messageHistory = [defaultSystemMessage];

const serverUrl = "http://localhost:5050"
const serverChatRoute = "/chat"
const serverSaveRoute = "/save"

window.onresize = function () {
  const container = document.querySelector('.container');
  container.style.height = window.innerHeight + 'px';
}

window.onload = async function () {
  const container = document.querySelector('.container');
  container.style.height = window.innerHeight + 'px';

  // Get messageInput height for calc messageList height
  document.documentElement.style.setProperty('--message-input-height', messageInput.clientHeight + 'px');
  messageInput.focus();

  // Load key from localStorage
  apiKeyInput.value = localStorage.getItem('key');

  // Get config and restore message history
  topDiv.innerHTML = chatConfig.title;
  let chat = JSON.parse(localStorage.getItem('chat'));
  /*
  // 连接服务器获取历史消息
  try {
    const url = new URL(serverUrl + serverChatRoute);
    url.searchParams.set('username', chatConfig.userNickname);
    url.searchParams.set('title', chatConfig.title);
    chat = await fetch(url.pathname + url.search)
      .then(response => response.json())
      .then(json => json);
  } catch (error) {
    console.log(error)
  }
  */
  if (chat) {
    chatConfig.memory = chat.memory;
    if (chatConfig.memory == undefined) { chatConfig.memory = 10; }
    topDiv.innerHTML = chat.title
    restoreFromChatInfo(chat);
  } else {
    // insertMessage({ role: "system", content: "非服务端模式或连接服务器失败，聊天内容将不会自动保存，保存聊天记录需手动点击保存按钮。" })
    restoreFromChatInfo(messageHistoryToChatObj(messageHistory))
  }
  
  messageList.scrollTop = messageList.scrollHeight;
};

sendBtn.addEventListener("click", function () {
  const message = messageInput.value;

  if (message.trim() !== "") {
    const userMessage = { role: "user", content: message };
    messageHistory.push(userMessage);
    insertMessage(userMessage)

    // Show loading spinner
    const loadingLi = document.createElement("li");
    loadingLi.classList.add("message", "loading");
    loadingLi.innerHTML = `<div class="spinner"></div>`;
    messageUl.appendChild(loadingLi);

    messageList.scrollTop = messageList.scrollHeight;

    let requestMessages = [];
    if (messageHistory.length <= chatConfig.memory + 1) {
      requestMessages = messageHistory
    } else {
      requestMessages = [messageHistory[0], ...messageHistory.slice(messageHistory.length - Math.max(1, chatConfig.memory))]
    }
    console.log(requestMessages)
    const data = {
      model: "gpt-3.5-turbo",
      messages: requestMessages,
      max_tokens: 500
    };

    let key = apiKeyInput.value;
    //fetch("https://api.openai.com/v1/chat/completions", {
    fetch("/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          messageHistory.pop();
          throw data.error;
        }

        localStorage.setItem('key', key)

        // Remove loading spinner
        messageUl.removeChild(loadingLi);

        const aiMessage = data.choices[0].message.content.trim();
        const aiMessageObj = { role: "assistant", content: aiMessage };
        messageHistory.push(aiMessageObj);

        totalTokenCost += data.usage.total_tokens
        insertMessage(aiMessageObj)

        // Scroll to the bottom of the message list
        messageList.scrollTop = messageList.scrollHeight;
        
        // 保存消息历史到服务器
        //saveChatToServer();
        // 保存历史消息到 localStorage
        localStorage.setItem('chat', JSON.stringify(messageHistoryToChatObj(messageHistory)));
      })
      .catch(error => {
        console.error(error);
        // Remove loading spinner
        messageUl.removeChild(loadingLi);

        const aiLi = document.createElement("li");
        aiLi.classList.add("message");
        aiLi.innerHTML = `<span class="nickname">Error</span> <span class="datetime">${new Date().toLocaleString()}</span><br><span style="color: red;">${error.message}</span>`;
        messageUl.appendChild(aiLi);

        // Scroll to the bottom of the message list
        messageList.scrollTop = messageList.scrollHeight;
      });

    messageInput.value = "";
    messageInput.focus();
  }
});

messageInput.addEventListener("keyup", function (event) {
  if (event.ctrlKey && event.key === "Enter") {
    return;
  }

  if (event.key === "Enter") {
    sendBtn.click();
  }
});

function insertMessage(message, time) {
  const datetime = time == undefined ? new Date().toLocaleString() : time;
  const messageHTML = getMarkedMessageElement(message.content)
  const insertLi = document.createElement("li");
  insertLi.classList.add("message");
  switch (message.role) {
    case "user":
      insertLi.innerHTML = `<span class="nickname ${message.role}">${chatConfig.userNickname}</span> <span class="datetime">${datetime}</span><br>${messageHTML}`;
      break;
    case "assistant":
      let totalMoneyCost = 0.002 * 7 / 1000 * totalTokenCost
      insertLi.innerHTML = `<span class="nickname ${message.role}">${chatConfig.aiNickname}</span> <span class="datetime">${datetime}</span> <span class="tokencost"> (consumed totally: ${totalTokenCost} tokens | ${totalMoneyCost} ¥)</span><br>${messageHTML}`;
      break;
    case "system":
      insertLi.innerHTML = `<span class="nickname ${message.role}">System</span> <span class="datetime">${datetime}</span><br>${messageHTML}`;
      break;
    default:
      break;
  }
  messageUl.appendChild(insertLi);
}

function getMarkedMessageElement(message) {
  return marked.parse(message, {
    highlight: function (code, lang) {
      const highlightedCode = lang ? hljs.highlight(lang, code).value : hljs.highlightAuto(code).value;
      return `<code class="hljs ${lang}">${highlightedCode}</code>`;
    }
  });
}

function restoreFromChatInfo(chatInfo) {
  topDiv.innerHTML = chatInfo.title;
  chatConfig.title = chatInfo.title;
  chatConfig.userNickname = chatInfo.userNickName;
  chatConfig.aiNickname = chatInfo.aiNickname;
  chatConfig.characteristic = chatInfo.prompt.content;
  chatConfig.memory = parseInt(chatInfo.memory);

  messageHistory = [chatInfo.prompt];
  messageHistory.push(...chatInfo.messages);

  restoreMessageList(messageHistory.slice(1));
  localStorage.setItem('chat', JSON.stringify(chatInfo));

  // Restore config panel
  configTitle.value = chatConfig.title;
  configUserNickname.value = chatConfig.userNickname;
  configAINickname.value = chatConfig.aiNickname;
  configMemoryCount.value = chatConfig.memory;
  configUserNickname.value = chatConfig.userNickname;
  configAINickname.value = chatConfig.aiNickname;
  let matched = false;
  if(messageHistory.length > 0 && messageHistory[0].role == 'system') {
    characteristics.forEach((c, i) => {
      if(c.prompt == messageHistory[0].content) {
        selectedIndexBackup = i;
        characteristicSelect.options[i].selected = true;
        characteristicTextarea.value = characteristics[i].prompt;
        matched = true;
      }
    })
    if(!matched) {
      characteristicSelect.value = 2;
      characteristicTextarea.value = messageHistory[0].content;
    }
  }
}

function restoreMessageList(messageList) {
  while (messageUl.firstChild) {
    messageUl.removeChild(messageUl.firstChild);
  }
  messageList.forEach(message => {
    insertMessage(message, "restored");
  });
}

function messageHistoryToChatObj(history) {
  return {
    "title": topDiv.innerHTML,
    "userNickName": chatConfig.userNickname,
    "aiNickname": chatConfig.aiNickname,
    "prompt": history[0],
    "messages": history.slice(1),
    "memory": chatConfig.memory
  }
}

function saveChat(chat, filename) {
  var blob = new Blob([JSON.stringify(chat)], { type: 'text/plain;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

clearBtn.addEventListener("click", function () {
  messageHistory = [messageHistory[0]];
  restoreFromChatInfo(messageHistoryToChatObj(messageHistory));
})

saveBtn.addEventListener("click", function () {
  let chat = messageHistoryToChatObj(messageHistory);
  saveChat(chat, `${chat.title}.json`);
})

loadBtn.addEventListener("click", function () {
  loadChat(res => {
    if (!res) return;
    restoreFromChatInfo(JSON.parse(res));
    messageList.scrollTop = messageList.scrollHeight;
    //saveChatToServer();
  });
})

function loadChat(result) {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const fileData = reader.result; // The file content in a string variable
      result(fileData);
    };
  };
  input.click();
}

function saveChatToServer() {
  let chat = messageHistoryToChatObj(messageHistory)
  fetch(serverSaveRoute, {
    method: 'POST',
    body: JSON.stringify({ username: "Sunwish", chat: chat }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .catch(error => console.error(error))
}

// 聊天配置
// 获取配置框元素和按钮元素
const configBtn = document.getElementById('config-btn');
const configBox = document.getElementById('configBox');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');

characteristics.forEach((situation, i) => {
  const optionElement = document.createElement('option');
  optionElement.value = i;
  optionElement.textContent = situation.name;
  characteristicSelect.appendChild(optionElement);
});

characteristicTextarea.value = characteristics[0].prompt;
// 点击配置按钮
var selectedIndexBackup = 0;
configBtn.addEventListener('click', (e) => {
  // 显示配置框
  configBox.style.display = 'block';
});
// 情况选项变化时更新描述文本框的值
characteristicSelect.addEventListener('change', (e) => {
  const selectedValue = e.target.value;
  characteristicTextarea.value = characteristics[selectedValue].prompt;
  configMemoryCount.value = characteristics[selectedValue].memory;
  characteristicTextarea.disabled = !(characteristics[e.target.value].prompt == '');
});
// 点击确认按钮
confirmBtn.addEventListener('click', (e) => {
  // 获取输入框和描述文本框的值
  const title = configTitle.value;
  const userNickname = configUserNickname.value;
  const aiNickname = configAINickname.value;
  const memoryCount = configMemoryCount.value;
  const characteristicDescription = characteristicTextarea.value;
  let userNicknameChanged = userNickname != chatConfig.userNickname;
  let aiNicknameChanged = aiNickname != chatConfig.aiNickname;
  // 修改聊天标题、昵称和AI设定
  topDiv.innerHTML = title;
  chatConfig.title = title;
  chatConfig.userNickname = userNickname;
  chatConfig.aiNickname = aiNickname;
  chatConfig.memory = parseInt(memoryCount);
  if(0 == messageHistory.length) { messageHistory.push({content: ""}); }
  if(messageHistory[0].content != characteristicDescription) {
    // 修改了AI设定，重制聊天记录
    messageHistory = [{
      role: 'system',
      content: characteristicDescription
    }];
    selectedIndexBackup = characteristicSelect.selectedIndex;
    chatConfig.characteristic = characteristicDescription;
    restoreFromChatInfo(messageHistoryToChatObj(messageHistory));
  }
  if(userNicknameChanged){
    for(element of messageList.getElementsByClassName('nickname user')) {
      element.innerHTML = userNickname;
    }
  }
  if(aiNicknameChanged){
    for(element of messageList.getElementsByClassName('nickname assistant')) {
      element.innerHTML = aiNickname;
    }
  }
  // 隐藏配置框
  configBox.style.display = 'none';
});
// 点击取消按钮
cancelBtn.addEventListener('click', (e) => {
  // 隐藏配置框
  configBox.style.display = 'none';
  // 恢复面板值
  configTitle.value = chatConfig.title;
  configUserNickname.value = chatConfig.userNickname;
  configAINickname.value = chatConfig.aiNickname;
  configMemoryCount.value = parseInt(chatConfig.memory);
  characteristicTextarea.value = chatConfig.characteristic;
  characteristicSelect.options[selectedIndexBackup].selected = true;
});