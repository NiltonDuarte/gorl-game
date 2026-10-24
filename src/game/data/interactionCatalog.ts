import { itemId, sceneId, views, type GiftItemDefinition, type SceneDefinition } from '../domain/types';

/** Fictional fan-made spaces and gifts. Each interaction changes exactly one stat. */
export const STREAM_SCENES: readonly SceneDefinition[] = [
  { id: sceneId('cozy-couch'), name: 'Cozy Couch', description: 'A soft place to settle in.', attribute: 'comfort', increase: 8, color: 0x8269b8 },
  { id: sceneId('kitchen-cam'), name: 'Kitchen Cam', description: 'A little kitchen-side energy.', attribute: 'energy', increase: 8, color: 0xd78c58 },
  { id: sceneId('glam-corner'), name: 'Glam Corner', description: 'A brighter look for the live.', attribute: 'style', increase: 8, color: 0xb76d9c },
  { id: sceneId('garden-patio'), name: 'Garden Patio', description: 'Fresh air and a calmer mood.', attribute: 'mood', increase: 8, color: 0x6d9b79 },
];

export const GIFT_ITEMS: readonly GiftItemDefinition[] = [
  { id: itemId('snack-plate'), name: 'Snack plate', description: '+8 energy', kind: 'food', cost: views(20), attribute: 'energy', increase: 8, color: 0xf2b35e },
  { id: itemId('cozy-blanket'), name: 'Cozy blanket', description: '+8 comfort', kind: 'comfort', cost: views(25), attribute: 'comfort', increase: 8, color: 0x9d8bd0 },
  { id: itemId('sparkly-cardigan'), name: 'Sparkly cardigan', description: '+8 style', kind: 'wearable', cost: views(30), attribute: 'style', increase: 8, color: 0xe58cbe },
  { id: itemId('fancy-drink'), name: 'Fancy drink', description: '+8 mood', kind: 'food', cost: views(24), attribute: 'mood', increase: 8, color: 0x78c5b0 },
];
