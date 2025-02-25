import { queryNotionEntry, updateNotionEntry, createNotionEntry, appendCodeBlockToPage } from './notion_api.js';


function storeInChrome(key, value) {
  if (chrome.storage?.local) {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error(`❌ Failed to store ${key}:`, chrome.runtime.lastError.message);
      } else {
        console.log(`✅ ${key} stored successfully!`);
      }
    });
  } else {
    console.error("❌ chrome.storage.local unavailable!");
  }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("🔗 Sending data to Notion:", request);

  if (request.action === "extractDifficulty") {
      console.log("📌 Extracted Difficulty:", request.difficulty);

      storeInChrome("difficulty", request.difficulty)

      // ✅ Send an empty response to avoid closing the message port too soon
      sendResponse({});
      return true;  // ✅ Keeps the message port open for async calls
  }

  if (request.action === "extractTitle") {
      console.log("📌 Extracted Title:", request.title_with_num);

      storeInChrome("title_with_num", request.title_with_num)

      // ✅ Send an empty response to avoid closing the message port too soon
      sendResponse({});
      return true;  // ✅ Keeps the message port open for async calls
  }

  if (request.action === 'syncCodeToNotion') {

    chrome.storage.local.get(["title_with_num"], async (result) => {
      const title = result.title_with_num || "未命名";
      const { uniqueId, code } = request.data;

      try {
        const existingPage = await queryNotionEntry(uniqueId);
        if (existingPage && code) {
          const updateResult = await appendCodeBlockToPage(existingPage.id, code, "python"); // 默认Java, 可调整
          console.log('✅ Entry updated successfully:', updateResult);
          sendResponse({ status: 'success' });
        } else {
          sendResponse({ status: 'error', message: '未找到对应Notion记录或代码为空' });
        }
      } catch (error) {
        console.error('❌ Error syncing code:', error);
        sendResponse({ status: 'error', message: error.message });
      }
    });

    return true;
  }
  
  if (request.action === 'syncToNotion') {
    (async () => {
        const { uniqueId, title, url, difficulty, note, practiceStatus, proficiency, code } = request.data;
        try {
            const existingPage = await queryNotionEntry(uniqueId);

            if (existingPage) {
                console.log("✅ Found existing entry:", existingPage.id);
                const updateResult = await updateNotionEntry(existingPage.id, note, practiceStatus, proficiency);
                console.log('✅ Entry updated successfully:', updateResult);
                sendResponse({ status: 'updated', data: updateResult });
            } else {
                console.log("➕ Creating new Notion entry...");
                const createResult = await createNotionEntry({uniqueId, title, url, difficulty, note, practiceStatus, proficiency});
                console.log('✅ Entry created successfully:', createResult);
                sendResponse({ status: 'created', data: createResult });
            }
        } catch (error) {
            console.error('❌ Notion Sync Error:', error);
            sendResponse({ status: 'error', error: { message: error.message } });
        }
    })();

    return true;  // Keep the async response channel open
  }
});

console.log("Background script running");
