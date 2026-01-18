export const VIDEO_PATH = '/videos/Falling.mp4';

export const HERO_GLBS_PHASE1 = [
  '/models/onepiece.glb',
  '/models/setup.glb',
  '/models/sopranos.glb',
  '/models/bb.glb',
  '/models/mug1.glb',
  '/models/mug2.glb',
  '/models/arsenal.glb',
  '/models/basketball.glb',
  '/models/ps5.glb',
  '/models/xm5.glb',
  '/models/train.glb',
];

export const HERO_GLBS_PHASE2 = [
  '/models/monitor.glb',
  '/models/samsung.glb',
  '/models/tv.glb',
];

export const HERO_GLBS = [
  ...HERO_GLBS_PHASE1,
  ...HERO_GLBS_PHASE2,
];

export const HORSE_MODELS = [
  '/models/horse/model_0.glb',
  '/models/horse/model_1.glb',
  '/models/horse/model_2.glb',
  '/models/horse/model_3.glb',
  '/models/horse/model_4.glb',
];

const HORSE_TEXTURES = [
  '/models/horse/Horse_low0_albedo.png',
  '/models/horse/Horse_low0_normal.png',
  '/models/horse/Horse_low0_roughness.png',
  '/models/horse/Horse_low0_AO.png',
  '/models/horse/Horse_low0_metallic.png',
];

export const OBJ_URLS = [
  '/models/IronThrone/model_0.obj',
  '/models/IronThrone/model_1.obj',
];

export const CITY_GLTF_PATH = '/models/city/scene.gltf';
export const CITY_GLBS = [
  '/models/df.glb',
  '/models/dfnika.glb',
  '/models/dfoonm.glb',
  '/models/dfdf.glb',
];

const THRONE_TEX = [
  '/models/IronThrone/sword_UV5.png',
];

const SHOWCASE_IMG = [
  '/models/images/naivetyhead.png',
  '/models/images/sscureapt.png',
  '/models/images/ssunagi.png',
  '/models/images/ssunagis.png',
  '/models/images/sslinkedin.png',
  '/models/images/ssnaivety.png',
];

export const IMAGE_URLS = [
  ...THRONE_TEX,
  ...SHOWCASE_IMG,
  ...HORSE_TEXTURES,
];

// NEW: split images for phase loading
export const PHASE1_IMAGES = [
  ...HORSE_TEXTURES,
];

export const PHASE2_IMAGES = [
  ...THRONE_TEX,
  ...SHOWCASE_IMG,
];

export const ASSET_MANIFEST = {
  video: VIDEO_PATH,
  phase1Glbs: [...HERO_GLBS_PHASE1, ...HORSE_MODELS],
  phase2Glbs: [CITY_GLTF_PATH, ...CITY_GLBS, ...HERO_GLBS_PHASE2],
  phase1Images: [...PHASE1_IMAGES],
  phase2Images: [...PHASE2_IMAGES],
  phase1Objs: [],
  phase2Objs: [...OBJ_URLS],
};