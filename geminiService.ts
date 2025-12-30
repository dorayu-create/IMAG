
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export interface ImageInput {
  base64: string;
  mimeType: string;
}

export async function extractTableFromImages(images: ImageInput[], uploadDate: string): Promise<string> {
  // 使用 gemini-3-pro-preview 以獲得最高精確度，處理複雜表格邏輯
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
你是一位專業的資料錄入專家，請精確辨識圖片中的所有表格內容。
請務必遵守以下「絕對規則」，嚴格轉換為 16 個欄位的 Markdown 表格：

### 欄位順序與內容邏輯 (嚴格遵守)：
1. **專案編號**：精確辨識，如 IM250XXX。
2. **專案名稱**：提取完整的活動或維護名稱，不可遺漏文字。
3. **統一編號**：客戶 8 位數統編。
4. **客戶名稱**：完整的公司全稱。
5. **案源**：此欄位一律固定填寫「直客」。
6. **部門**：此欄位一律固定填寫「IMAG」。
7. **9/1新部門**：此欄位一律固定填寫「IMAG」。
8. **專案類型**：此欄位一律固定填寫「專案」。
9. **預估工時**：此欄位一律固定填寫「NA」。
10. **專案簽立**：格式 YYYY-MM-DD。若圖中無此資訊，請填寫今日日期：${uploadDate}。
11. **起**：提取專案開始日期，格式 YYYY-MM-DD。
12. **迄**：提取專案結束日期，格式 YYYY-MM-DD。
13. **期數**：提取期數資訊、收款階段或相關備註。
14. **收款條件**：提取合約中標註的收款方式。
15. **委刊總金額(未稅)**：保留幣別符號與數值中的逗號（,）。
16. **委刊總金額含稅**：保留幣別符號與數值中的逗號（,）。

### 輸出品質要求：
- **一致性**：表格每一行必須具備完全相同的 16 個欄位，結構不可錯位。
- **精確度**：對數字、編號、日期進行多重核對，確保與原圖完全一致。
- **合併處理**：若有多張圖片或跨頁資料，請將所有記錄合併至同一個表格。
- **缺失處理**：若原圖中某個動態欄位資訊缺失，請填寫「-」。
- **純淨輸出**：只輸出 Markdown Table 代碼，不需任何前言、說明或結論文字。
`;

  try {
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64.split(',')[1] || img.base64,
      }
    }));

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        // 開啟思考模式以確保複雜邏輯處理正確
        thinkingConfig: { thinkingBudget: 8192 }
      }
    });

    const result = response.text;
    if (!result) {
      throw new Error("未能從圖片中提取到表格數據，請確保圖片文字清晰。");
    }
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
