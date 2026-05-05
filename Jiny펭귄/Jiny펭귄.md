# Jiny펭귄 — 게임 기획서

> 버전: 0.4  
> 작성일: 2026-04-27  
> 장르: 프리 무브 엔드리스 러너 (Free-Move Endless Runner)  
> 플랫폼: 웹 (HTML5 / Canvas)  

---

## 1. 게임 개요

| 항목 | 내용 |
|------|------|
| 게임명 | Jiny펭귄 |
| 장르 | 프리 무브 엔드리스 러너 |
| 참고작 | 슈퍼펭귄 (Super Penguin) |
| 조작 | 키보드 (PC) / 터치 (모바일) |
| 목표 | 장애물을 피하고 최대한 오래 생존하며 최고 점수 달성 |

### 한 줄 설명
> 귀여운 펭귄 Jiny가 빙하 위를 자유롭게 좌우로 이동하며 장애물을 피하고, 물고기를 먹으며 생존하는 프리 무브 엔드리스 러너 게임.

---

## 2. 핵심 콘셉트

- **자유 횡이동**: 정해진 레인 없이 버튼을 누른 만큼 부드럽게 좌우 이동하며 장애물 회피
- **심플한 조작**: 점프·슬라이드에 좌우 이동을 조합해 모든 상황 대처
- **점진적 난이도**: 시간이 지날수록 속도가 빨라지고 장애물 패턴이 복잡해짐
- **수집 요소**: 물고기 아이템을 먹으면 점수 보너스 + 특수 능력 충전
- **귀여운 세계관**: 남극 빙하, 바다, 설산 등 3개 구간(Zone)

---

## 3. 게임플레이 상세

### 3-1. 기본 흐름

```
타이틀 화면
  └─> [게임 시작]
        └─> 게임플레이 (엔드리스)
              ├─ 장애물 회피 실패 → 게임오버 화면
              │     └─> [재시작] / [메인으로]
              └─ 생존 중 → 점수 누적, Zone 전환
```

### 3-2. 이동 구조

게임 화면은 세로 방향으로 진행되며, Jiny는 **플레이 필드 너비(world x: -4.5 ~ +4.5)** 안에서 자유롭게 좌우로 이동한다.  
고정 레인은 없으며, 좌우 입력을 누른 만큼 연속적으로 이동한다.

```
  ◀──────────────────────────────▶
  -4.5                          +4.5
  ┌──────────────────────────────┐
  │   (자유 이동 가능 구간)       │
  │          [Jiny]              │
  └──────────────────────────────┘
              ↑ 스크롤 방향
```

- 시작 위치: 화면 중앙 (x = 0)
- 이동 속도: 기본 `moveSpeed = 7 units/s`, 누르는 동안 계속 이동
- 벽 클램프: x가 ±4.5를 넘으면 이동 멈춤 (화면 밖으로 나가지 않음)
- 이동 중에도 점프·슬라이드 입력 가능 (복합 동작 허용)
- 이동에 **가벼운 관성** 적용: 입력을 떼면 약 0.08초 안에 자연스럽게 감속

### 3-3. 조작 체계

| 입력 | PC | 모바일 |
|------|----|--------|
| 왼쪽으로 이동 (누르는 동안) | ← / A | 화면 좌측 하단 ◀ 버튼 (누르는 동안) |
| 오른쪽으로 이동 (누르는 동안) | → / D | 화면 우측 하단 ▶ 버튼 (누르는 동안) |
| 점프 | Space / ↑ / W | 화면 중앙 하단 점프 버튼 (단일 탭) |
| 슬라이드(엎드리기) | ↓ / S | 화면 중앙 하단 점프 버튼 길게 누르기 (0.3초↑) |
| 슈퍼점프(2단) | Space 두 번 (공중에서) | 점프 버튼 두 번 (공중에서) |
| 일시정지 | P / Esc | 화면 상단 일시정지 버튼 |

> **모바일 HUD 레이아웃**
> ```
> ┌─────────────────────────────┐
> │  점수          Zone  [일시정지] │  ← 상단 HUD
> │                              │
> │        (게임 화면)            │
> │                              │
> │  [◀]      [점프/슬라이드]  [▶] │  ← 하단 조작 버튼
> └─────────────────────────────┘
> ```
> - `◀` / `▶` 는 누른 채로 유지하면 계속 이동, 떼면 감속·정지  
> - 점프 버튼: 짧게 탭 → 점프, 길게(0.3초↑) → 슬라이드, 공중 탭 → 2단점프

> **복합 입력 예시**  
> - `← + Space` : 왼쪽으로 이동하면서 동시에 점프  
> - `→ + ↓` : 오른쪽으로 이동하면서 슬라이드

### 3-4. 점수 시스템

| 이벤트 | 점수 |
|--------|------|
| 거리 1m 이동 | +1 |
| 물고기(작은 것) 획득 | +20 |
| 물고기(큰 것) 획득 | +50 |
| 장애물 근접 통과 (Near Miss) | +10 |
| Zone 클리어 보너스 | +200 |

- 점수는 실시간으로 화면 상단에 표시
- 최고 기록은 `localStorage`에 저장

### 3-5. 난이도 곡선

| 구간 | 속도 배율 | 장애물 간격 | 장애물 패턴 특징 |
|------|-----------|-------------|------------------|
| 0 ~ 500m | x1.0 | 넓음 | 너비 좁은 장애물, 이동 여유 충분 |
| 500 ~ 1500m | x1.3 | 보통 | 너비 넓은 장애물 + 틈 좁아짐, 점프+이동 조합 |
| 1500m~ | x1.6+ | 좁음 | 거의 전폭 압박, 슬라이드·2단점프 필수, 빠른 판단 요구 |

---

## 4. 등장 요소

### 4-1. 캐릭터 — Jiny

- **3D 모델** (GLTF/GLB 포맷), 스타일: 귀여운 Low-Poly 또는 Stylized 3D
- Three.js AnimationMixer로 애니메이션 관리:
  - `run` — 기본 달리기 루프
  - `jump` — 점프 & 착지
  - `slide` — 슬라이드(엎드리기)
  - `lean_left` / `lean_right` — 레인 이동 시 몸 기울임 트랜지션 (약 0.15초)
  - `die` — 충돌 사망 애니메이션
- 물고기 5마리 수집 시 **슈퍼 Jiny** 변신: 머티리얼 이미시브(Emissive) 강화 + 파티클 후광 + 속도 UP + 무적

### 4-2. 장애물

| 이름 | 설명 | 너비 (world units) | 회피 방법 |
|------|------|--------------------|-----------|
| 빙벽 (낮은) | 낮은 얼음 블록 | 2.0~3.5 | 좌우 이동 or 점프 |
| 빙벽 (높은) | 높은 얼음 블록 | 2.0~3.5 | 좌우 이동 (슬라이드 불가) |
| 물개 | 바닥에서 좌우 이동하는 적 | 1.5 (이동 중) | 좌우 이동 or 점프 |
| 고드름 | 천장에서 낮게 걸림 | 2.5~4.0 | 슬라이드 or 좌우 이동 |
| 크레바스 | 바닥 구멍 (낙하 판정) | 2.0~3.0 | 좌우 이동 or 점프로 넘기 |
| 북극곰 | 큰 적, 2칸 높이 | 3.0 | 좌우 이동 필수 (점프 불가) |
| 이중 빙벽 | 두 덩어리가 좁은 틈 남김 | 각 2.5 (틈 2.0) | 틈 사이로 정밀 이동 |

### 4-3. 아이템

| 이름 | 효과 |
|------|------|
| 작은 물고기 | +20점 |
| 큰 물고기 | +50점 + 슈퍼게이지 충전 |
| 별 | 3초 무적 |
| 자석 | 5초 동안 주변 아이템 자동 흡수 |

---

## 5. 화면 구성

### 5-1. 타이틀 화면
- 로고 (Jiny펭귄)
- 배경 애니메이션 (눈 내리는 빙하)
- [게임 시작] / [최고 기록] / [설정] 버튼

### 5-2. 게임 화면 HUD

```
┌──────────────────────────────────────┐
│  점수: 1,240     최고: 3,500    Zone 2│
│  [슈퍼게이지 ████░░]                 │
│                                      │
│                                      │
│         (자유 이동 게임 화면)         │
│              [Jiny]                  │
│                                      │
│  [◀]       [점프/슬라이드]       [▶] │  ← 모바일 전용
└──────────────────────────────────────┘
```

- 레인 구분선 없음 — 바닥 텍스처로 넓은 필드감 표현
- Jiny 발 아래에 살짝 밝은 그림자 원(블롭 섀도) 표시로 위치감 보조
- 모바일 버튼([◀] [▶] [점프])은 PC에서는 숨김 처리

### 5-3. 게임오버 화면
- "GAME OVER" 텍스트 + 펭귄 넘어지는 애니메이션
- 현재 점수 / 최고 기록
- [다시 시작] / [메인으로] 버튼

---

## 6. 세계관 & 비주얼

### 6-1. Zone 구성

| Zone | 배경 | 분위기 | BGM |
|------|------|--------|-----|
| Zone 1 — 빙하 | 하얀 눈밭, 파란 하늘 | 상쾌, 귀여움 | 경쾌한 8bit |
| Zone 2 — 바닷가 | 파도, 모래, 바위 | 활기참 | 리듬감 있는 팝 |
| Zone 3 — 설산 | 눈보라, 어두운 밤하늘, 오로라 | 긴장감 | 웅장한 전자음 |

### 6-2. 비주얼 스타일

| 항목 | 내용 |
|------|------|
| 렌더링 방식 | Three.js (WebGL) 풀 3D |
| 아트 스타일 | Stylized Low-Poly 3D (Temple Run / Subway Surfers 계열) |
| 카메라 | 3인칭 후방 추종 카메라 (캐릭터 뒤 위에서 약간 내려다보는 시점) |
| 조명 | DirectionalLight(태양광) + AmbientLight + 실시간 그림자(Shadow Map) |
| 팔레트 | 차갑고 선명한 블루·화이트·아이시 컬러 계열 |
| 포스트 프로세싱 | Bloom(빛 번짐), SSAO(주변광 차폐), Tone Mapping |
| 배경 | 3D 무한 생성 타일맵 + 원경 산/빙산 메시 레이어 |
| 파티클 | 눈보라(Snow Particle), 충돌 파편, 아이템 획득 이펙트 |
| 그림자 | 캐릭터·장애물 실시간 그림자 (PCFSoftShadowMap) |

---

## 7. 기술 아키텍처

### 7-1. 기술 스택

| 역할 | 기술 |
|------|------|
| 렌더링 | **Three.js r165+ (WebGL 2)** |
| 언어 | Vanilla JavaScript (ES6+) with JS Modules |
| 빌드 | Vite (빠른 번들링, Three.js 트리쉐이킹) |
| 3D 모델 | GLTF 2.0 / GLB 포맷 + `GLTFLoader` |
| 애니메이션 | Three.js `AnimationMixer` |
| 포스트 프로세싱 | `three/examples/jsm/postprocessing/` (EffectComposer, UnrealBloomPass) |
| 파티클 | Three.js `Points` + Custom ShaderMaterial 또는 `three-nebula` |
| 저장 | localStorage (최고 기록, 설정) |
| 에셋 | GLB 모델 + 텍스처(PNG/KTX2) + 사운드(Web Audio API) |

### 7-2. 파일 구조 (예정)

```
Jiny펭귄/
├── index.html              # 진입점 (HUD용 DOM 오버레이 포함)
├── Jiny펭귄.md             # 기획서 (이 파일)
├── vite.config.js          # Vite 빌드 설정
├── package.json
├── css/
│   └── style.css           # UI 오버레이(HUD) 스타일
├── js/
│   ├── main.js             # 진입점, 게임 상태 관리
│   ├── renderer.js         # Three.js WebGLRenderer, EffectComposer 설정
│   ├── scene.js            # Scene, 조명, 안개(Fog) 설정
│   ├── camera.js           # 3인칭 추종 카메라 로직
│   ├── player.js           # Jiny 3D 모델 로드, AnimationMixer, 레인 이동
│   ├── obstacle.js         # 장애물 3D 오브젝트 풀 & 패턴 생성
│   ├── item.js             # 아이템 3D 오브젝트 & 효과
│   ├── track.js            # 무한 레인 타일 생성 & 재활용
│   ├── particles.js        # 눈보라, 충돌 파편, 획득 이펙트 파티클
│   ├── ui.js               # DOM 기반 HUD, 화면 전환
│   └── utils.js            # 충돌 감지(AABB 3D), 공용 유틸
└── assets/
    ├── models/             # GLB 3D 모델
    │   ├── jiny.glb        # 펭귄 캐릭터 (애니메이션 포함)
    │   ├── obstacles/      # 빙벽, 물개, 북극곰 등 장애물 모델
    │   └── items/          # 물고기, 별, 자석 모델
    ├── textures/           # 텍스처 이미지 (PBR: albedo, normal, roughness)
    └── sounds/             # BGM, 효과음 (Web Audio API)
```

### 7-3. 핵심 클래스 설계 (초안)

```
Game (main.js)
 ├── 상태: TITLE | PLAYING | PAUSED | GAMEOVER
 ├── gameLoop(delta) — requestAnimationFrame 기반
 │
 ├── Renderer (renderer.js)
 │    ├── WebGLRenderer (antialias, shadowMap: PCFSoftShadowMap)
 │    ├── EffectComposer
 │    │    ├── RenderPass
 │    │    └── UnrealBloomPass (Zone별 강도 조절)
 │    └── render(scene, camera)
 │
 ├── SceneManager (scene.js)
 │    ├── THREE.Scene
 │    ├── DirectionalLight + shadow 설정
 │    ├── AmbientLight
 │    ├── Fog (Zone별 색상·농도 변경)
 │    └── switchZone(zone) — 조명·안개·배경 전환
 │
 ├── CameraController (camera.js)
 │    ├── PerspectiveCamera (FOV 60, 후방 추종)
 │    ├── target: Player 위치 기준 offset (뒤 +8, 위 +5)
 │    └── update(playerPosition) — lerp로 부드럽게 추종
 │
 ├── Player (player.js)
 │    ├── mesh: THREE.Group (GLTFLoader로 로드)
 │    ├── mixer: THREE.AnimationMixer
 │    ├── actions: { run, jump, slide, lean_left, lean_right, die }
 │    ├── x, vx (수평 위치 & 속도, 클램프: ±4.5)
 │    ├── y, vy (수직 위치 & 속도)
 │    ├── moveSpeed: 7 units/s (입력 중 목표 속도)
 │    ├── friction: 0.08s 감속 (입력 없을 때 관성 처리)
 │    ├── state: RUN | JUMP | SLIDE | DEAD
 │    ├── doubleJumpUsed: boolean (2단 점프 여부)
 │    ├── moveLeft() / moveRight() / stopMove() / jump() / slide()
 │    └── update(delta) / getHitbox()
 │
 ├── Track (track.js)
 │    ├── 타일 풀(pool): 전방 N개 유지, 후방 재활용
 │    ├── tileLength, scrollSpeed
 │    └── update(delta) — 타일 스크롤 & 재배치
 │
 ├── ObstacleManager (obstacle.js)
 │    ├── 오브젝트 풀 (THREE.Mesh 재활용)
 │    ├── 장애물마다 worldX, width, boundingBox 보유
 │    ├── 패턴 풀 (난이도별 패턴 선택 — 너비·배치 X 조합)
 │    └── spawn() / update(delta) / checkCollision(player)
 │
 ├── ItemManager (item.js)
 │    ├── 오브젝트 풀
 │    ├── 아이템마다 lane, type 보유
 │    ├── 회전 애니메이션 (mesh.rotation.y += delta)
 │    └── spawn() / update(delta) / collect(player)
 │
 ├── ParticleSystem (particles.js)
 │    ├── SnowParticles — 항상 활성, Zone별 밀도 조절
 │    ├── CollisionBurst — 충돌 시 파편 이펙트
 │    └── CollectEffect — 아이템 획득 시 반짝임
 │
 └── UI (ui.js)  ← DOM 오버레이 (canvas 위에 absolute 배치)
      └── updateHUD() / showGameOver() / showTitle()
```

### 7-4. 충돌 감지
- **AABB 3D 판정**: `THREE.Box3`로 플레이어·장애물 boundingBox 겹침 확인
- 캐릭터 hitbox는 실제 3D 모델보다 약간 작게 설정 (관대한 판정)
- 슬라이드 상태에서는 hitbox 높이를 절반으로 줄임 (고드름 통과)
- **크레바스(구멍) 판정**: 구멍 위에 투명한 트리거 박스 배치 → 플레이어 hitbox가 겹치면 낙하 처리
- **Z축 컬링**: 플레이어보다 5유닛 이상 뒤에 있는 장애물은 검사 생략 (연산 절약)

---

## 8. 개발 단계 (로드맵)

| 단계 | 내용 | 산출물 |
|------|------|--------|
| Phase 1 | 기본 뼈대 — 게임 루프, 3레인 구조, 캐릭터 레인 이동·점프·슬라이드 | 움직이는 펭귄 |
| Phase 2 | 장애물 생성 & 충돌, 게임오버 | 플레이 가능한 최소 버전 |
| Phase 3 | 아이템, 점수, HUD, localStorage | 점수 시스템 완성 |
| Phase 4 | 패럴렉스 배경, Zone 전환, 애니메이션 | 비주얼 완성 |
| Phase 5 | 사운드, 슈퍼 Jiny 변신, 폴리싱 | 최종 완성 |

---

## 9. 미결 사항 / 논의 필요

- [ ] 3D 모델 제작 방식: 직접 모델링(Blender) vs 무료 에셋(Sketchfab, Kenney.nl) vs AI 생성(Meshy, Tripo3D)
- [ ] 포스트 프로세싱 성능 부담 — 모바일에서 Bloom 비활성화 여부
- [ ] 카메라 FOV / 추종 거리 튜닝 (3인칭 시점 "답답함" 조정)
- [ ] 모바일 터치 지원을 초기부터 포함할지 (WebGL 모바일 성능 고려)
- [ ] BGM/효과음 직접 제작 vs 무료 에셋 사용
- [ ] Zone 수를 3개로 고정할지 무한 루프로 반복할지
- [ ] 리더보드(서버 연동) 기능 포함 여부
- [ ] Vite 빌드 vs CDN import (Three.js 번들 사이즈 ~600KB gzip)

---

*이 문서는 개발 진행에 따라 지속적으로 업데이트됩니다.*
