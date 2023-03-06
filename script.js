const topDiv = document.getElementById("top");
const messageList = document.getElementById("message-list");
const messageUl = document.getElementById("message-ul");
const messageInput = document.getElementById("message-input");
const apiKeyInput = document.getElementById("api-key-input");
const sendBtn = document.getElementById("send-btn");
const saveBtn = document.getElementById("save-btn");
const loadBtn = document.getElementById("load-btn");
const nickname = "Sunwish"; // Replace with actual nickname
const AIName = "AI"; //Relace with AI's nickname
var chatConfig = {
  title: "test",
  memory: 10
};
let totalTokenCost = 0;
let messageHistory = [];

const serverUrl = "http://localhost:5050"
const serverChatRoute = "/chat"
const serverSaveRoute = "/save"

window.onresize = function() {
  const container = document.querySelector('.container');
  container.style.height = window.innerHeight + 'px';
}

window.onload = async function () {
  const container = document.querySelector('.container');
  container.style.height = window.innerHeight + 'px';

  // Get messageInput height for calc messageList height
  document.documentElement.style.setProperty('--message-input-height', messageInput.clientHeight + 'px');
  messageInput.focus();

  // Load key from cookie
  apiKeyInput.value = getCookie('key');

  // Get config and restore message history
  let chat;
  try {
    const url = new URL(serverUrl + serverChatRoute);
    url.searchParams.set('username', nickname);
    url.searchParams.set('title', chatConfig.title);
    chat = await fetch(url.pathname + url.search)
      .then(response => response.json())
      .then(json => json);
  } catch (error) {
    console.log(error)
  }

  if (chat) {
    chatConfig.memory = chat.memory;
    if (!chatConfig.memory) { chatConfig.memory = 10; }
    topDiv.innerHTML = chat.title
    restoreMessageHistory(chat);
  } else {
    insertMessage({ role: "system", content: "非服务端模式或连接服务器失败，聊天内容将不会自动保存，保存聊天记录需手动点击保存按钮 。" })
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
      requestMessages = [messageHistory[0], ...messageHistory.slice(messageHistory.length - chatConfig.memory)]
    }
    console.log(requestMessages)
    const data = {
      model: "gpt-3.5-turbo",
      messages: requestMessages,
      max_tokens: 500
    };

    let key = apiKeyInput.value;
    fetch("https://api.openai.com/v1/chat/completions", {
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

        document.cookie = `key=${key};`;

        // Remove loading spinner
        messageUl.removeChild(loadingLi);

        const aiMessage = data.choices[0].message.content.trim();
        const aiMessageObj = { role: "assistant", content: aiMessage };
        messageHistory.push(aiMessageObj);

        totalTokenCost += data.usage.total_tokens
        insertMessage(aiMessageObj)

        // Scroll to the bottom of the message list
        messageList.scrollTop = messageList.scrollHeight;

        saveChatToServer();
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
      insertLi.innerHTML = `<span class="nickname">${nickname}</span> <span class="datetime">${datetime}</span><br>${messageHTML}`;
      break;
    case "assistant":
      let totalMoneyCost = 0.002 * 7 / 1000 * totalTokenCost
      insertLi.innerHTML = `<span class="nickname">${AIName}</span> <span class="datetime">${datetime}</span> <span class="tokencost"> (consumed totally: ${totalTokenCost} tokens | ${totalMoneyCost} ¥)</span><br>${messageHTML}`;
      break;
    case "system":
      insertLi.innerHTML = `<span class="nickname">System</span> <span class="datetime">${datetime}</span><br>${messageHTML}`;
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

function restoreMessageHistory(chatInfo) {
  messageHistory = [chatInfo.prompt];
  messageHistory.push(...chatInfo.messages);
  restoreMessageList(messageHistory.slice(0));
  topDiv.innerHTML = chatInfo.title;
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
    "prompt": history[0],
    "messages": history.slice(1),
    "memory": 10
  }
}

function getCookie(name) {
  var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
  if (arr = document.cookie.match(reg)) {
    return decodeURI(arr[2]);
  } else {
    return null;
  }
}

function saveChat(chat, filename) {
  var blob = new Blob([JSON.stringify(chat)], { type: 'text/plain;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

saveBtn.addEventListener("click", function () {
  let chat = messageHistoryToChatObj(messageHistory);
  saveChat(chat, `${chat.title}.json`);
})

loadBtn.addEventListener("click", function () {
  loadChat(res => {
    if (!res) return;
    restoreMessageHistory(JSON.parse(res));
    messageList.scrollTop = messageList.scrollHeight;
    saveChatToServer();
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