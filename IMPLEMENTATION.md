# start.gg Match History Viewer - 実装詳細

## 概要

start.gg APIを使用してプレイヤーの対戦履歴を表示するNext.jsアプリケーションです。プレイヤーのslug（URLの一部）を入力することで、そのプレイヤーの試合履歴を取得・表示します。

## アーキテクチャ

```
src/
├── app/
│   └── page.tsx          # メインページ（検索フォーム）
├── components/
│   └── MatchHistory.tsx  # 対戦履歴表示コンポーネント
└── lib/
    └── startgg-client.ts # start.gg APIクライアント
```

## 実装詳細

### 1. start.gg APIクライアント (`src/lib/startgg-client.ts`)

#### 主要な機能
- GraphQL APIへのリクエスト処理
- 認証（Bearer token）
- プレイヤーslugから対戦履歴を取得

#### 重要な実装ポイント

**プレイヤー検索のGraphQLクエリ**
```typescript
const query = `
  query GetPlayerSets($userSlug: String!, $perPage: Int, $page: Int) {
    user(slug: $userSlug) {
      player {
        sets(perPage: $perPage, page: $page) {
          nodes {
            id
            displayScore
            event {
              name
              tournament {
                name
              }
            }
          }
        }
      }
    }
  }
`;
```

**Slugの自動フォーマット**
```typescript
const userSlug = playerSlug.startsWith('user/') ? playerSlug : `user/${playerSlug}`;
```

start.gg APIでは、ユーザーのslugは`user/xxx`形式である必要があります。入力が`user/`で始まらない場合は自動的にプレフィックスを追加します。

#### APIレスポンス構造
```typescript
interface PlayerSetsResponse {
  user: {
    player: {
      sets: {
        nodes: Set[];
      };
    };
  };
}
```

### 2. 対戦履歴表示コンポーネント (`src/components/MatchHistory.tsx`)

#### 機能
- プレイヤーslugを受け取り、対戦履歴を取得・表示
- ローディング状態の管理
- エラーハンドリング
- レスポンシブデザイン

#### 状態管理
```typescript
const [sets, setSets] = useState<Set[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### エラーハンドリング
- API設定エラー（APIキーが未設定）
- ネットワークエラー
- GraphQLエラー

### 3. メインページ (`src/app/page.tsx`)

#### 機能
- プレイヤーslug入力フォーム
- 検索実行
- 結果表示エリア

#### 入力検証
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (playerId.trim()) {
    setSearchedPlayerId(playerId.trim());
  }
};
```

## API認証設定

### 環境変数
```bash
NEXT_PUBLIC_STARTGG_API_KEY=your_api_key_here
```

### APIキーの取得方法
1. https://start.gg/admin/profile にアクセス
2. "Developer Settings" に移動
3. "Create new token" をクリック
4. トークンをコピーして`.env.local`に設定

## プレイヤーSlugについて

### Slugの形式
- start.ggのプレイヤーURL: `https://www.start.gg/user/b149c474`
- 必要な入力: `b149c474` （URLの最後の部分）
- APIでの形式: `user/b149c474` （自動で変換）

### 使用例
```typescript
// 入力: "b149c474"
// 内部変換: "user/b149c474"
// APIクエリ: user(slug: "user/b149c474")
```

## スタイリング

### 使用技術
- Tailwind CSS
- レスポンシブデザイン
- ダークモード対応（部分的）

### デザインパターン
- カード形式の対戦履歴表示
- ローディングスピナー
- エラー状態の表示
- フォーカス状態の視覚化

## データ構造

### 対戦履歴（Set）
```typescript
interface Set {
  id: number;
  displayScore: string;  // "2-1", "3-0" など
  event: {
    name: string;        // イベント名
    tournament: {
      name: string;      // トーナメント名
    };
  };
}
```

## エラーハンドリング

### 主要なエラーケース
1. **APIキー未設定**: 設定方法を案内
2. **プレイヤーが見つからない**: 適切なエラーメッセージ
3. **ネットワークエラー**: 再試行の案内
4. **レート制限**: API制限に関する情報

### エラー表示
```typescript
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <h3 className="text-red-800 font-semibold">Error</h3>
      <p className="text-red-600">{error}</p>
    </div>
  );
}
```

## パフォーマンス考慮

### 最適化ポイント
- useEffectでのプレイヤーID変更時のみAPI呼び出し
- 不要なre-renderの防止
- レスポンシブ画像の使用

### API呼び出し制御
```typescript
useEffect(() => {
  if (playerId) {
    fetchMatchHistory();
  }
}, [playerId]);
```

## 今後の拡張可能性

### 追加可能な機能
1. **ページネーション**: より多くの履歴を表示
2. **フィルタリング**: ゲームタイトルや期間での絞り込み
3. **詳細情報**: 対戦相手や具体的な試合詳細
4. **統計情報**: 勝率や使用キャラクター
5. **お気に入り**: よく検索するプレイヤーの保存

### 技術的改善
1. **キャッシング**: API結果のキャッシュ
2. **オフライン対応**: Service Workerの実装
3. **SEO最適化**: meta tagの追加
4. **アクセシビリティ**: ARIA属性の追加