const fs = require('fs');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
  }

  const prompt = `
  請隨機選出 5 個實用的日文生活單字（難度約 N4~N3），並生成標準 JSON 格式。
  不得輸出任何 Markdown 標籤或額外文字，只輸出合法 JSON 陣列。
  格式規範如下：
  [
    {
      "word": "漢字或單字本體",
      "kana": "假名標音",
      "meaning": "中文意思",
      "exampleJa": "日文例句",
      "exampleZh": "例句中文翻譯",
      "dialogue": [
        { "speaker": "A", "ja": "角色A日文", "zh": "中文翻譯" },
        { "speaker": "B", "ja": "角色B日文", "zh": "中文翻譯" }
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
  const rawText = data.candidates[0].content.parts[0].text;
  
  // 驗證是否為有效 JSON 並存檔
  const parsedData = JSON.parse(rawText);
  fs.writeFileSync('today.json', JSON.stringify(parsedData, null, 2), 'utf-8');
  console.log("Successfully generated today.json");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
