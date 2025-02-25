// 生成简单的Hash Key
function generateHashKey(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // 转换为32位整数
    }
    return 'id_' + Math.abs(hash);
}

document.getElementById('syncBtn').addEventListener('click', () => {
  const comment = document.getElementById('comment').value;
  
  // 使用 chrome.tabs API 获取当前标签页信息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    let pageTitle = activeTab.title;
    let uniqueId = generateHashKey(activeTab.title);
    const pageUrl = activeTab.url;


    chrome.tabs.sendMessage(tabs[0].id, {action: 'extractTitle'}, (extractTitleResponse) => {
      if (extractTitleResponse && extractTitleResponse.title_with_num) {

        // Get the extracted difficulty from storage
        chrome.storage.local.get(["difficulty"], (result) => {
            const difficulty = result.difficulty || "Unknown";
            const notionTitle = extractTitleResponse.title_with_num || pageTitle

            // 获取几刷状态
            const practiceStatusSelect = document.getElementById('practiceStatus');
            let practiceStatus = practiceStatusSelect.value; // 空表示不更新

            // 获取熟练度状态
            const proficiencySelect = document.getElementById('proficiency');
            const proficiency = proficiencySelect.value; // 空表示不更新

            // Send data to background.js
            const data = {
                uniqueId: uniqueId,
                title: notionTitle,
                url: pageUrl,
                difficulty: difficulty, // Now including difficulty
                note: comment,
                practiceStatus: practiceStatus,
                proficiency: proficiency
            };

          // 发送消息到 background 脚本进行 Notion API 请求
          chrome.runtime.sendMessage({ action: 'syncToNotion', data: data }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Chrome Extension Error:", chrome.runtime.lastError.message);
              alert("扩展程序发生错误，请检查控制台！");
              return;
            }

            if (!response) {
              console.error("未收到来自 background.js 的响应");
              alert("同步失败：未收到响应，请检查 background.js 日志");
              return;
            }

            if (response.status === 'success' || response.status === 'updated' || response.status === 'created') {
              alert('✅ 同步成功！');
            } else {
              console.error("Notion API 错误:", response.error);
              alert(`❌ 同步失败: ${response.error.message || "未知错误"}`);
            }
          });
        });

      } else {
        alert('❗为抓取到题目名字。');
      }
    });

  });
});

document.getElementById('syncCodeBtn').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const activeTab = tabs[0];
    let pageTitle = activeTab.title;
    let uniqueId = generateHashKey(activeTab.title);

    chrome.tabs.sendMessage(tabs[0].id, {action: 'fetchCodeImplementation'}, (response) => {
      if (response && response.codeImplementation) {
        chrome.runtime.sendMessage({
          action: 'syncCodeToNotion',
          data: { uniqueId: uniqueId, code: response.codeImplementation }
        }, (res) => {
          if (res?.status === 'success') {
            alert('✅ 代码实现同步成功！');
          } else {
            alert('❌ 代码实现同步失败，请检查控制台日志。');
          }
        });
      } else {
        alert('❗未抓取到代码实现，请确保页面内容正确。');
      }
    });
  });
});