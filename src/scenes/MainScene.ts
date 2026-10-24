import Phaser from 'phaser';
import { GIFT_ITEMS, STREAM_SCENES } from '../game/data/interactionCatalog';
import {
  epochMilliseconds,
  seconds,
  type GameState,
  type GiftItemDefinition,
  type SceneDefinition,
  type StreamerAttribute,
} from '../game/domain/types';
import { createInitialGameState } from '../game/state/createInitialGameState';
import { advanceGameSimulation } from '../game/simulation/advanceGame';
import { giveStreamerItem, moveStreamerToScene } from '../game/simulation/streamerInteractions';
import { loadGameState, saveGameState } from '../game/persistence/localSave';
import { resumeGameAfterOffline, type OfflineProgressRecap } from '../game/simulation/offlineProgress';
import { GorlCharacter } from './GorlCharacter';

const C = {
  bg: 0x0f0f0f, panel: 0x181818, raised: 0x242424, line: 0x303030,
  text: '#f1f1f1', muted: '#aaaaaa', red: 0xff0033, green: '#69d38a',
  purple: '#b9a8ff',
};
const SAVE_INTERVAL_MS = 5000;
const ONE_SECOND = seconds(1);
type ChannelTab = 'home' | 'live' | 'community';

export class MainScene extends Phaser.Scene {
  private gameState!: GameState;
  private root!: Phaser.GameObjects.Container;
  private stageRoot!: Phaser.GameObjects.Container;
  private modalRoot!: Phaser.GameObjects.Container;
  private character: GorlCharacter | null = null;
  private stageLayoutKey = '';
  private activeTab: ChannelTab = 'home';
  private toast: string | null = null;
  private offlineRecap: OfflineProgressRecap | null = null;
  private notice: string | null = null;
  private readonly saveOnHide = (): void => this.persist();

  constructor() { super('main'); }

  create(): void {
    const now = epochMilliseconds(Date.now());
    const loaded = loadGameState();
    if (loaded.status === 'loaded') {
      const resumed = resumeGameAfterOffline(loaded.state, now);
      this.gameState = resumed.state;
      this.offlineRecap = resumed.recap;
    } else {
      this.gameState = createInitialGameState(now);
      if (loaded.status === 'invalid') this.notice = 'A fresh channel is ready. Your previous save could not be read.';
    }
    this.root = this.add.container(0, 0);
    this.stageRoot = this.add.container(0, 0);
    this.modalRoot = this.add.container(0, 0).setDepth(1000);
    this.cameras.main.setBackgroundColor(C.bg);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.render, this);
    window.addEventListener('pagehide', this.saveOnHide);
    document.addEventListener('visibilitychange', this.saveOnHide);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.persist();
      window.removeEventListener('pagehide', this.saveOnHide);
      document.removeEventListener('visibilitychange', this.saveOnHide);
    });
    this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });
    this.time.addEvent({ delay: SAVE_INTERVAL_MS, loop: true, callback: this.persist, callbackScope: this });
    this.persist();
    this.render();
  }

  private tick(): void {
    if (this.offlineRecap) return;
    this.gameState = advanceGameSimulation(this.gameState, ONE_SECOND, epochMilliseconds(Date.now()));
    this.render();
  }

  private persist(): void {
    if (!this.gameState) return;
    const now = epochMilliseconds(Date.now());
    this.gameState = { ...this.gameState, lastActiveAt: now };
    if (!saveGameState(this.gameState, now)) this.notice = 'Local save is unavailable in this browser.';
  }

  private changeScene(scene: SceneDefinition): void {
    const result = moveStreamerToScene(this.gameState, scene.id);
    if (!result.ok) {
      this.notice = result.reason === 'attribute-maxed'
        ? `${scene.attribute} is maxed. Choose another scene to boost a different attribute.`
        : null;
      this.render();
      return;
    }
    this.gameState = result.state;
    this.notice = `${scene.name}: +${result.increase} ${result.attribute}`;
    this.character?.reactTo('scene', false);
    this.persist();
    this.render();
  }

  private giveItem(item: GiftItemDefinition): void {
    const result = giveStreamerItem(this.gameState, item.id);
    if (!result.ok) {
      this.notice = result.reason === 'attribute-maxed'
        ? `${item.attribute} is maxed. Choose a different gift.`
        : `Need ${item.cost} channel views to send ${item.name.toLowerCase()}.`;
      this.render();
      return;
    }
    this.gameState = result.state;
    this.notice = `${item.name} sent: +${result.increase} ${result.attribute}`;
    this.character?.reactTo('gift', false);
    this.persist();
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    this.modalRoot.removeAll(true);
    const width = this.scale.width;
    const height = this.scale.height;
    this.drawTopBar(width);
    this.drawChannelBanner(width);
    this.drawChannelIdentity(width);
    this.drawTabs(width);
    this.drawLiveSection(width, height);
    this.drawStatsAndInteraction(width, height);
    this.renderStage();
    this.renderRecap();
  }

  private drawTopBar(width: number): void {
    this.roundRect(0, 0, width, 54, C.panel, C.panel, 0);
    this.circle(31, 26, 13, C.red);
    const play = this.add.graphics();
    play.fillStyle(0xffffff, 1); play.fillTriangle(28, 19, 28, 33, 37, 26); this.root.add(play);
    this.text('YouTube', 51, 17, 18, C.text, true);
    if (width >= 600) {
      this.text('GORL', 126, 22, 10, C.muted, true);
      const searchWidth = Math.min(420, width * 0.38);
      const searchX = width * 0.5 - searchWidth * 0.5;
      this.roundRect(searchX, 10, searchWidth, 34, C.bg, C.line);
      this.text('Search this channel', searchX + 14, 20, 12, C.muted);
      this.circle(searchX + searchWidth + 25, 27, 17, C.raised);
      this.text('⌕', searchX + searchWidth + 15, 12, 23, C.text);
    }
    this.text(`${this.compact(this.gameState.views)} views`, width - 16, 20, 11, C.muted).setOrigin(1, 0);
  }

  private drawChannelBanner(width: number): void {
    const bannerY = 54;
    const bannerH = Math.min(115, Math.max(72, this.scale.height * 0.13));
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x382858, 0x31224b, 0x9a4969, 0x533250, 1);
    bg.fillRoundedRect(18, bannerY + 8, width - 36, bannerH, 12);
    bg.fillStyle(0xffd28e, 0.35); bg.fillCircle(width * 0.83, bannerY + 51, 39);
    bg.fillStyle(0x171426, 0.32); bg.fillEllipse(width * 0.64, bannerY + bannerH, width * 0.5, 65);
    this.root.add(bg);
    this.text('GORLWORLD LIVE', 42, bannerY + 27, Math.max(15, Math.min(23, width / 48)), '#fff7ff', true);
    this.text(width < 500 ? 'Foodie Beauty is live' : 'A cozy corner of the internet · live with Foodie Beauty', 42, bannerY + 58, 11, '#f0dff2');
  }

  private drawChannelIdentity(width: number): void {
    const y = 177;
    this.circle(58, y + 28, 28, 0x7861a2);
    this.circle(58, y + 28, 23, 0xdca17f);
    this.circle(50, y + 25, 2, 0x34262c); this.circle(66, y + 25, 2, 0x34262c);
    this.text('Foodie Beauty', 100, y + 3, Math.min(22, Math.max(17, width / 58)), C.text, true);
    const channelMeta = width < 440
      ? `${this.compact(this.gameState.fans)} fans · live · fan art`
      : `${this.compact(this.gameState.fans)} fans · 1 streamer · fan-made channel`;
    this.text(channelMeta, 100, y + 34, 11, C.muted);
    const subscribeW = width < 440 ? 108 : 126;
    this.pill(width - subscribeW - 24, y + 13, subscribeW, 34, 0xf1f1f1, 'SUBSCRIBED', C.bg);
  }

  private drawTabs(width: number): void {
    const y = 239;
    this.line(18, y + 35, width - 18, y + 35, C.line);
    const tabs: readonly { id: ChannelTab; label: string }[] = [
      { id: 'home', label: 'HOME' }, { id: 'live', label: 'LIVE' }, { id: 'community', label: 'ABOUT' },
    ];
    let x = 35;
    tabs.forEach((tab) => {
      const active = this.activeTab === tab.id;
      this.text(tab.label, x, y + 4, 11, active ? C.text : C.muted, active);
      if (active) this.line(x, y + 31, x + 35, y + 31, C.text, 2);
      const hit = this.add.zone(x - 8, y, 65, 34).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on(Phaser.Input.Events.POINTER_DOWN, () => { this.activeTab = tab.id; this.render(); });
      this.root.add(hit);
      x += tab.id === 'community' ? 90 : 72;
    });
  }

  private drawLiveSection(width: number, height: number): void {
    const mobile = width < 760;
    const top = 286;
    const bottom = Math.max(top + 190, height - 182);
    const areaH = bottom - top;
    const margin = width < 500 ? 14 : 22;
    const contentW = width - margin * 2;
    const chatW = mobile ? 0 : Math.min(260, contentW * 0.27);
    const gap = mobile ? 0 : 14;
    const videoW = contentW - chatW - gap;
    const scene = this.currentScene();
    this.stageBounds = { x: margin, y: top, width: videoW, height: areaH, color: scene.color };
    this.roundRect(margin, top, videoW, areaH, 0x201a2a, C.line, 8);
    this.pill(margin + 13, top + 12, 48, 22, C.red, 'LIVE', 0xffffff);
    this.text('FOODIE BEAUTY  ·  SEALING POSE FAN ART', margin + 73, top + 17, 9, '#e7dff0', true);
    if (mobile) {
      const sceneLabelY = top + areaH - 28;
      this.text(`LIVE FROM  ${scene.name.toUpperCase()}`, margin + 12, sceneLabelY, 10, C.text, true);
    }
    if (!mobile) this.drawChat(margin + videoW + gap, top, chatW, areaH);
  }

  private drawChat(x: number, y: number, width: number, height: number): void {
    this.roundRect(x, y, width, height, C.panel, C.line, 8);
    this.text('Live chat', x + 14, y + 13, 13, C.text, true);
    this.line(x + 12, y + 39, x + width - 12, y + 39, C.line);
    const lines = [
      ['GorlWatcher', 'the sealing pose is iconic'],
      ['cozy_couch_club', 'sending good vibes ✨'],
      ['snacktime', 'what are we eating today'],
      ['garden_gorl', 'love this little setup'],
      ['mod_gorl', 'be kind in chat 💜'],
      ['GorlWatcher', 'the stream looks so cozy'],
    ] as const;
    const lineH = Math.max(25, Math.min(42, (height - 78) / lines.length));
    lines.forEach(([name, message], index) => {
      const ly = y + 52 + index * lineH;
      this.text(name, x + 12, ly, 9, index % 2 ? '#80c2ff' : '#e8a6ca', true);
      this.text(message, x + 12, ly + 13, 10, C.text).setWordWrapWidth(width - 24);
    });
    this.roundRect(x + 10, y + height - 38, width - 20, 27, C.bg, C.line, 14);
    this.text('Chat as a fan…', x + 20, y + height - 30, 9, C.muted);
  }

  private drawStatsAndInteraction(width: number, height: number): void {
    const y = Math.max(0, height - 175);
    const margin = width < 500 ? 14 : 22;
    const sectionW = width - margin * 2;
    this.text('Foodie Beauty is live', margin, y, 15, C.text, true);
    this.text(`${this.compact(this.gameState.totalViewsEarned)} channel views · ${this.compact(this.gameState.fans)} fans · Live from ${this.currentScene().name}`,
      margin, y + 24, 10, C.muted);
    this.text(this.notice ?? 'Pick a scene or send a gift to shape the stream.', margin, y + 43, 10, this.notice ? C.purple : C.muted);

    const rowY = y + 64;
    const mobile = width < 760;
    const scenes = STREAM_SCENES;
    const items = GIFT_ITEMS;
    const cellGap = 7;
    const columns = mobile ? 4 : 4;
    const cellW = (sectionW - (columns - 1) * cellGap) / columns;
    scenes.forEach((scene, index) => {
      const x = margin + index * (cellW + cellGap);
      const active = this.gameState.currentSceneId === scene.id;
      const label = width < 500
        ? `${['Couch', 'Kitchen', 'Glam', 'Garden'][index]} +${scene.increase} ${this.attributeLabel(scene.attribute)}`
        : `${scene.name}  +${scene.increase} ${this.attributeLabel(scene.attribute)}`;
      this.smallAction(x, rowY, cellW, 36, active ? 0x493b62 : C.raised,
        label,
        () => this.changeScene(scene), active);
    });
    const itemY = rowY + 42;
    items.forEach((item, index) => {
      const x = margin + index * (cellW + cellGap);
      const canAfford = this.gameState.views >= item.cost;
      const shortNames = ['Snack', 'Blanket', 'Cardigan', 'Drink'] as const;
      this.smallAction(x, itemY, cellW, 36, canAfford ? C.raised : 0x202020,
        width < 500 ? `${shortNames[index]} · ${item.cost}` : `${item.name} · ${item.cost} views`,
        () => this.giveItem(item), false);
    });
    this.drawAttributeBars(margin, itemY + 43, sectionW);
  }

  private drawAttributeBars(x: number, y: number, width: number): void {
    const keys: readonly StreamerAttribute[] = ['comfort', 'style', 'energy', 'mood'];
    const gap = 12;
    const cellW = (width - gap * 3) / 4;
    keys.forEach((key, index) => {
      const bx = x + index * (cellW + gap);
      const value = this.gameState.streamerAttributes[key];
      this.text(`${this.attributeLabel(key)}  ${Math.round(value)}`, bx, y, 9, C.muted, true);
      this.roundRect(bx, y + 15, cellW, 5, C.raised, C.raised, 3);
      this.roundRect(bx, y + 15, cellW * value / 100, 5, key === 'energy' ? 0xe5a457 : 0x9a7fce, key === 'energy' ? 0xe5a457 : 0x9a7fce, 3);
    });
  }

  private renderStage(): void {
    const bounds = this.stageBounds;
    if (!bounds) return;
    const lastGiftId = this.gameState.deliveredItemIds.at(-1);
    const key = `${bounds.x}/${bounds.y}/${bounds.width}/${bounds.height}/${bounds.color}/${lastGiftId ?? ''}`;
    if (key === this.stageLayoutKey) return;
    this.stageRoot.removeAll(true);
    this.stageLayoutKey = key;
    const graphics = this.add.graphics();
    graphics.fillStyle(bounds.color, 0.44);
    graphics.fillRoundedRect(bounds.x + 3, bounds.y + 3, bounds.width - 6, bounds.height - 6, 7);
    graphics.fillStyle(0xf5d49c, 0.24);
    graphics.fillCircle(bounds.x + bounds.width * 0.82, bounds.y + bounds.height * 0.22, Math.min(36, bounds.height * 0.12));
    graphics.fillStyle(0x171426, 0.35);
    graphics.fillEllipse(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.91, bounds.width * 0.7, bounds.height * 0.32);
    this.stageRoot.add(graphics);
    const avatarX = bounds.x + bounds.width * 0.55;
    const avatarY = bounds.y + bounds.height * 0.7;
    this.character = new GorlCharacter(this, avatarX, avatarY, false);
    const scale = Math.min(1.4, Math.max(0.8, bounds.height / 300));
    this.character.setScale(scale);
    const lastGift = GIFT_ITEMS.find((item) => item.id === lastGiftId);
    if (lastGift) this.character.showReceivedItem(lastGift.kind, lastGift.color);
    this.stageRoot.add(this.character);
    this.stageBounds = null;
    this.stageLayoutKey = key;
    this.stageRoot.setDepth(10);
    this.children.bringToTop(this.stageRoot);
  }

  private renderRecap(): void {
    if (!this.offlineRecap) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.modalRoot.removeAll(true);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.74); dim.fillRect(0, 0, width, height);
    this.modalRoot.add(dim);
    const pw = Math.min(width - 32, 440); const ph = 220; const x = (width - pw) / 2; const y = (height - ph) / 2;
    const panel = this.add.graphics(); panel.fillStyle(C.panel, 1); panel.lineStyle(1, C.line, 1); panel.fillRoundedRect(x, y, pw, ph, 14); panel.strokeRoundedRect(x, y, pw, ph, 14);
    this.modalRoot.add(panel);
    const title = this.add.text(x + 20, y + 20, 'WHILE YOU WERE AWAY', { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#ffffff' });
    const views = this.add.text(x + 20, y + 62, `+${this.compact(this.offlineRecap.viewsEarned)} channel views`, { fontFamily: 'Arial', fontSize: '23px', fontStyle: 'bold', color: '#69d38a' });
    const line = this.add.text(x + 20, y + 106, `${this.compact(this.gameState.fans)} fans are watching Foodie Beauty`, { fontFamily: 'Arial', fontSize: '12px', color: '#cccccc' });
    const bg = this.add.graphics(); bg.fillStyle(C.red, 1); bg.fillRoundedRect(x + 20, y + ph - 56, pw - 40, 38, 10);
    const zone = this.add.zone(x + 20, y + ph - 56, pw - 40, 38).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.POINTER_DOWN, () => { this.offlineRecap = null; this.render(); });
    const button = this.add.text(x + pw / 2, y + ph - 46, 'RETURN TO LIVE', { fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    this.modalRoot.add([title, views, line, bg, zone, button]);
    this.children.bringToTop(this.modalRoot);
  }

  private smallAction(x: number, y: number, width: number, height: number, color: number, label: string, action: () => void, selected: boolean): void {
    const bg = this.add.graphics(); bg.fillStyle(color, 1); bg.lineStyle(1, selected ? 0x9b82d5 : C.line, 1); bg.fillRoundedRect(x, y, width, height, 8); bg.strokeRoundedRect(x, y, width, height, 8); this.root.add(bg);
    this.text(label, x + 8, y + 7, 9, C.text, selected).setWordWrapWidth(width - 16);
    const hit = this.add.zone(x, y, width, height).setOrigin(0).setInteractive({ useHandCursor: true }); hit.on(Phaser.Input.Events.POINTER_DOWN, action); this.root.add(hit);
  }

  private pill(x: number, y: number, width: number, height: number, color: number, label: string, textColor: number | string): void {
    this.roundRect(x, y, width, height, color, color, height / 2);
    this.text(label, x + width / 2, y + 5, 9, textColor, true).setOrigin(0.5, 0);
  }
  private roundRect(x: number, y: number, w: number, h: number, fill: number, stroke = fill, radius = 10): void {
    const g = this.add.graphics(); g.fillStyle(fill, 1); g.lineStyle(1, stroke, 1); g.fillRoundedRect(x, y, w, h, radius); g.strokeRoundedRect(x, y, w, h, radius); this.root.add(g);
  }
  private circle(x: number, y: number, r: number, color: number): void { const g = this.add.graphics(); g.fillStyle(color, 1); g.fillCircle(x, y, r); this.root.add(g); }
  private line(x1: number, y1: number, x2: number, y2: number, color: number | string, width = 1): void { const g = this.add.graphics(); g.lineStyle(width, this.colorValue(color), 1); g.lineBetween(x1, y1, x2, y2); this.root.add(g); }
  private text(value: string, x: number, y: number, size: number, color: number | string, bold = false): Phaser.GameObjects.Text {
    const node = this.add.text(x, y, value, { fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal', color: typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color, wordWrap: { width: 280 } }); this.root.add(node); return node;
  }
  private currentScene(): SceneDefinition { return STREAM_SCENES.find((scene) => scene.id === this.gameState.currentSceneId) ?? STREAM_SCENES[0]!; }
  private attributeLabel(attribute: StreamerAttribute): string { return attribute.toUpperCase(); }
  private compact(value: number): string { return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value); }
  private colorValue(color: number | string): number { return typeof color === 'number' ? color : Number.parseInt(color.replace('#', ''), 16); }
  private stageBounds: { x: number; y: number; width: number; height: number; color: number } | null = null;
}
