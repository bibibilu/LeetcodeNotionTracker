chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCodeImplementation') {
    const codeElement = document.querySelector('div.px-4.py-3 pre code');

    if (codeElement) {
      const codeImplementation = codeElement.innerText.trim();
      sendResponse({ codeImplementation });
    } else {
      sendResponse({ codeImplementation: "" });
    }
  }

  if (request.action === 'extractTitle') {
    const element = document.querySelector('.whitespace-normal');

    if (element) {
      const titleText = element.textContent.trim();
      console.log(`✅ Found extractTitle:`, titleText);

      sendResponse({ title_with_num: titleText });
    } else {
      sendResponse({ title_with_num: "" });
    }
  }
});


function waitForContent(retries = 100, delay = 500) {
    let attempt = 0;

    function extractContent(selector, actionType, key, defaultValue) {
        let element = document.querySelector(selector);
        
        if (element) {
            let text = element.textContent.trim();
            console.log(`✅ Found ${actionType}:`, text);
            chrome.runtime.sendMessage(
                { action: actionType, [key]: text },
                () => chrome.runtime.lastError && console.warn(`❗ No response needed for ${actionType}`)
            );
        } else {
            attempt++;
            console.warn(`❗ Attempt ${attempt}: No ${actionType} found. Retrying...`);

            if (attempt < retries) {
                setTimeout(() => extractContent(selector, actionType, defaultValue), delay);
            } else {
                console.error(`❌ Failed to find ${actionType} after multiple attempts.`);
                chrome.runtime.sendMessage(
                    { action: actionType, [key]: defaultValue },
                    () => chrome.runtime.lastError && console.warn(`❗ No response needed for ${actionType}`)
                );
            }
        }
    }

    extractContent(".text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard", "extractDifficulty", "difficulty", "Unknown");
    // extractContent(".whitespace-normal", "extractTitle", "title_with_num", "Unknown");
}

const observer = new MutationObserver(() => {
  console.log('🔄 DOM发生变化，重新提取内容...');
  waitForContent(); // 重新调用你的提取函数
});

// 监听body节点内子元素变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});

waitForContent();

