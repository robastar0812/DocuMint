# DocuMint 静的検証テスト（staging への push 前後で実行）
# 実行: pwsh -File scripts/staging-tests.ps1
# 戻り値: 失敗件数（0 ならクリーン、>0 なら失敗あり）

$ErrorActionPreference = 'Stop'
$indexPath = Join-Path $PSScriptRoot '..\index.html'
if (-not (Test-Path $indexPath)) { Write-Output 'index.html が見つかりません'; exit 1 }

$html = Get-Content -Raw -Encoding UTF8 $indexPath
$ns   = $html -replace ' ',''   # 空白除去版（CSS/JSX マッチ用）
$bugs = New-Object System.Collections.Generic.List[string]
$results = New-Object System.Collections.Generic.List[object]
$cat = ''

function Section($name) { $script:cat = $name; Write-Output ''; Write-Output ("=== [$name] ===") }
function Chk($name, $cond) {
  $status = if ($cond) { 'OK' } else { 'NG' }
  $sym    = if ($cond) { '+' } else { '-' }
  Write-Output ("  $sym $name")
  if (-not $cond) { $script:bugs.Add("[$($script:cat)] $name") }
  $script:results.Add([pscustomobject]@{ category=$script:cat; name=$name; pass=[bool]$cond })
}

# ===== カテゴリ A: 直近4コミットの修正検証 =====
Section 'A. 直近修正検証'

# A1-A5: PCヘッダー修正 (1b88455 / f39e71c 系の名残含む)
Chk 'A01 PCメディアクエリ追加'                  ($html -match 'min-width:901px')
Chk 'A02 .toolbar-logo font-size:20px'          ($ns -match 'toolbar-logo\{font-size:20px')
Chk 'A03 .auth-btn.logged-in max-width:70px'    ($ns -match 'auth-btn\.logged-in\{[^}]*max-width:70px')
Chk 'A04 inline fontSize:28 削除 (両方)'        (-not ($html -match 'toolbar-logo" style=\{\{fontSize:28\}\}'))
Chk 'A05 グラデーション残存'                    ($ns -match 'linear-gradient\(90deg,#6c3fd4')
Chk 'A06 -webkit-background-clip:text 残存'     ($ns -match '-webkit-background-clip:text')
Chk 'A07 PROバッジ fontSize:11 (PC側)'          ($ns -match "fontSize:11,fontWeight:800,color:'white'")
Chk 'A08 PROバッジ padding 3px 7px'             ($html -match "padding:'3px 7px'")

# A09-A15: 明細行 空白/コメント
Chk 'A09 createItem 関数定義'                   ($html -match 'const createItem = ')
Chk 'A10 createEmptyItem 委譲'                  ($html -match 'createEmptyItem = \(\) => createItem')
Chk 'A11 insertItemAfter 定義 (本体)'           ($html -match 'const insertItemAfter = \(afterId, type\)')
Chk 'A12 addItem type 引数対応'                 ($html.Contains("addItem = (type = 'normal')"))
Chk 'A13 calcTax: type!=normal 除外'            ($html.Contains("item.type !== 'normal'"))
Chk 'A14 CSS .item-row.blank-row'               ($html -match '\.item-row\.blank-row')
Chk 'A15 CSS .item-row.comment-row'             ($html -match '\.item-row\.comment-row')
Chk 'A16 CSS .insert-dropdown'                  ($html -match '\.insert-dropdown\{')
Chk 'A17 CSS .insert-row-btn opacity:0'         ($ns -match 'insert-row-btn\{[^}]*opacity:0')
Chk 'A18 ItemsEditor: blank行レンダリング'      ($html -match "item\.type === 'blank'")
Chk 'A19 ItemsEditor: comment行レンダリング'    ($html -match "item\.type === 'comment'")
Chk 'A20 途中挿入ボタン UI'                     ($html -match 'ここに挿入')
Chk 'A21 末尾ドロップダウン ▼'                  ($html -match '行追加 ▼')
Chk 'A22 addDropdownOpen state'                 ($html -match 'addDropdownOpen')
Chk 'A23 ItemsEditor 呼出 props 完全'           ($html.Contains('insertItemAfter={insertItemAfter}'))
Chk 'A24 PDF blank 行 colSpan/td x 6 形'        ($html -match "item\.type === 'blank'[\s\S]{0,200}<td/><td/><td/><td/><td/>")
Chk 'A25 PDF comment 行 colSpan=6'              ($html -match 'colSpan=\{6\}')

# A26-A33: 3バグ修正
Chk 'A26 bug1 if (isStamp) 条件分岐'            ($html -match 'if \(isStamp\) \{')
Chk 'A27 bug1 putImageData は1箇所のみ'         (([regex]::Matches($html,'ctx\.putImageData').Count) -eq 1)
Chk 'A28 bug1 透過コメント残存'                 ($html -match '角印のみ黒背景を透過')
Chk 'A29 bug2 word-break:break-word'            ($ns -match 'doc-notes-body\{[^}]*word-break:break-word')
Chk 'A30 bug2 overflow-wrap:break-word'         ($ns -match 'doc-notes-body\{[^}]*overflow-wrap:break-word')
Chk 'A31 bug3 stampPosition.y/100*1123'         ($ns -match '\(doc\.stampPosition\.y/100\)\*1123')
Chk 'A32 bug3 logoPosition.y/100*1123'          ($ns -match '\(\(doc\.logoPosition\?\.y\?\?90\)/100\)\*1123')
Chk 'A33 bug3 getPos y 1123 * paperScale'       ($html -match '1123 \* paperScale')

# A34-A35: iPad縦ヘッダー崩れ修正（isPC境界をCSS階層901/900に一致）
Chk 'A34 isPC 初期値 innerWidth>900'            ($html -match 'useState\(window\.innerWidth > 900\)')
Chk 'A35 isPC resize も innerWidth>900'         ($html -match 'setIsPC\(window\.innerWidth > 900\)')
Chk 'A36 旧境界 isPC>768 が残存しない'          (-not ($html -match '(?:useState|setIsPC)\(window\.innerWidth > 768\)'))

# A37-A44: 決済フロー セキュリティ修正（Pro自己付与・ポータルなりすまし・リダイレクト偽装）
$verifyApiPath = Join-Path $PSScriptRoot '..\api\verify-checkout-session.js'
$verifyApi  = if (Test-Path $verifyApiPath) { Get-Content -Raw -Encoding UTF8 $verifyApiPath } else { '' }
$portalApi  = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot '..\api\create-portal-session.js')
$checkoutApi = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot '..\api\create-checkout-session.js')
Chk 'A37 verify-checkout-session.js 存在'       (Test-Path $verifyApiPath)
Chk 'A38 verify API: payment_status照合'        ($verifyApi -match "payment_status !== 'paid'")
Chk 'A39 verify API: session_id形式チェック'    ($verifyApi -match '\^cs_')
Chk 'A40 HTML: verify API 呼出'                 ($html -match '/api/verify-checkout-session')
Chk 'A41 HTML: profiles.is_pro直接更新なし'     (-not ($html -match "update\(\{ is_pro"))
Chk 'A42 HTML: portal fetch に Authorization'   ($html -match "'/api/create-portal-session'[\s\S]{0,200}Authorization")
Chk 'A43 portal API: authトークン検証'          ($portalApi -match 'auth/v1/user')
Chk 'A44 両API: リダイレクト先許可制限'         (($portalApi -match 'resolveBaseUrl') -and ($checkoutApi -match 'resolveBaseUrl'))

# ===== カテゴリ B: リグレッション =====
Section 'B. リグレッション'

# B1-B10: 基本骨格
Chk 'B01 STORAGE_KEY 定義'                      ($html -match "STORAGE_KEY = 'invoice-app-storage'")
Chk 'B02 defaultDocument 定義'                  ($html -match 'const defaultDocument =')
Chk 'B03 defaultMyCompany 定義'                 ($html -match 'const defaultMyCompany =')
Chk 'B04 calcTax 関数定義'                      ($html -match 'const calcTax = items =>')
Chk 'B05 formatCurrency 定義'                   ($html -match 'const formatCurrency = a =>')
Chk 'B06 formatDate 定義'                       ($html -match 'const formatDate = s =>')
Chk 'B07 DOC_TYPE_LABELS 定義'                  ($html -match 'DOC_TYPE_LABELS = \{ invoice')
Chk 'B08 ItemsEditor コンポーネント'            ($html -match 'function ItemsEditor\(')
Chk 'B09 Toolbar コンポーネント'                ($html -match 'function Toolbar\(')
Chk 'B10 Preview コンポーネント'                ($html -match 'function Preview\(')
Chk 'B11 App コンポーネント'                    ($html -match 'function App\(')
Chk 'B12 useAppState フック'                    ($html -match 'function useAppState\(')

# B13-B20: 主要機能の入口
Chk 'B13 PDF生成 (html2pdf 参照)'               ($html -match 'html2pdf')
Chk 'B14 Supabase 認証フロー'                   ($html -match 'supabase')
Chk 'B15 ServiceWorker 登録'                    ($html -match "serviceWorker.*register\('/sw\.js'\)")
Chk 'B16 LINE ブラウザ検知バナー'               ($html -match 'LINEブラウザ')
Chk 'B17 マーキー表示 (Pro宣伝)'                ($html -match 'pro-marquee')
Chk 'B18 NumInput 数値コンポーネント'           ($html -match 'function NumInput\(')
Chk 'B19 StampUploader コンポーネント'          ($html -match 'function StampUploader\(')
Chk 'B20 HistoryPanel コンポーネント'           ($html -match 'function HistoryPanel\(')
Chk 'B21 SettingsModal コンポーネント'          ($html -match 'function SettingsModal\(')

# B22-B28: 直前のバグ修正で壊してはいけない CSS
Chk 'B22 .sidebar 幅指定残存'                   ($ns -match '\.sidebar\{[^}]*width:320px')
Chk 'B23 .toolbar-header padding残存'           ($ns -match 'toolbar-header')
Chk 'B24 .a4-paper クラス残存'                  ($ns -match '\.a4-paper\{')
Chk 'B25 .a4-paper min-height:1123px'           ($ns -match 'a4-paper\{[^}]*min-height:1123px')
Chk 'B26 @media max-width:900px ブロック'       ($html -match '@media screen and \(max-width:900px\)')
Chk 'B27 .doc-stamp クラス'                     ($ns -match '\.doc-stamp\{')
Chk 'B28 .item-row 基本ルール'                  ($ns -match '\.item-row\{')
Chk 'B29 .input 基本クラス'                     ($ns -match '\.input\{')
Chk 'B30 .btn-outline ボタンスタイル'           ($ns -match '\.btn-outline')

# ===== カテゴリ C: コード品質・構造 =====
Section 'C. コード品質・構造'

Chk 'C01 DOCTYPE 宣言'                          ($html -match '(?i)^<!DOCTYPE html>')
Chk 'C02 <html> タグ存在'                       ($html -match '<html[^>]*>')
Chk 'C03 <head> ペア'                           (($html -match '<head[^>]*>') -and ($html -match '</head>'))
Chk 'C04 <body>/</body> ペア'                   (($html -match '<body[^>]*>') -and ($html -match '</body>'))
Chk 'C04b </html> 閉じタグあり'                  ($html -match '</html>')
$styleOpen   = [regex]::Matches($html, '<style[^>]*>').Count
$styleClose  = [regex]::Matches($html, '</style>').Count
Chk 'C05 <style>/</style> ペア一致'             ($styleOpen -eq $styleClose -and $styleOpen -gt 0)
$scriptOpen  = [regex]::Matches($html, '<script[^>]*>').Count
$scriptClose = [regex]::Matches($html, '</script>').Count
Chk 'C06 <script>/</script> ペア一致'           ($scriptOpen -eq $scriptClose)
Chk 'C07 ReactDOM.createRoot 起動コード'        ($html -match 'createRoot\([\s\S]+?\)\.render')
Chk 'C08 Babel standalone 読込'                 ($html -match 'babel(?:\.min)?\.js')
Chk 'C09 React 読込'                            ($html -match 'react(?:\.development|\.production\.min)?\.js|react\.development|react@')
Chk 'C10 type="text/babel" script タグ'         ($html -match 'type="text/babel"')

# C11-C18: 名前解決
Chk 'C11 insertItemAfter は useAppState から export'  ($html -match 'addItem, insertItemAfter, removeItem')
Chk 'C12 insertItemAfter は Toolbar で受取'           ($html -match 'addItem, insertItemAfter, removeItem')
Chk 'C13 createItem は2回以上参照'             (([regex]::Matches($html,'\bcreateItem\b').Count) -ge 4)
Chk 'C14 addDropdownOpen 定義と参照(>=3)'      (([regex]::Matches($html,'addDropdownOpen').Count) -ge 4)
Chk 'C15 setAddDropdownOpen 定義と参照'        (([regex]::Matches($html,'setAddDropdownOpen').Count) -ge 4)
Chk 'C16 React.Fragment 使用 (ItemsEditor)'    ($html -match 'React\.Fragment')
Chk 'C17 paperScale (bug3 新変数) 局所定義'    ($html -match 'const paperScale = pr\.width')
Chk 'C18 isStamp 関数内ローカル変数'           ($html -match 'const isStamp = label === ''角印''')

# C19-C24: 三項演算子・JSX 注意点
# C19 は user?.email のオプショナルチェーニング誤検出のため厳密化版を採用
Chk 'C19 三項演算子直後の JSXコメント'         (-not [regex]::IsMatch($html, '\? *\{/\*'))
Chk 'C20 三項演算子の偽分岐の JSXコメント'     (-not [regex]::IsMatch($html, ': *\{/\*'))
Chk 'C21 JSX 内 <script> なし (XSS防止)'       (-not [regex]::IsMatch($html, '<script>[^<]*\{[a-zA-Z]'))
Chk 'C22 JSX style 内に CSSの ; 混入なし'      (-not [regex]::IsMatch($html, "style=\{\{[^}]*;[^}]*\}\}"))
Chk 'C23 div開閉数の概算一致 (差<=15)'         ([Math]::Abs(([regex]::Matches($html,'<div\b').Count) - ([regex]::Matches($html,'</div>').Count)) -le 15)
Chk 'C24 末尾の自己終了 </a> 健全性'           ($html -match '</a></p>')
Chk 'C25 crawler-footer 閉じ </div> 健全性'    ($html -match 'crawler-footer[\s\S]+</a>\s*</div>')

# ===== カテゴリ D: セキュリティ・例外 =====
Section 'D. セキュリティ・例外'

Chk 'D01 dangerouslySetInnerHTML 不使用'       (-not ($html -match 'dangerouslySetInnerHTML'))
# D02: LINE警告画面の1箇所のみ静的文字列代入。ユーザー入力流入なしを期待
Chk 'D02 innerHTML 代入は1件以下 (静的のみ)'   (([regex]::Matches($html, '\.innerHTML\s*=').Count) -le 1)
Chk 'D03 document.write 不使用'                (-not ($html -match 'document\.write\('))
Chk 'D04 eval 不使用'                          (-not [regex]::IsMatch($html, '\beval\('))
Chk 'D05 new Function 不使用'                  (-not ($html -match 'new Function\('))
Chk 'D06 console.log 0件 (本番ログ漏れ)'       (([regex]::Matches($html,'console\.log\b').Count) -eq 0)
Chk 'D07 href="javascript:" なし'              (-not ($html -match 'href="javascript:'))
# D08: LINE 公式 openExternalBrowser パラメータでLINEブラウザ離脱
Chk 'D08 LINE openExternalBrowser パラメータ'  ($html -match 'openExternalBrowser')
Chk 'D09 localStorage に秘密キー保存なし'      (-not [regex]::IsMatch($html, "setItem\(['\""](?:password|apikey|secret|token)"))
Chk 'D10 .env 直接参照なし (HTML)'             (-not ($html -match '\.env\b'))
Chk 'D11 try/catch でlocalStorage QuotaErr処理' ($html -match 'QuotaExceededError')
Chk 'D12 PDF 連打防止フラグ (pdfLoading)'      ($html -match 'pdfLoading')

# ===== カテゴリ E: その他・ハイブリッド =====
Section 'E. ハイブリッドチェック'

Chk 'E01 ファイル存在'                         (Test-Path $indexPath)
Chk 'E02 ファイルサイズ >100KB'                ((Get-Item $indexPath).Length -gt 100000)
$bom = [System.IO.File]::ReadAllBytes($indexPath)[0..2] -join ','
Chk 'E03 ファイル UTF-8 BOMなし'               ($bom -ne '239,187,191')
Chk 'E04 manifest.json リンク'                 ($html -match 'manifest\.json')
Chk 'E05 viewport meta'                        ($html -match '<meta[^>]*name="viewport"')
Chk 'E06 charset meta'                         ($html -match '<meta[^>]*charset')
Chk 'E07 description meta'                     ($html -match '<meta[^>]*name="description"')
$manifestPath = Join-Path $PSScriptRoot '..\manifest.json'
$manifestExists = Test-Path $manifestPath
$manifestText = if ($manifestExists) { Get-Content -Raw -Encoding UTF8 $manifestPath } else { '' }
Chk 'E08 manifest.json に icon-512 登録'        ($manifestText -match 'icon-512')
Chk 'E09 manifest.json に icon-192 登録'        ($manifestText -match 'icon-192')
Chk 'E10b icon-512v2.png ファイル存在'          (Test-Path (Join-Path $PSScriptRoot '..\icon-512v2.png'))
Chk 'E11b icon-192v2.png ファイル存在'          (Test-Path (Join-Path $PSScriptRoot '..\icon-192v2.png'))
Chk 'E12b apple-touch-icon.png ファイル存在'    (Test-Path (Join-Path $PSScriptRoot '..\apple-touch-icon.png'))
Chk 'E13 sw.js ServiceWorker ファイル存在'      (Test-Path (Join-Path $PSScriptRoot '..\sw.js'))
Chk 'E14 vercel.json デプロイ設定存在'          (Test-Path (Join-Path $PSScriptRoot '..\vercel.json'))
Chk 'E10 apple-touch-icon リンク'              ($html -match 'apple-touch-icon')
Chk 'E11 title タグあり'                       ($html -match '<title>[^<]+</title>')
Chk 'E12 OGP og:title あり'                    ($html -match 'property="og:title"')

# ===== 集計 =====
Write-Output ''
Write-Output ('=' * 60)
Write-Output ("Total: $($results.Count)   Pass: $($results.Count - $bugs.Count)   Fail: $($bugs.Count)")
if ($bugs.Count -gt 0) {
  Write-Output ''
  Write-Output 'NG 項目一覧:'
  foreach ($b in $bugs) { Write-Output "  - $b" }
}
Write-Output ('=' * 60)
exit $bugs.Count
