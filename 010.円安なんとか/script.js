document.addEventListener('DOMContentLoaded', () => {
    // 設定：ファイル数 (必要に応じて変更)
    const TOTAL_FILES = 100;
    
    // DOM要素の取得
    const articleList = document.getElementById('article-list');
    const contentFrame = document.getElementById('content-frame');
    const totalCountSpan = document.getElementById('total-count');

    // 記事数を表示
    totalCountSpan.textContent = TOTAL_FILES;

    // リストの生成
    for (let i = 1; i <= TOTAL_FILES; i++) {
        // ファイル名を作成 (例: 1 -> "001.html")
        const fileNumber = String(i).padStart(3, '0');
        const fileName = `${fileNumber}.html`;

        // リストアイテムを作成
        const li = document.createElement('li');
        const a = document.createElement('a');
        
        // リンクの設定
        a.href = fileName;
        a.target = "content-frame"; // iframeの名前を指定
        a.textContent = `Article ${fileNumber}`; // 表示名
        a.dataset.file = fileName; // アクティブ判定用

        // クリックイベント（アクティブクラスの切り替え）
        a.addEventListener('click', function(e) {
            // 他のすべてのアクティブクラスを削除
            document.querySelectorAll('.article-list a').forEach(link => {
                link.classList.remove('active');
            });
            // クリックされた要素にアクティブクラスを追加
            this.classList.add('active');
        });

        li.appendChild(a);
        articleList.appendChild(li);
    }

    // 初期表示：最初のファイル (001.html) をロード
    if (TOTAL_FILES > 0) {
        const firstLink = articleList.querySelector('a');
        if (firstLink) {
            // 強制的にクリックイベントを発火させて初期ロードを行う
            firstLink.click();
            contentFrame.src = firstLink.getAttribute('href');
        }
    }
});