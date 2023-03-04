const messageList = document.getElementById ("message-list");
const messageUl = document.getElementById("message-ul");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const OPENAI_API_KEY = ""; // Replace with your OpenAI API key
let totalTokenCost = 0;
let messageHistory = [];

sendBtn.addEventListener("click", function() {
  const message = messageInput.value;
  const nickname = "Sunwish"; // Replace with actual nickname
  const datetime = new Date().toLocaleString();

  if (message.trim() !== "") {
    const userMessage = { role: "user", content: message };
    messageHistory.push(userMessage);

    const userLi = document.createElement("li");
    userLi.classList.add("message");
    userLi.innerHTML = `<span class="nickname">${nickname}</span> <span class="datetime">${datetime}</span><br>${message}`;
    messageUl.appendChild(userLi);

    // Show loading spinner
    const loadingLi = document.createElement("li");
    loadingLi.classList.add("message", "loading");
    loadingLi.innerHTML = `<div class="spinner"></div>`;
    messageUl.appendChild(loadingLi);

    messageList.scrollTop = messageList.scrollHeight;

    const data = {
      model: "gpt-3.5-turbo",
      messages: messageHistory,
      max_tokens: 200
    };

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        // Remove loading spinner
        messageUl.removeChild(loadingLi);

        const aiMessage = data.choices[0].message.content.trim();
        const aiMessageObj = { role: "assistant", content: aiMessage };
        messageHistory.push(aiMessageObj);

        const aiLi = document.createElement("li");
        totalTokenCost += data.usage.total_tokens
        let totalMoneyCost = 0.002 * 7 / 1000 * totalTokenCost
        aiLi.classList.add("message");
        aiLi.innerHTML = `<span class="nickname">AI</span> <span class="datetime">${new Date().toLocaleString()}</span> <span class="tokencost"> (consumed totally: ${totalTokenCost} tokens | ${totalMoneyCost} ¥)</span><br>${aiMessage}`;
        messageUl.appendChild(aiLi);

        // Scroll to the bottom of the message list
        messageList.scrollTop = messageList.scrollHeight;
      })
      .catch(error => {
        console.error(error);
        // Remove loading spinner
        messageUl.removeChild(loadingLi);
      });

    messageInput.value = "";
    messageInput.focus();
  }
});

messageInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    sendBtn.click();
  }
});

window.onload = function() {
    document.documentElement.style.setProperty('--message-input-height', messageInput.clientHeight + 'px');
};