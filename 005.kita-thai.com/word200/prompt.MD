

---

# 📱 多言語サバイバル単語帳 "OctoCore" UI/UX 仕様書

## 1. デザインコンセプト

* **テーマ:** **"Survival & Focus"**
* **配色:** 黒背景にネオンカラー（言語ごとにテーマカラーを変更）。夜の屋台や機内でも見やすく、バッテリーに優しいダークモード基調。
* **タイポグラフィ:** 大きく、太く。視認性最優先。
* **触感:** タップした瞬間のレスポンスと音（システム音）を重視し、「押した」感覚を与える。



## 2. 画面遷移と機能詳細

### A. トップページ (Gateway)

ユーザーが最初に訪れる「空港の出発ロビー」のような場所。

* **UI要素:**
* **Hero Message:** "Where will you survive?"（どこで生き残る？）
* **Target Language Selector:** 大きなカード型ボタンで学習したい言語（国）を選択。
* 🇺🇸 EN / 🇹🇭 TH / 🇯🇵 JP / 🇨🇳 CN / 🇮🇳 HI / 🇪🇸 ES


* **Footer:** アプリについて / 設定（データクリア等）



### B. 言語設定モーダル (Context)

ターゲット言語（ディレクトリ）に入った直後、または初回アクセス時に表示。

* **Message:** "What is your native language?"（あなたの母国語は？）
* **Action:** 母国語を選択（例：JP）。
* *Logic:* ここで選択した言語が、LocalStorageに保存され、読み込むJSONファイル（例：`TH_JP.json`）が決定される。



### C. 単語リスト / ダッシュボード (Base Camp)

その言語の全200単語を俯瞰する画面。

* **UI要素:**
* **Progress Bar:** 「習得率 15/200」と「出発までのカウントダウン」。
* **Filter Tabs:**
* All (全200)
* Core (超必須20)
* Scene (食事 / 移動 / トラブル)


* **List Item:**
* 左にターゲット単語（大きく）、右に母国語訳（小さく）。
* タップすると「マンダラートモード」へ遷移。
* リスト右端に「再生ボタン」→ その場で音声確認（指差し会話帳として利用可能）。





### D. マンダラート学習画面 (The Arena)

**本アプリの核。フルスクリーン推奨。**

* **Layout:**
* 画面中央に正方形の 3x3 グリッド。
* **中央マス (Center):** ターゲット単語（例: Water）。
* **周囲8マス (Satellites):** 関連フレーズ。


* **Interaction (Learning Mode):**
1. **初期状態:** 中央の単語のみ表示。周囲は伏せられている（またはアイコンのみ）。
2. **Tap Center:** 中央の単語を発音 & 周囲のフレーズが「パッ」と開く（アニメーション）。
3. **Tap Phrase:** そのフレーズを発音 & 母国語訳をオーバーレイ表示（指を離すと戻る、あるいはトグル）。
4. **Swipe:** 次の単語（マンダラート）へ移動。Tinderのような軽快さで。


* **Auto Play Mode (一夜漬けモード):**
* 再生ボタンを押すと、「Center発音 → (間) → Phrase1発音 → Phrase2...」と自動で流れる。聞き流し用。



---

## 3. ディレクトリ・URL構造設計

SEOとPWAキャッシュを考慮し、以下のように物理的、または論理的にパスを切ります。

```text
/index.html          (Top Page)
/en/                 (Target: English)
  index.html         (Dashboard & Player)
  data/
    en_jp.json       (EN target, JP source)
    en_th.json       (EN target, TH source)
/th/                 (Target: Thai)
  index.html
  data/
    th_jp.json
    th_en.json
...

```

※ 実際はSPA（Single Page Application）で実装し、URLルーティングで擬似的に表現するのが管理上楽ですが、ユーザー体験としては「別の部屋に入った」感覚を作ります。