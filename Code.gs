// ════════════════════════════════════════════════════════
//  心智光譜測驗 — Google Apps Script 後端  (v1.05)
//  功能：接收表單資料 → 寫入 Google Sheet → 寄出確認 Email + PDF 附件
//
//  v1.05  全新部署 URL（AKfycbwOVVhS2n2...）對齊 index.html
//  v1.04  新增「就讀學校」欄位 + PDF 附件除錯日誌強化
//  v1.03  深度引導 — 加入「家長眼裡的孩子」進階測評 CTA、PDF 附件、
//                   來源管道欄位、ensureHeaders_ 自動修復損壞標題列
//  v1.02  風控 + 來源管道（同步前端 form v1.03）
//  v1.01  基礎雛型
//
//  【部署步驟】請見檔案底部的說明
// ════════════════════════════════════════════════════════

// ── ⚙️ 設定區（請修改這裡）────────────────────────────
const SPREADSHEET_ID = '1KAiKN00S2bnIwYz_WtTE3jCaD-WGQy51ogmA3N_jlQk'; // Google Sheet ID
const SHEET_GID      = 300585538;          // 目標分頁 gid
const SHEET_NAME     = '報名資料';          // 找不到 gid 時的備用分頁名稱
const SENDER_NAME    = '心智光譜測驗';       // 寄件者顯示名稱
const EMAIL_SUBJECT  = '【心智光譜】您的光譜分析說明已寄出 ✉️';

// PDF 附件檔案 ID（Google Drive 檔案 ID）
//   取得方式：把 PDF 上傳到您的 Google Drive → 右鍵「取得連結」→
//   連結會長得像 https://drive.google.com/file/d/【這段就是 ID】/view → 貼到下方
//   留空字串 '' 則不附加附件
const ATTACHMENT_FILE_ID = '1CtK9TWetCekkbo1dtEB0CTRTVwPQi76r'; // 預設沿用主系統的 PDF；如需改用新版請替換

// 進階測評：「家長眼裡的孩子」測評網址
//   留空字串 '' 則信件不顯示這個 CTA 區塊
//   ※ 目前先暫用 LINE 加好友連結代替；等「家長眼裡的孩子」測評正式上線後替換
const PARENT_SEES_CHILD_URL = 'https://lin.ee/nnDYAZE';

// 確認信內容（HTML 格式）
function buildEmailHtml(name, age, city, school, referral) {
  const ageLabels = {
    '0-3':  '0–3 歲（感官連結期）',
    '4-6':  '4–6 歲（情緒學習期）',
    '7-12': '7–12 歲（自我認同期）',
    'teen': '青少年（自主拉鋸期）',
  };
  const ageLabel = ageLabels[age] || age;
  const schoolLabel = (school || '').toString().trim() || '未填';
  const referralLabel = (referral || '').toString().trim() || '未填';

  // ── 進階測評 CTA：僅在 PARENT_SEES_CHILD_URL 有值時顯示 ──
  const ctaBlock = PARENT_SEES_CHILD_URL ? `
    <div style="border:2px solid #6366F1;border-radius:14px;padding:28px 26px;margin:0 0 26px;background:#fff;">
      <div style="display:inline-block;background:#6366F1;color:#fff;font-size:11px;font-weight:700;padding:5px 11px;border-radius:6px;letter-spacing:1.5px;margin-bottom:14px;">下一步推薦</div>
      <h2 style="font-size:20px;font-weight:900;color:#1E293B;margin:0 0 12px;line-height:1.35;">
        進階測評：<span style="color:#6366F1;">「家長眼裡的孩子」</span>
      </h2>
      <p style="font-size:13.5px;line-height:1.85;color:#475569;margin:0 0 16px;">
        您剛完成的是<strong>「家長端」</strong>光譜 — 看見的是您自己在壓力下的反應底色。<br><br>
        我們邀請您再花 5 分鐘，從家長的視角描繪「您眼中的孩子」是哪一種底色。
        對照兩份報告，您將看見：
      </p>
      <ul style="font-size:13px;color:#475569;line-height:1.95;margin:0 0 22px;padding-left:22px;">
        <li>孩子真正的天賦與底色傾向</li>
        <li>您與孩子互動的慣性與盲點</li>
        <li>下一步教養可調整的具體方向</li>
      </ul>
      <a href="${PARENT_SEES_CHILD_URL}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 30px;border-radius:10px;letter-spacing:1.5px;">
        立即了解更多 →
      </a>
      <p style="font-size:11.5px;color:#94A3B8;margin:14px 0 0;line-height:1.6;">
        ★ 進階測評即將推出，點擊上方按鈕可加入 LINE，第一時間獲得上線通知。
      </p>
    </div>` : '';

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Noto Sans TC',sans-serif;
            max-width:600px;margin:0 auto;padding:0;color:#1E293B;background:#F8FAFC;">

  <!-- ── Hero Header（漸層+品牌條） ── -->
  <div style="background:linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);padding:42px 32px 36px;border-radius:16px 16px 0 0;text-align:center;">
    <div style="height:34px;margin-bottom:18px;text-align:center;">
      <span style="display:inline-block;width:7px;height:18px;background:#EF4444;border-radius:3px;vertical-align:bottom;margin:0 2px;"></span>
      <span style="display:inline-block;width:7px;height:23px;background:#F97316;border-radius:3px;vertical-align:bottom;margin:0 2px;"></span>
      <span style="display:inline-block;width:7px;height:28px;background:#22C55E;border-radius:3px;vertical-align:bottom;margin:0 2px;"></span>
      <span style="display:inline-block;width:7px;height:34px;background:#FFFFFF;border-radius:3px;vertical-align:bottom;margin:0 2px;"></span>
    </div>
    <h1 style="font-size:28px;font-weight:900;color:#fff;margin:0 0 6px;letter-spacing:2px;">覺知心智光譜</h1>
    <p style="font-size:13px;color:rgba(255,255,255,0.85);margin:0;letter-spacing:3px;">MIND SPECTRUM · 家長端</p>
  </div>

  <!-- ── Body ── -->
  <div style="background:#fff;padding:36px 32px 30px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">

    <p style="font-size:18px;font-weight:700;margin:0 0 14px;color:#1E293B;">嗨，${name} 您好！</p>
    <p style="font-size:14.5px;line-height:1.85;color:#475569;margin:0 0 26px;">
      感謝您完成<strong style="color:#6366F1;">「覺知心智光譜」家長端測評</strong>，
      您的專屬光譜分析說明已整理完畢，請見隨信附上的 <strong>PDF 檔</strong>。
    </p>

    <!-- 您的填寫資料 -->
    <div style="background:linear-gradient(135deg,#EEF2FF 0%,#F0FDF4 100%);border-radius:12px;padding:20px 22px;margin-bottom:30px;">
      <p style="font-size:11px;font-weight:700;color:#6366F1;letter-spacing:1.5px;margin:0 0 12px;text-transform:uppercase;">您的填寫資料</p>
      <table style="font-size:13.5px;color:#334155;width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:5px 0;color:#64748B;width:90px;">孩子年齡層</td>
          <td style="padding:5px 0;font-weight:600;">${ageLabel}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#64748B;">就讀縣市</td>
          <td style="padding:5px 0;font-weight:600;">${city}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#64748B;">就讀學校</td>
          <td style="padding:5px 0;font-weight:600;">${schoolLabel}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#64748B;">了解管道</td>
          <td style="padding:5px 0;font-weight:600;">${referralLabel}</td>
        </tr>
      </table>
    </div>

    <!-- 進階測評 CTA -->
    ${ctaBlock}

    <!-- 備註 -->
    <p style="font-size:13px;line-height:1.85;color:#64748B;margin:0 0 6px;">
      ＊ 若您有任何問題，歡迎直接回覆此信聯繫我們
    </p>
    <p style="font-size:13px;line-height:1.85;color:#64748B;margin:0;">
      ＊ 若未收到，請確認是否在垃圾郵件資料夾
    </p>

  </div>

  <!-- ── Footer ── -->
  <div style="background:#F8FAFC;padding:22px 32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px;text-align:center;font-size:12px;color:#94A3B8;line-height:1.7;">
    此為系統自動發送，請勿直接回覆<br>
    覺知心智光譜 &nbsp;|&nbsp; Mind Spectrum
  </div>

</div>
  `;
}
// ──────────────────────────────────────────────────────


// ════════════════════════════════════════════════════════
//  主要處理函數
//  GET 請求進來時執行（前端用 fetch no-cors GET）
// ════════════════════════════════════════════════════════
function doGet(e) {
  try {
    // 防呆：在編輯器手動點 ▶ 執行 doGet 時 e 是 undefined
    if (!e || !e.parameter) {
      return ContentService
        .createTextOutput('API 運作正常。請由表單發送請求，或在網址後加 ?name=xxx&email=xxx... 測試。')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    const params = e.parameter;

    const name     = params.name     || '';
    const email    = params.email    || '';
    const phone    = params.phone    || '';
    const age      = params.age      || '';
    const city     = params.city     || '';
    const school   = params.school   || '';   // v1.04：就讀學校
    const referral = params.referral || '';   // 來源管道（多選以逗號分隔）
    const ts       = params.ts       || new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    // ① 寫入 Google Sheet
    writeToSheet(name, email, phone, age, city, school, referral, ts);

    // ② 寄出確認信
    sendConfirmEmail(name, email, age, city, school, referral);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('doGet error:', err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ════════════════════════════════════════════════════════
//  寫入 Google Sheet
//  v1.11：bug fix — 空白分頁也會自動 bootstrap 8 欄標題列
//  v1.10：新增「來源管道」欄；既有工作表會自動補欄、依當前 header 順序寫入
// ════════════════════════════════════════════════════════
const STANDARD_HEADERS = ['時間戳記', '姓名', 'Email', '手機', '年齡層', '就讀縣市', '就讀學校', '來源管道', '已寄信'];

// 共用：確保分頁有標準 8 欄標題列（給 writeToSheet 與 migrateSheet 共用）
function ensureHeaders_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // 算出標準欄位中有多少已經存在
  const presentCount = STANDARD_HEADERS.filter(h => headerRow.indexOf(h) !== -1).length;
  const isEmpty = (lastCol === 1 && !headerRow[0]);
  const tooBroken = presentCount < 4;  // 少於 4 個標準欄位 → 視為損壞，整列重寫

  // case A：完全空白 OR 標題列嚴重缺漏 → 強制重置整列
  if (isEmpty || tooBroken) {
    // 先清掉第一列既有殘留（內容+格式）
    const clearCol = Math.max(lastCol, STANDARD_HEADERS.length);
    sheet.getRange(1, 1, 1, clearCol).clearContent();
    sheet.getRange(1, 1, 1, clearCol).clearFormat();

    // 寫入標準 8 欄
    sheet.getRange(1, 1, 1, STANDARD_HEADERS.length).setValues([STANDARD_HEADERS]);
    sheet.getRange(1, 1, 1, STANDARD_HEADERS.length)
      .setFontWeight('bold').setBackground('#6366F1').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return;
  }

  // case B：基本欄位都有但缺「來源管道」→ 插到「已寄信」前
  if (headerRow.indexOf('來源管道') === -1) {
    const sentIdx = headerRow.indexOf('已寄信');
    if (sentIdx >= 0) {
      sheet.insertColumnBefore(sentIdx + 1);
      sheet.getRange(1, sentIdx + 1).setValue('來源管道')
        .setFontWeight('bold').setBackground('#6366F1').setFontColor('#ffffff');
    } else {
      const newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue('來源管道')
        .setFontWeight('bold').setBackground('#6366F1').setFontColor('#ffffff');
    }
  }

  // 確保凍結列存在
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
}

// 緊急重置：直接清掉標題列重寫 8 欄（保留資料列；只清第 1 列）
// 用於分頁標題嚴重損壞、不想等 ensureHeaders_ 判斷的場合
function forceResetHeaders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheets().find(s => s.getSheetId() === SHEET_GID) || ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const lastCol = Math.max(sheet.getLastColumn(), STANDARD_HEADERS.length);
  sheet.getRange(1, 1, 1, lastCol).clearContent();
  sheet.getRange(1, 1, 1, lastCol).clearFormat();
  sheet.getRange(1, 1, 1, STANDARD_HEADERS.length).setValues([STANDARD_HEADERS]);
  sheet.getRange(1, 1, 1, STANDARD_HEADERS.length)
    .setFontWeight('bold').setBackground('#6366F1').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  Logger.log('✓ 標題列已強制重置：' + STANDARD_HEADERS.join(' | '));
  return '✓ 重置完成';
}

function writeToSheet(name, email, phone, age, city, school, referral, ts) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 先用 gid 找分頁，找不到再用名稱，都找不到才新建
  let sheet = ss.getSheets().find(s => s.getSheetId() === SHEET_GID) || ss.getSheetByName(SHEET_NAME);

  // 若分頁不存在則自動建立
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // 確保標題列齊全（空白 / 缺欄都會自動補）
  ensureHeaders_(sheet);

  const ageLabels = {
    '0-3':  '0–3 歲',
    '4-6':  '4–6 歲',
    '7-12': '7–12 歲',
    'teen': '青少年',
  };

  // 依目前 header 的順序組裝整列資料（避免欄位錯位）
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowMap = {
    '時間戳記':  ts,
    '姓名':      name,
    'Email':     email,
    '手機':      phone,
    '年齡層':    ageLabels[age] || age,
    '就讀縣市':  city,
    '就讀學校':  school || '',
    '來源管道':  referral || '',
    '已寄信':    '✓'
  };
  const row = headers.map(h => Object.prototype.hasOwnProperty.call(rowMap, h) ? rowMap[h] : '');
  sheet.appendRow(row);
}


// ════════════════════════════════════════════════════════
//  一鍵遷移工具：補齊試算表欄位（手動執行一次即可）
//  使用方式：Apps Script 編輯器 → 上方函式選單選 migrateSheet → 點 ▶ 執行
//  作用：
//    1. 若分頁不存在 → 建立分頁與 8 欄標題列
//    2. 若分頁存在但缺「來源管道」欄 → 自動插入到「已寄信」之前
//    3. 統一所有標題列的格式（粗體、底色、白字）
//    4. 凍結第一列
// ════════════════════════════════════════════════════════
function migrateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheets().find(s => s.getSheetId() === SHEET_GID) || ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    Logger.log('・分頁不存在 → 已新建：' + SHEET_NAME);
  }

  // 統一交給 ensureHeaders_ 處理（空白 / 缺欄 / 凍結列）
  ensureHeaders_(sheet);

  // 統一格式化整列標題
  const finalLastCol = sheet.getLastColumn();
  sheet.getRange(1, 1, 1, finalLastCol)
    .setFontWeight('bold').setBackground('#6366F1').setFontColor('#ffffff');

  const finalHeaders = sheet.getRange(1, 1, 1, finalLastCol).getValues()[0];
  Logger.log('✓ 遷移完成。目前欄位：' + finalHeaders.join(' | '));
  return '✓ 遷移完成 → ' + finalHeaders.join(' | ');
}


// ════════════════════════════════════════════════════════
//  寄出確認信
// ════════════════════════════════════════════════════════
function sendConfirmEmail(name, email, age, city, school, referral) {
  if (!email) return;

  // 寄件選項
  const opts = {
    name:    SENDER_NAME,
    htmlBody: buildEmailHtml(name, age, city, school, referral),
    replyTo: Session.getActiveUser().getEmail()
  };

  // ── 附件：詳細日誌讓我們能在執行紀錄看到真正的失敗原因 ──
  Logger.log('[附件] ATTACHMENT_FILE_ID = ' + (ATTACHMENT_FILE_ID || '(空)'));
  if (ATTACHMENT_FILE_ID) {
    try {
      const file = DriveApp.getFileById(ATTACHMENT_FILE_ID);
      const blob = file.getBlob();
      Logger.log('[附件] ✓ 成功讀取：' + file.getName() + ' (' + Math.round(blob.getBytes().length / 1024) + ' KB)');
      opts.attachments = [blob];
    } catch (err) {
      // 附件抓不到不要讓寄信整個失敗，但要把錯誤完整記下
      Logger.log('[附件] ✗ 讀取失敗：' + err.toString());
      console.error('附件讀取失敗 (' + ATTACHMENT_FILE_ID + ')：' + err.toString());
    }
  } else {
    Logger.log('[附件] 略過（ATTACHMENT_FILE_ID 為空）');
  }

  try {
    GmailApp.sendEmail(
      email,
      EMAIL_SUBJECT,
      // 純文字版（備用）
      `嗨 ${name}，感謝您完成心智光譜測驗！您的光譜說明已整理好，我們將盡快提供給您。`,
      opts
    );
    Logger.log('[寄信] ✓ 已寄出至 ' + email + '（含附件：' + (opts.attachments ? '是' : '否') + '）');
  } catch (err) {
    Logger.log('[寄信] ✗ 寄送失敗：' + err.toString());
    throw err;
  }
}

// ════════════════════════════════════════════════════════
//  整套寄信流程測試（含附件）— 直接從編輯器跑
//  使用方式：
//    1. 把下方 TEST_EMAIL 改成您能收信的信箱
//    2. 函式選單選 testSendEmail → ▶ 執行
//    3. 看您信箱有沒有收到含 PDF 附件的信
//  作用：把 Web App / 部署版本的問題排除，直接驗證 sendConfirmEmail 邏輯
// ════════════════════════════════════════════════════════
function testSendEmail() {
  const TEST_EMAIL = 'oscar19960613@gmail.com'; // ★ 改成您能收信的信箱
  Logger.log('━━━━━━ 整套寄信流程測試 ━━━━━━');
  Logger.log('測試收件信箱：' + TEST_EMAIL);
  Logger.log('當前執行帳號：' + Session.getActiveUser().getEmail());
  Logger.log('ATTACHMENT_FILE_ID：' + ATTACHMENT_FILE_ID);
  Logger.log('Code.gs 版本標記：v1.04（如果這行沒出現代表編輯器是舊版）');
  Logger.log('---');

  try {
    sendConfirmEmail(
      '測試員',
      TEST_EMAIL,
      '4-6',
      '台北市',
      '測試國小',
      '校園講座,FB/IG'
    );
    Logger.log('━━━━━━ ✓ 測試結束 ━━━━━━');
    Logger.log('請到您的信箱確認：');
    Logger.log('  ✓ 收到主旨「【心智光譜】您的光譜分析說明已寄出 ✉️」的信');
    Logger.log('  ✓ 信件下方有【家長眼裡的孩子】CTA 區塊');
    Logger.log('  ✓ 信件包含 PDF 附件（覺知心智光譜測評說明.pdf, 約 764 KB）');
    return '✓ 測試發送完成，請查看 ' + TEST_EMAIL;
  } catch (err) {
    Logger.log('✗ 測試失敗：' + err.toString());
    Logger.log(err.stack || '(無 stack trace)');
    return '✗ ' + err.toString();
  }
}

// ════════════════════════════════════════════════════════
//  PDF 附件診斷工具：手動執行測試 ATTACHMENT_FILE_ID 是否可讀
//  使用方式：函式選單選 testAttachment → 點 ▶ 執行 → 看執行紀錄
// ════════════════════════════════════════════════════════
function testAttachment() {
  Logger.log('━━━━━━ PDF 附件診斷開始 ━━━━━━');
  Logger.log('當前 ATTACHMENT_FILE_ID：' + (ATTACHMENT_FILE_ID || '(空)'));
  Logger.log('當前執行帳號：' + Session.getActiveUser().getEmail());

  if (!ATTACHMENT_FILE_ID) {
    Logger.log('✗ ATTACHMENT_FILE_ID 為空，請至 Code.gs 第 19 行設定');
    return '✗ FILE_ID 為空';
  }

  try {
    const file = DriveApp.getFileById(ATTACHMENT_FILE_ID);
    const blob = file.getBlob();
    Logger.log('✓ 檔案名稱：' + file.getName());
    Logger.log('✓ MIME 類型：' + blob.getContentType());
    Logger.log('✓ 大小：' + Math.round(blob.getBytes().length / 1024) + ' KB');
    Logger.log('✓ 擁有者：' + file.getOwner().getEmail());
    Logger.log('━━━━━━ ✓ 診斷通過：附件可正常讀取 ━━━━━━');
    return '✓ OK：' + file.getName();
  } catch (err) {
    Logger.log('✗ 讀取失敗：' + err.toString());
    Logger.log('  可能原因：');
    Logger.log('  1. 您的 Google 帳號（' + Session.getActiveUser().getEmail() + '）');
    Logger.log('     沒有該檔案的讀取權限');
    Logger.log('  2. ATTACHMENT_FILE_ID 拼錯');
    Logger.log('  3. 檔案已被刪除或移到垃圾桶');
    Logger.log('  解決方式：把 PDF 複製一份到您自己的 Drive，再把新的 file ID 貼回 Code.gs');
    Logger.log('━━━━━━ ✗ 診斷失敗 ━━━━━━');
    return '✗ ' + err.toString();
  }
}


// ════════════════════════════════════════════════════════
//  【部署說明】
//
//  1. 開啟您的 Google Sheet（或新建一個）
//  2. 點選上方選單：延伸功能 → Apps Script
//  3. 將此 Code.gs 貼入編輯器（取代預設內容），儲存
//  4. 點選「部署」→「新增部署作業」
//       - 類型：Web 應用程式
//       - 說明：心智光譜表單（任意填）
//       - 以誰的身分執行：「我（您的 Google 帳號）」
//       - 誰可以存取：「所有人」
//  5. 點選「部署」，複製產生的「網頁應用程式網址」
//  6. 將網址貼入 form.html 中的 APPS_SCRIPT_URL 變數
//  7. 完成！每次修改 Code.gs 後需重新部署（選「管理現有部署作業」→「編輯」→「新版本」）
//
//  【注意】
//  - 第一次執行時 Google 會要求授權（點選「進階」→「前往...」→「允許」）
//  - 使用 GmailApp 需要 Gmail 授權，系統會自動詢問
//  - 寄件者為您部署時登入的 Google 帳號
// ════════════════════════════════════════════════════════
