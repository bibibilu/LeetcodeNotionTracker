const notionToken = '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';
const databaseId = '1a3c32937f2180c2b6ffe803442b7217';
const notionUrl = 'https://api.notion.com/v1/pages';
const notionVersion = '2022-06-28';

// 状态更新辅助函数
function getNextPracticeStatus(currentStatus) {
  const mapping = {
    "一刷": "二刷",
    "二刷": "三刷",
    "三刷": "四刷",
    "四刷": "四刷",
  };
  return mapping[currentStatus] || "一刷";
}

function getLocalDateString() {
    const today = new Date();
    return today.getFullYear() + '-' 
         + String(today.getMonth() + 1).padStart(2, '0') + '-' 
         + String(today.getDate()).padStart(2, '0');
}

async function queryNotionEntry(uniqueId) {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': notionVersion,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter: {
                property: "UniqueId",
                rich_text: { equals: uniqueId }
            }
        })
    });

    const data = await response.json();
    return data.results[0] || null;
}

async function updateNotionEntry(pageId, newNote, practiceStatus, proficiency) {
    const pageUrl = `https://api.notion.com/v1/pages/${pageId}`;
    
    // Fetch existing notes to append new note
    const existingEntryResponse = await fetch(pageUrl, {
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': notionVersion
        }
    });

    const existingData = await existingEntryResponse.json();
    let existingNotes = "";
    if (existingData.properties.Notes?.rich_text?.length > 0) {
        existingNotes = existingData.properties.Notes.rich_text[0].text.content + "\n";
    }

    const updatedNotes = existingNotes + newNote;

    const properties = {
        Notes: { rich_text: [{ type: "text", text: { content: updatedNotes } }] },
        Date: { date: { start: getLocalDateString() } }
    };

    if (practiceStatus) {
        properties["几刷"] = { status: { name: practiceStatus } };
    }

    if (proficiency) {
        properties["熟练度"] = { select: { name: proficiency } };
    }

    const response = await fetch(pageUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': notionVersion,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties })
    });

    return await response.json();
}

async function appendCodeBlockToPage(pageId, code_content, language = "python") {
    // const blockUrl = `https://api.notion.com/v1/blocks/${pageId}`;
    const blockUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;

    const response = await fetch(blockUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': notionVersion,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            children: [{
                object: 'block',
                type: 'code',
                code: {
                    "caption": [],
                    "rich_text": [{
                        "type": "text",
                        "text": {
                        "content": code_content
                        }
                    }],
                    "language": language
                }
            }]
        })
    });

    return await response.json();
}


async function createNotionEntry({uniqueId, title, url, difficulty, note, practiceStatus, proficiency}) {
    const properties = {
        Name: { title: [{ text: { content: title } }] },
        Link: url ? { url } : undefined,
        Difficulty: difficulty ? { select: { name: difficulty } } : undefined,
        Notes: { rich_text: [{ type: "text", text: { content: note } }] },
        Date: { date: { start: getLocalDateString() } },
        UniqueId: { rich_text: [{ type: "text", text: { content: uniqueId } }] }
    };

    if (practiceStatus) {
        properties["几刷"] = { status: { name: practiceStatus } };
    }

    if (proficiency) {
        properties["熟练度"] = { select: { name: proficiency } };
    }

    const response = await fetch(notionUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Notion-Version': notionVersion,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            parent: { database_id: databaseId },
            properties
        })
    });

    return await response.json();
}

export { queryNotionEntry, updateNotionEntry, createNotionEntry, appendCodeBlockToPage }

