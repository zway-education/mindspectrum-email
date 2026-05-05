# 覺知心智光譜 — 報告 Email 表單

> 家長填寫資料 → 自動寄送專屬光譜分析說明 PDF → 引導下一步測評
>
> 台灣展威文化教育公司　|　Mind Spectrum Parent Form

[![Live Demo](https://img.shields.io/badge/demo-live-22C55E?style=for-the-badge)](https://zway-education.github.io/mindspectrum-email/)
[![Version](https://img.shields.io/badge/version-v1.07-6366F1?style=for-the-badge)]()
[![License](https://img.shields.io/badge/use-internal-94A3B8?style=for-the-badge)]()

🌐 **Live Demo：** <https://zway-education.github.io/mindspectrum-email/>

---

## 專案介紹

這是「覺知心智光譜」測評系統的**報告領取端點**。當家長無法現場做完整測驗、或是希望先取得分析說明時，可以填寫此表單，系統會：

1. 把資料寫入 Google Sheet（管理用）
2. 寄出含 **PDF 附件**的專屬光譜分析說明信
3. 引導使用者進行**完整心智光譜測驗**

整個系統採「**前端表單（GitHub Pages）+ 後端 Apps Script + Google Sheet 資料庫**」的零成本架構。

---

## 進階版功能 (v1.07)

### 🎨 前端 (`index.html`)

- 🔒 **資安**：honeypot 機器人陷阱 + 姓名 sanitizeHTML 防 XSS + 手機自動過濾非數字
- 📊 **完整資料收集**：姓名 / Email / 手機 / 孩子年齡層 / 縣市 / 就讀學校 / 來源管道（多選）
- 🎯 **必填驗證**：每欄即時錯誤提示，提交時整列 highlight
- 🎬 **流暢動畫**：載入動畫、表單進場、按鈕回饋、成功頁淡入
- 🔁 **下一步引導**：成功頁顯示「開始做心智光譜測驗」CTA，導向完整測驗

### ⚙️ 後端 (`Code.gs`)

- 📨 **HTML Email**：紫漸層 hero header、品牌色票條、資料卡片、CTA 區塊
- 📎 **PDF 附件**：自動讀取 Drive 檔案附在信件中
- 📋 **試算表自動修復**：`ensureHeaders_()` 偵測並自動補齊缺漏標題列
- 🔧 **內建診斷工具**：
    - `testAttachment()` — 檢查 PDF 是否可讀取
    - `testSendEmail()` — 整套寄信流程測試
    - `forceResetHeaders()` — 緊急重置標題列
    - `migrateSheet()` — 一鍵升級舊試算表
- 🛡️ **錯誤隔離**：附件讀取失敗不會讓寄信整個失敗，並記錄詳細日誌

### 📧 確認信內容

寄出的 HTML email 包含：
- 紫漸層 Hero Header（覺知心智光譜 · MIND SPECTRUM · 家長端）
- 個人化問候 + PDF 附件提示
- 「您的填寫資料」資訊卡（年齡層 / 縣市 / 學校 / 了解管道）
- ⭐ **「家長眼裡的孩子」進階測評 CTA 區塊**
- 注意事項 + Footer

---

## 技術架構

```
┌─────────────────┐    GET    ┌──────────────────┐
│  GitHub Pages   │ ────────► │  Apps Script     │
│  (index.html)   │           │  (doGet)         │
└─────────────────┘           └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Google Sheet    │   ← 資料寫入
                              │  (報名資料)      │
                              └──────────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  GmailApp        │   ← 寄送 HTML email
                              │  + DriveApp PDF  │       含 PDF 附件
                              └──────────────────┘
```

| 層級 | 技術 |
|---|---|
| 前端 | 純 HTML / CSS / vanilla JS（無 framework）|
| 部署 | GitHub Pages |
| 後端 | Google Apps Script |
| 資料庫 | Google Sheet |
| 寄信 | GmailApp |
| 附件 | DriveApp + PDF |

---

## 檔案結構

```
心智光譜報告email/
├── index.html                              # 前端表單（部署到 GitHub Pages）
├── Code.gs                                 # Apps Script 後端程式碼
├── email-template.html                     # 確認信 HTML 預覽（供設計討論）
├── 台灣展威_覺知心智光譜測評說明.pdf       # PDF 附件原檔
├── README.md                               # 本檔
├── .gitignore                              # git 忽略規則
├── manual_push.bat                ⭐       # 雙擊一鍵 push
├── auto_push.ps1                  ⭐       # PowerShell 推送腳本
└── .github/
    └── workflows/
        └── deploy.yml                      # GitHub Actions 自動部署
```

---

## ⚡ 一鍵部署（雙擊 .bat）

**最簡單的部署方式：雙擊 `manual_push.bat`**

整個流程：
```
雙擊 manual_push.bat
   ↓
auto_push.ps1 自動執行
   ↓
git add . → git commit -m "auto-push: <timestamp>" → git push
   ↓
推到 GitHub
   ↓
GitHub Actions 自動部署到 GitHub Pages
   ↓
30 秒~1 分鐘後網站更新
```

執行紀錄會寫到 `push_log.txt`（已加入 `.gitignore` 不會被 push）。

**前置條件（一次性設定）：**
1. 安裝 [Git for Windows](https://git-scm.com/download/win)
2. 在 repo 資料夾跑一次：
   ```
   git config user.name "您的 GitHub 帳號"
   git config user.email "您的 Email"
   ```
3. 設定 GitHub 認證（SSH key 或 Personal Access Token），確保 push 不需要每次輸入密碼

---

## 部署步驟

### 一、Apps Script 後端

1. 開啟 [Google Sheet](https://docs.google.com/spreadsheets/d/1KAiKN00S2bnIwYz_WtTE3jCaD-WGQy51ogmA3N_jlQk/edit)
2. **擴充功能 → Apps Script**
3. 將 `Code.gs` 整份貼進去 → 儲存
4. **部署 → 新增部署作業 → 網頁應用程式**
   - 執行身分：**我**
   - 誰可以存取：**所有人**
5. 複製產生的 Web App URL

### 二、前端 GitHub Pages

1. 把 Web App URL 填入 `index.html` 第 605 行的 `APPS_SCRIPT_URL`
2. `git push` 到 GitHub
3. GitHub Actions 會自動部署（見下方 GitHub Actions 設定）

### 三、初次設定

部署完成後，到 Apps Script 編輯器執行一次：
- `migrateSheet()` — 建立或補齊試算表標題列
- `testAttachment()` — 確認 PDF 可正常讀取
- `testSendEmail()` — 寄一封測試信到自己信箱驗證

---

## 設定變數說明

`Code.gs` 開頭的設定區：

```javascript
const SPREADSHEET_ID    = '1KAiKN00S...';                 // Google Sheet ID
const SHEET_GID         = 300585538;                       // 目標分頁 gid
const SHEET_NAME        = '報名資料';                      // 分頁名稱
const SENDER_NAME       = '心智光譜測驗';                  // 寄件者顯示名稱
const EMAIL_SUBJECT     = '【心智光譜】您的光譜分析說明已寄出 ✉️';
const ATTACHMENT_FILE_ID = '1CtK9TWetCekkbo1...';         // PDF 檔案 ID
const PARENT_SEES_CHILD_URL = 'https://lin.ee/nnDYAZE';   // 進階測評 CTA URL
```

---

## 版本紀錄

| 版本 | 重點 |
|------|------|
| **v1.07** | 移除表單頂部 CTA，僅在成功頁顯示心智光譜測驗按鈕 |
| **v1.06** | 加入「開始做心智光譜測驗」按鈕（hero & success page） |
| **v1.05** | 切換到全新部署 URL（`AKfycbwOVVhS2n2...`）|
| **v1.04** | 新增「就讀學校」欄位 + PDF 附件除錯日誌強化 |
| **v1.03** | 加入「家長眼裡的孩子」進階測評 CTA + PDF 附件 + ensureHeaders_ 自動修復 |
| **v1.02** | 風控（honeypot + sanitize）+ 來源管道多選 |
| **v1.01** | 基礎雛型 |

---

## 常用網址

- 🌐 表單：<https://zway-education.github.io/mindspectrum-email/>
- 📊 資料試算表：<https://docs.google.com/spreadsheets/d/1KAiKN00S2bnIwYz_WtTE3jCaD-WGQy51ogmA3N_jlQk/edit>
- 📝 主問卷：<https://sites.google.com/view/zwaymindspectrum2026>
- 💬 LINE：<https://lin.ee/nnDYAZE>

---

## 授權

內部使用。© 2026 台灣展威文化教育公司
