async function checkAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("找不到 GEMINI_API_KEY");
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error("查詢錯誤：", JSON.stringify(data.error, null, 2));
      process.exit(1);
    }

    console.log("=== 你的金鑰可以使用的模型清單 ===");
    if (data.models && data.models.length > 0) {
      data.models.forEach(m => {
        console.log(`- 名稱: ${m.name} | 支援方法: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log("此專案目前沒有可用模型，請檢查 Google AI Studio 權限。");
    }
  } catch (err) {
    console.error("連線異常：", err);
    process.exit(1);
  }
}

checkAvailableModels();
