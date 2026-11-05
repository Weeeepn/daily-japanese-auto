const fs = require('fs');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("錯誤：找不到 GEMINI_API_KEY 環境變數！");
    process.exit(1);
  }

  const prompt = `
  請隨機選出 5 個實用的生活日文單字（難度約 N4~N3），並生成標準 JSON 格式。
  絕對不要加入任何 Markdown 標籤（不要加 \`\`\`json 或 \`\`\`），只要單純的 JSON 陣列字串。
  格式如下：
  [
    {
      "word": "散歩",
      "kana": "さんぽ",
      "meaning": "散步",
      "exampleJa": "朝の公園を散歩します。",
      "exampleZh": "在早晨的公園散步。",
      "dialogue": [
        { "speaker": "A", "ja": "一緒に散歩しませんか？", "zh": "要不要一起去散步？" },
        { "speaker": "B", "ja": "いいですね、行きましょう！", "zh": "好啊，走吧！" }
      ]
    }
  ]
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  const data = await response.json();

  // 如果 API 報錯，將詳細訊息印出來
  if (data.error) {
    console.error("Gemini API 回傳錯誤：", JSON.stringify(data.error, null, 2));
    process.exit(1);
  }

  if (!data.candidates || !data.candidates[0]) {
    console.error("未能取得候選內容，API 回傳結果為：", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const rawText = data.candidates[0].content.parts[0].text;
  
  // 驗證是否為合法 JSON
  const parsedData = JSON.parse(rawText);
  fs.writeFileSync('today.json', JSON.stringify(parsedData, null, 2), 'utf-8');
  console.log("今日單字生成成功！已儲存至 today.json");
}

run().catch(err => {
  console.error("執行過程發生異常：", err);
  process.exit(1);
});
