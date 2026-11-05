const fs = require('fs');

async function generateWithModel(modelName, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  return await response.json();
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("找不到 GEMINI_API_KEY");
    process.exit(1);
  }

  const prompt = `
  請隨機選出 5 個實用的生活日文單字（難度約 N4~N3），並生成標準 JSON 格式。
  絕對不要加入任何 Markdown 標記（不要加 \`\`\`json 或 \`\`\`），只要單純的 JSON 陣列。
  格式規範：
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

  // 設定備援模型清單：若第一個塞車，會依序嘗試下一個
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ];

  let successData = null;

  for (const model of candidateModels) {
    console.log(`嘗試使用模型：${model} ...`);
    try {
      const data = await generateWithModel(model, apiKey, prompt);

      if (data.error) {
        console.warn(`模型 ${model} 回報錯誤 (${data.error.code})：${data.error.message}`);
        continue; // 嘗試下一個模型
      }

      if (data.candidates && data.candidates[0]) {
        let rawText = data.candidates[0].content.parts[0].text.trim();
        if (rawText.startsWith("```json")) {
          rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (rawText.startsWith("```")) {
          rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
        }
        successData = JSON.parse(rawText);
        console.log(`成功透過 ${model} 生成今日單字！`);
        break;
      }
    } catch (e) {
      console.warn(`模型 ${model} 呼叫失敗，切換下一組...`);
    }
  }

  if (!successData) {
    console.error("所有備援模型皆忙線或失敗，請稍後再試。");
    process.exit(1);
  }

  fs.writeFileSync('today.json', JSON.stringify(successData, null, 2), 'utf-8');
  console.log("已順利存入 today.json！");
}

run().catch(err => {
  console.error("執行異常：", err);
  process.exit(1);
});
