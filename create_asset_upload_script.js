const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const assetBasePath = '/home/lazydino/OneDrive/앱/remotely-save/notes/1.project/괴담집/괴담집 에셋/에셋';

// 파일 경로 매핑
const filePathMapping = {
  // 배경음
  'CREEPY_DRON': '배경음/CREEPY_DRON.mp3',
  'DEEP_SILENCE_UNNERVING': '배경음/DEEP_SILENCE_UNNERVING.mp3',
  'EMPTY_HALLWAY_ECHO': '배경음/EMPTY_HALLWAY_ECHO.mp3',
  'FOREST_NIGHT_AMBIENCE': '배경음/FOREST_NIGHT_AMBIENCE.mp3',
  'RAIN_HEAVY': '배경음/RAIN_HEAVY.mp3',
  'TENSION_MUSIC': '배경음/TENSION_MUSIC.mp3',
  'WIND_HOWLING': '배경음/WIND_HOWLING.mp3',
  
  // 효과음 - 기본/충격
  'DOOR_CREAK_SLOW': '효과음/기본_충격/DOOR_CREAK_SLOW.mp3',
  'DOOR_SLAM': '효과음/기본_충격/DOOR_SLAM.mp3',
  'GLASS_SHATTER': '효과음/기본_충격/GLASS_SHATTER.mp3',
  'KNOCK_HEAVY': '효과음/기본_충격/KNOCK_HEAVY.mp3',
  'METAL_IMPACT_DULL': '효과음/기본_충격/METAL_IMPACT_DULL.mp3',
  'WOOD_SPLINTERING': '효과음/기본_충격/WOOD_SPLINTERING.mp3',
  
  // 효과음 - 발걸음/움직임
  'CLOTH_DRAGGING': '효과음/발걸음_움직임/CLOTH_DRAGGING.mp3',
  'FOOTSTEPS_LEAVES': '효과음/발걸음_움직임/FOOTSTEPS_LEAVES.mp3',
  'FOOTSTEPS_MUD': '효과음/발걸음_움직임/FOOTSTEPS_MUD.mp3',
  'FOOTSTEPS_RUNNING': '효과음/발걸음_움직임/FOOTSTEPS_RUNNING.mp3',
  'FOOTSTEPS_TUNNEL': '효과음/발걸음_움직임/FOOTSTEPS_TUNNEL.mp3',
  'FOOTSTEPS_WOOD_SLOW': '효과음/발걸음_움직임/FOOTSTEPS_WOOD_SLOW.mp3',
  'RUSTLING_BUSHES_CLOSE': '효과음/발걸음_움직임/RUSTLING_BUSHES_CLOSE.mp3',
  'SLITHERING_ON_FLOOR': '효과음/발걸음_움직임/SLITHERING_ON_FLOOR.mp3',
  'TWIG_SNAP_CLOSE': '효과음/발걸음_움직임/TWIG_SNAP_CLOSE.mp3',
  
  // 효과음 - 목소리/심리
  'BREATHING_HEAVY': '효과음/목소리_심리/BREATHING_HEAVY.mp3',
  'CRYING_MUFFLED_DISTANT': '효과음/목소리_심리/CRYING_MUFFLED_DISTANT.mp3',
  'GASP_OTHER_PERSON': '효과음/목소리_심리/GASP_OTHER_PERSON.mp3',
  'HEARTBEAT_FAST': '효과음/목소리_심리/HEARTBEAT_FAST.mp3',
  'HEARTBEAT_SUDDEN_LOUD': '효과음/목소리_심리/HEARTBEAT_SUDDEN_LOUD.mp3',
  'HIGH_PITCH_RINGING_EARS': '효과음/목소리_심리/HIGH_PITCH_RINGING_EARS.mp3',
  'RUMBLE_LOW_FREQUENCY_DEEP': '효과음/목소리_심리/RUMBLE_LOW_FREQUENCY_DEEP.mp3',
  'SCREAM_SHORT': '효과음/목소리_심리/SCREAM_SHORT.mp3',
  'SWALLOWING_NERVOUS': '효과음/목소리_심리/SWALLOWING_NERVOUS.mp3',
  'TONE_HIGH_PITCH_UNNERVING': '효과음/목소리_심리/TONE_HIGH_PITCH_UNNERVING.mp3',
  'VOICE_REVERSED': '효과음/목소리_심리/VOICE_REVERSED.mp3',
  'WHISPERS_CHAOTIC_OVERLAPPING': '효과음/목소리_심리/WHISPERS_CHAOTIC_OVERLAPPING.mp3',
  'WHISPER_CLEAR_WORD_RUN': '효과음/목소리_심리/WHISPER_CLEAR_WORD_RUN.mp3',
  'WHISPER_INDISTINCT_CLOSE': '효과음/목소리_심리/WHISPER_INDISTINCT_CLOSE.mp3'
};

async function updateAssetFileUrls() {
  try {
    // 모든 에셋 조회
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('implementation_type', 'file');

    if (error) {
      console.error('에셋 조회 실패:', error);
      return;
    }

    console.log(`총 ${assets.length}개의 파일 에셋을 처리합니다.`);

    for (const asset of assets) {
      const relativePath = filePathMapping[asset.tag_name];
      if (relativePath) {
        const fullPath = path.join(assetBasePath, relativePath);
        
        // 파일 존재 확인
        if (fs.existsSync(fullPath)) {
          // file_url 업데이트 (로컬 경로로 임시 설정)
          const { error: updateError } = await supabase
            .from('assets')
            .update({ file_url: fullPath })
            .eq('id', asset.id);

          if (updateError) {
            console.error(`${asset.tag_name} 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ ${asset.tag_name}: ${fullPath}`);
          }
        } else {
          console.warn(`⚠️  파일 없음: ${asset.tag_name} - ${fullPath}`);
        }
      } else {
        console.warn(`⚠️  매핑 없음: ${asset.tag_name}`);
      }
    }

    console.log('파일 URL 업데이트 완료');
  } catch (error) {
    console.error('처리 중 오류:', error);
  }
}

// 실행
if (require.main === module) {
  updateAssetFileUrls();
}

module.exports = { updateAssetFileUrls, filePathMapping };