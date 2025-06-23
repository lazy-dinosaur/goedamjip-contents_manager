const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

// 카테고리 데이터
const categories = [
  { name: 'SOUND', description: '효과음 - 짧고 강렬한 사운드 효과' },
  { name: 'TEXT', description: '텍스트 효과 - CSS/JS로 구현되는 글자 효과' },
  { name: 'VISUAL', description: '화면 효과 - 전체 화면에 영향을 주는 시각 효과' },
  { name: 'PAUSE', description: '일시정지 - 진행을 일시적으로 멈추는 효과' },
  { name: 'AMBIENCE', description: '배경음 - 지속적으로 재생되는 환경음' }
];

// 서브카테고리 데이터
const subcategories = [
  { name: '기본/충격', description: '갑작스러운 사건이나 긴장감 고조용 사운드', category_name: 'SOUND' },
  { name: '발걸음/움직임', description: '보이지 않는 존재의 움직임을 암시하거나 주인공의 상황과 환경을 묘사', category_name: 'SOUND' },
  { name: '목소리/심리', description: '인간의 목소리나 심리적 효과를 나타내는 사운드', category_name: 'SOUND' },
  { name: '자연/동물', description: '자연 환경이나 동물 관련 사운드', category_name: 'SOUND' },
  { name: '물체/재질', description: '다양한 물체나 재질이 만들어내는 소리', category_name: 'SOUND' },
  { name: '기술/도시/제도', description: '현대 문명과 관련된 사운드', category_name: 'SOUND' },
  { name: '크리처', description: '괴물이나 초자연적 존재의 소리', category_name: 'SOUND' },
  { name: '녹음/재생', description: '오디오 기기 관련 사운드', category_name: 'SOUND' },
  { name: '화기/폭발', description: '불이나 폭발과 관련된 사운드', category_name: 'SOUND' },
  { name: '기본효과', description: '텍스트에 적용되는 기본적인 시각 효과', category_name: 'TEXT' },
  { name: '화면전체', description: '화면 전체에 영향을 주는 효과', category_name: 'VISUAL' },
  { name: '조명', description: '빛과 관련된 화면 효과', category_name: 'VISUAL' },
  { name: '오버레이/필터', description: '화면 위에 덧씌워지는 이미지나 필터 효과', category_name: 'VISUAL' }
];

// 샘플 에셋 데이터
const assets = [
  // SOUND 에셋들
  {
    tag_name: 'DOOR_CREAK_SLOW',
    display_name: '낡은 문이 천천히 열리는 소리',
    description: '낡고 무거운 나무나 쇠문이 천천히, 길게 열리는 소리. \'끼이이이익\' 하는 신경을 긁는 듯한 사운드',
    usage_guide: '오래된 건물 진입, 숨겨진 방 발견, 불길한 공간으로의 이동 시 사용. 긴장감을 서서히 고조시킬 때 효과적',
    keywords: 'door creak slow;heavy door open slow;creepy door creaking;horror door sound',
    implementation_type: 'file',
    is_active: true,
    category_name: 'SOUND',
    subcategory_name: '기본/충격'
  },
  {
    tag_name: 'FOOTSTEPS_WOOD_SLOW',
    display_name: '나무 바닥 느린 발걸음',
    description: '낡은 마룻바닥을 천천히 걷는 발소리. 나무가 \'삐걱\'거리는 소리 포함',
    usage_guide: '조심스러운 탐색, 누군가의 접근, 긴장감 있는 이동 표현',
    keywords: 'creaky wood floor steps;slow walking wood floor sfx;horror wood footsteps',
    implementation_type: 'file',
    is_active: true,
    category_name: 'SOUND',
    subcategory_name: '발걸음/움직임'
  },
  // TEXT 에셋들
  {
    tag_name: 'SHAKE',
    display_name: '텍스트 흔들림',
    description: '텍스트가 좌우로 흔들리는 효과',
    usage_guide: '충격, 공포, 불안정한 상황에서 짧은 단어나 문장에 사용',
    keywords: 'shake',
    implementation_type: 'code',
    is_active: true,
    category_name: 'TEXT',
    subcategory_name: '기본효과'
  },
  {
    tag_name: 'BLUR',
    display_name: '텍스트 흐림',
    description: '텍스트가 흐릿하게 변하는 효과',
    usage_guide: '혼란, 왜곡된 시야, 의식 잃기 전 상황 표현',
    keywords: 'blur',
    implementation_type: 'code',
    is_active: true,
    category_name: 'TEXT',
    subcategory_name: '기본효과'
  },
  // PAUSE 에셋들
  {
    tag_name: 'SHORT',
    display_name: '짧은 멈춤',
    description: '약 0.5초의 짧은 일시정지',
    usage_guide: '짧은 망설임, 숨 고르기, 문장 사이 리듬 조절',
    keywords: 'short pause',
    implementation_type: 'code',
    is_active: true,
    category_name: 'PAUSE',
    subcategory_name: null
  },
  // AMBIENCE 에셋들
  {
    tag_name: 'CREEPY_DRONE_START',
    display_name: '으스스한 드론음 시작',
    description: '낮고 불길한 배경음 시작',
    usage_guide: '불안감 조성, 긴장 유지, 기본 공포 분위기',
    keywords: 'creepy drone loop;dark ambient drone;horror atmosphere',
    implementation_type: 'file',
    is_active: true,
    category_name: 'AMBIENCE',
    subcategory_name: null
  }
];

async function insertData() {
  try {
    console.log('카테고리 삽입 중...');
    const categoryMap = {};
    
    for (const category of categories) {
      const response = await axios.post(`${STRAPI_URL}/api/asset-categories`, {
        data: category
      });
      categoryMap[category.name] = response.data.data.id;
      console.log(`✅ 카테고리: ${category.name}`);
    }

    console.log('서브카테고리 삽입 중...');
    const subcategoryMap = {};
    
    for (const subcategory of subcategories) {
      const categoryId = categoryMap[subcategory.category_name];
      const response = await axios.post(`${STRAPI_URL}/api/asset-subcategories`, {
        data: {
          name: subcategory.name,
          description: subcategory.description,
          category: categoryId
        }
      });
      subcategoryMap[subcategory.name] = response.data.data.id;
      console.log(`✅ 서브카테고리: ${subcategory.name}`);
    }

    console.log('에셋 삽입 중...');
    
    for (const asset of assets) {
      const categoryId = categoryMap[asset.category_name];
      const subcategoryId = asset.subcategory_name ? subcategoryMap[asset.subcategory_name] : null;
      
      const assetData = {
        tag_name: asset.tag_name,
        display_name: asset.display_name,
        description: asset.description,
        usage_guide: asset.usage_guide,
        keywords: asset.keywords,
        implementation_type: asset.implementation_type,
        is_active: asset.is_active,
        category: categoryId
      };
      
      if (subcategoryId) {
        assetData.subcategory = subcategoryId;
      }

      const response = await axios.post(`${STRAPI_URL}/api/assets`, {
        data: assetData
      });
      console.log(`✅ 에셋: ${asset.tag_name}`);
    }

    console.log('🎉 모든 데이터 삽입 완료!');
    
  } catch (error) {
    console.error('❌ 오류:', error.response?.data || error.message);
  }
}

// 실행
insertData();