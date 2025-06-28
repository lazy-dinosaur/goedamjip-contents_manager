# Strapi + Supabase 통합 튜토리얼

이 튜토리얼은 Strapi CMS와 Supabase를 통합하여 콘텐츠 관리 시스템을 구축하는 과정을 단계별로 설명합니다.

## 목차

1. [프로젝트 초기 설정](#1-프로젝트-초기-설정)
2. [Supabase 연결 설정](#2-supabase-연결-설정)
3. [Content Types 생성](#3-content-types-생성)
4. [Supabase Storage 연동](#4-supabase-storage-연동)
5. [Row Level Security 설정](#5-row-level-security-설정)
6. [데이터 삽입 자동화](#6-데이터-삽입-자동화)

---

## 1. 프로젝트 초기 설정

### 1.1 Strapi 프로젝트 생성

```bash
npx create-strapi-app@latest goedamjip-contents-manager
```

### 1.2 필수 패키지 설치

```bash
npm install @supabase/supabase-js dotenv axios better-sqlite3
```

### 1.3 프로젝트 구조

```
goedamjip-contents-manager/
├── config/
│   ├── database.ts    # 데이터베이스 설정
│   ├── plugins.ts     # 플러그인 설정
│   └── server.ts      # 서버 설정
├── src/
│   ├── api/          # API 엔드포인트
│   └── lib/          # 유틸리티 라이브러리
└── .env              # 환경 변수
```

---

## 2. Supabase 연결 설정

### 2.1 환경 변수 설정 (.env)

```env
# Database - Supabase PostgreSQL
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=disable
DATABASE_HOST=aws-0-ap-northeast-2.pooler.supabase.com
DATABASE_PORT=6543
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres.[프로젝트ID]
DATABASE_PASSWORD=[비밀번호]
DATABASE_SSL=false

# Supabase
SUPABASE_URL=https://[프로젝트ID].supabase.co
SUPABASE_ANON_KEY=[익명키]
SUPABASE_BUCKET=goedamjip-assets
```

### 2.2 데이터베이스 설정 (config/database.ts)

```typescript
export default ({ env }) => {
  const client = env("DATABASE_CLIENT", "postgres");

  const connections = {
    postgres: {
      connection: {
        connectionString: env("DATABASE_URL"),
        host: env("DATABASE_HOST", "localhost"),
        port: env.int("DATABASE_PORT", 5432),
        database: env("DATABASE_NAME", "postgres"),
        user: env("DATABASE_USERNAME", "postgres"),
        password: env("DATABASE_PASSWORD", ""),
        ssl: env.bool("DATABASE_SSL", false) && {
          rejectUnauthorized: env.bool(
            "DATABASE_SSL_REJECT_UNAUTHORIZED",
            true,
          ),
        },
        schema: env("DATABASE_SCHEMA", "public"),
      },
      pool: {
        min: env.int("DATABASE_POOL_MIN", 2),
        max: env.int("DATABASE_POOL_MAX", 10),
      },
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000),
    },
  };
};
```

### 2.3 Supabase 클라이언트 설정 (src/lib/supabase.ts)

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 3. Content Types 생성

### 3.1 Asset Categories

**설정값:**

- Display name: Asset Category
- API ID (singular): asset-category
- API ID (plural): asset-categories

**필드:**

- `name`: Text (Short text, Required, Unique)
- `description`: Text (Long text)

### 3.2 Asset Subcategories

**설정값:**

- Display name: Asset Subcategory
- API ID (singular): asset-subcategory
- API ID (plural): asset-subcategories

**필드:**

- `name`: Text (Short text, Required)
- `description`: Text (Long text)
- `category`: Relation (asset-categories, Many-to-One)

### 3.3 Assets

**설정값:**

- Display name: Asset
- API ID (singular): asset
- API ID (plural): assets

**필드:**

- `tag_name`: Text (Short text, Required, Unique)
- `display_name`: Text (Short text, Required)
- `description`: Text (Long text)
- `usage_guide`: Text (Long text)
- `keywords`: Text (Long text)
- `implementation_type`: Enumeration (file, code, hybrid)
- `file_url`: Text (Short text)
- `implementation_details`: JSON
- `is_active`: Boolean (Default: true)
- `category`: Relation (asset-categories, Many-to-One)
- `subcategory`: Relation (asset-subcategories, Many-to-One)
- `audio_file`: Media (Single media, Audio files only)

### 3.4 Stories

**설정값:**

- Display name: Story
- API ID (singular): story
- API ID (plural): stories

**필드:**

- `title`: Text (Short text, Required)
- `original_text`: Text (Long text, Required)
- `converted_json`: JSON (Required)
- `story_summary`: Text (Long text)
- `tags`: Text (Long text) // #으로 구분
- `status`: Enumeration (draft, published, archived)
- `intensity_level`: Number (Integer, Min: 1, Max: 10)
- `reading_time`: Number (Integer)
- `author`: Text (Short text, Default: "AI")
- `published_at`: Date (Date & time)
- `word_count`: Number (Integer)
- `view_count`: Number (Integer, Default: 0)
- `average_rating`: Number (Float, Min: 0, Max: 5)
- `total_ratings`: Number (Integer, Default: 0)

### 3.5 Story Ratings (옵션)

**설정값:**

- Display name: Story Rating
- API ID (singular): story-rating
- API ID (plural): story-ratings

**필드:**

- `user_id`: Text (Required)
- `story`: Relation (stories, Many-to-One, Required)
- `rating`: Number (Integer, Min: 1, Max: 5, Required)
- `review`: Text (Long text)

---

## 4. Supabase Storage 연동

### 4.1 Storage Provider 설치

```bash
npm install strapi-provider-upload-supabase
```

### 4.2 Storage 설정 (config/plugins.ts)

```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-supabase",
      providerOptions: {
        apiUrl: env("SUPABASE_URL"),
        apiKey: env("SUPABASE_ANON_KEY"),
        bucket: env("SUPABASE_BUCKET"),
        directory: env("SUPABASE_DIRECTORY", ""),
        options: {},
      },
    },
  },
});
```

### 4.3 Supabase Storage Bucket 생성

1. Supabase Dashboard → Storage
2. Create Bucket: `goedamjip-assets`
3. Public bucket: ✅ 활성화

---

## 5. Row Level Security 설정

### 5.1 Storage RLS 정책

```sql
-- 읽기 정책 (누구나 읽을 수 있음)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'goedamjip-assets');

-- 업로드 정책 (anon 키로 업로드 가능)
CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'goedamjip-assets');

-- 삭제 정책 (anon 키로 삭제 가능)
CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'goedamjip-assets');

-- 업데이트 정책 (anon 키로 업데이트 가능)
CREATE POLICY "Public Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'goedamjip-assets');
```

### 5.2 Strapi 테이블 RLS 비활성화

Strapi는 자체 권한 시스템을 사용하므로 모든 테이블의 RLS를 비활성화합니다:

```sql
-- 예시
ALTER TABLE asset_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
-- ... 모든 Strapi 테이블에 대해 반복
```

---

## 6. 데이터 삽입 자동화

### 6.1 API 권한 설정

Strapi Admin → Settings → Users & Permissions → Roles → Public

다음 권한 활성화:

- Asset-category: find, findOne
- Asset-subcategory: find, findOne
- Asset: find, findOne
- Story: find, findOne

### 6.2 데이터 삽입 스크립트 (insert_strapi_data.js)

```javascript
const axios = require("axios");

const STRAPI_URL = "http://localhost:1337";

// 카테고리 데이터
const categories = [
  { name: "SOUND", description: "효과음 - 짧고 강렬한 사운드 효과" },
  { name: "TEXT", description: "텍스트 효과 - CSS/JS로 구현되는 글자 효과" },
  {
    name: "VISUAL",
    description: "화면 효과 - 전체 화면에 영향을 주는 시각 효과",
  },
  { name: "PAUSE", description: "일시정지 - 진행을 일시적으로 멈추는 효과" },
  { name: "AMBIENCE", description: "배경음 - 지속적으로 재생되는 환경음" },
];

async function insertData() {
  try {
    console.log("카테고리 삽입 중...");
    const categoryMap = {};

    for (const category of categories) {
      const response = await axios.post(`${STRAPI_URL}/api/asset-categories`, {
        data: category,
      });
      categoryMap[category.name] = response.data.data.id;
      console.log(`✅ 카테고리: ${category.name}`);
    }

    console.log("🎉 모든 데이터 삽입 완료!");
  } catch (error) {
    console.error("❌ 오류:", error.response?.data || error.message);
  }
}

insertData();
```

---

## 7. 문제 해결

### 7.1 네트워크 연결 문제

IPv6 주소 연결 문제가 발생할 경우, Supabase Pooler 연결 사용:

- 호스트: `aws-0-ap-northeast-2.pooler.supabase.com`
- 포트: `6543`

### 7.2 SSL 인증서 문제

자체 서명 인증서 오류 발생 시:

```
sslmode=disable 또는 sslmode=prefer 사용
```

### 7.3 RLS 정책 문제

"new row violates row-level security policy" 오류 시:

1. 해당 테이블의 RLS 비활성화
2. 또는 적절한 정책 생성

---

## 8. 추가 팁

### 8.1 개발/프로덕션 환경 분리

```javascript
// config/database.ts
const isDevelopment = env("NODE_ENV") === "development";

export default ({ env }) => {
  if (isDevelopment) {
    // SQLite 사용
    return {
      connection: {
        client: "sqlite",
        connection: {
          filename: ".tmp/data.db",
        },
        useNullAsDefault: true,
      },
    };
  } else {
    // Supabase PostgreSQL 사용
    return {
      connection: {
        client: "postgres",
        // ... PostgreSQL 설정
      },
    };
  }
};
```

### 8.2 환경 변수 보안

`.gitignore`에 추가:

```
.env
.env.local
```

### 8.3 백업 전략

정기적으로 데이터 백업:

```bash
# Strapi 데이터 내보내기
npm run strapi export -- --file backup.tar.gz

# Supabase 백업은 Dashboard에서 자동 관리
```

---

## 마무리

이 튜토리얼을 통해 Strapi와 Supabase를 통합한 강력한 콘텐츠 관리 시스템을 구축할 수 있습니다.

주요 장점:

- Strapi의 유연한 콘텐츠 모델링
- Supabase의 확장 가능한 PostgreSQL 데이터베이스
- 통합된 파일 스토리지 솔루션
- 세밀한 권한 관리

추가 리소스:

- [Strapi 공식 문서](https://docs.strapi.io)
- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL RLS 가이드](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
