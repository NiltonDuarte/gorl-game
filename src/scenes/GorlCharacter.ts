import Phaser from 'phaser';
import type { GiftItemDefinition } from '../game/domain/types';

export type CharacterReaction = 'snip' | 'publish' | 'views' | 'gift' | 'scene';

/** Playful Gorlworld fan-art stand-in, posed in a low, reclined “sealing” lounge. */
export class GorlCharacter extends Phaser.GameObjects.Container {
  private readonly blinkEvent: Phaser.Time.TimerEvent | null;
  private readonly leftArm: Phaser.GameObjects.Container;
  private readonly rightArm: Phaser.GameObjects.Container;
  private eyes!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, reducedMotion: boolean) {
    super(scene, x, y);

    this.drawShadow(scene);
    this.drawHair(scene);
    this.leftArm = this.createBracingArm(scene, -31, 17, -13);
    this.rightArm = this.createBracingArm(scene, 31, 17, 13);
    this.drawOutfit(scene);
    this.drawFace(scene);
    this.drawLegs(scene);

    if (reducedMotion) {
      this.blinkEvent = null;
      return;
    }

    scene.tweens.add({
      targets: this,
      y: y - 2,
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.leftArm,
      angle: -10,
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    scene.tweens.add({
      targets: this.rightArm,
      angle: 10,
      duration: 1650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    this.blinkEvent = scene.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => this.blink(),
    });
  }

  reactTo(reaction: CharacterReaction, reducedMotion: boolean): void {
    if (reducedMotion) {
      return;
    }

    if (reaction === 'publish') {
      this.scene.tweens.add({
        targets: [this.leftArm, this.rightArm],
        angle: 0,
        duration: 180,
        yoyo: true,
        repeat: 1,
        ease: 'Back.Out',
      });
      return;
    }

    this.scene.tweens.add({
      targets: this,
      scaleY: reaction === 'views' ? 1.09 : 1.05,
      duration: reaction === 'views' ? 260 : 180,
      yoyo: true,
      repeat: 1,
      ease: 'Back.Out',
    });
  }

  showReceivedItem(kind: GiftItemDefinition['kind'], color: number): void {
    const marker = this.scene.add.graphics();
    if (kind === 'wearable') {
      marker.fillStyle(color, 1);
      marker.fillRoundedRect(-31, 7, 62, 10, 5);
      marker.fillTriangle(-25, 13, -15, 13, -20, 28);
    } else if (kind === 'food') {
      marker.fillStyle(0xf4e9db, 1);
      marker.fillEllipse(-47, 5, 34, 13);
      marker.fillStyle(color, 1);
      marker.fillCircle(-53, 1, 5);
      marker.fillCircle(-43, -1, 4);
      marker.fillCircle(-35, 2, 3);
    } else {
      marker.fillStyle(color, 0.88);
      marker.fillEllipse(0, 31, 82, 20);
      marker.fillStyle(0xffffff, 0.45);
      marker.fillEllipse(-20, 29, 9, 3);
      marker.fillEllipse(19, 30, 9, 3);
    }
    this.add(marker);
  }

  override destroy(fromScene?: boolean): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.leftArm);
    this.scene.tweens.killTweensOf(this.rightArm);
    this.scene.tweens.killTweensOf(this.eyes);
    this.blinkEvent?.remove(false);
    super.destroy(fromScene);
  }

  private drawShadow(scene: Phaser.Scene): void {
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x100e1c, 0.32);
    shadow.fillEllipse(0, 42, 115, 17);
    this.add(shadow);
  }

  private drawHair(scene: Phaser.Scene): void {
    const hair = scene.add.graphics();
    hair.fillStyle(0x30202d, 1);
    hair.fillEllipse(0, -15, 66, 76);
    hair.fillRoundedRect(-30, -25, 13, 44, 7);
    hair.fillRoundedRect(17, -27, 13, 45, 7);
    hair.fillStyle(0x513449, 0.9);
    hair.fillEllipse(-20, -5, 8, 27);
    hair.fillEllipse(20, -7, 8, 28);
    this.add(hair);
  }

  private createBracingArm(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
  ): Phaser.GameObjects.Container {
    const arm = scene.add.container(x, y);
    arm.setAngle(angle);
    const shape = scene.add.graphics();
    shape.fillStyle(0xe5a77f, 1);
    shape.fillRoundedRect(-7, -2, 14, 29, 7);
    shape.fillStyle(0xf0b78d, 1);
    shape.fillEllipse(0, 29, 22, 11);
    arm.add(shape);
    this.add(arm);
    return arm;
  }

  private drawOutfit(scene: Phaser.Scene): void {
    const outfit = scene.add.graphics();
    outfit.lineStyle(2, 0x422d48, 0.9);
    outfit.fillStyle(0x586e64, 1);
    outfit.fillEllipse(0, 18, 89, 52);
    outfit.strokeEllipse(0, 18, 89, 52);
    outfit.fillStyle(0x75877a, 0.72);
    outfit.fillEllipse(0, 15, 48, 26);
    outfit.fillStyle(0xd6b45f, 1);
    outfit.fillCircle(0, 21, 3);
    this.add(outfit);
  }

  private drawFace(scene: Phaser.Scene): void {
    const face = scene.add.graphics();
    face.lineStyle(2, 0x6d443b, 0.75);
    face.fillStyle(0xf0b88f, 1);
    face.fillEllipse(0, -19, 46, 50);
    face.strokeEllipse(0, -19, 46, 50);
    face.fillStyle(0x30202d, 1);
    face.beginPath();
    face.moveTo(-22, -31);
    face.lineTo(-18, -46);
    face.lineTo(-4, -42);
    face.lineTo(6, -46);
    face.lineTo(20, -38);
    face.lineTo(21, -28);
    face.lineTo(7, -34);
    face.lineTo(-7, -32);
    face.closePath();
    face.fillPath();

    face.lineStyle(2, 0xd6b45f, 0.95);
    face.strokeCircle(-23, -10, 5);
    face.strokeCircle(23, -10, 5);
    this.add(face);

    this.eyes = scene.add.graphics();
    this.eyes.fillStyle(0xfffaf7, 1);
    this.eyes.fillEllipse(-9, -20, 8, 10);
    this.eyes.fillEllipse(9, -20, 8, 10);
    this.eyes.fillStyle(0x34262c, 1);
    this.eyes.fillCircle(-8, -19, 2.7);
    this.eyes.fillCircle(10, -19, 2.7);
    this.eyes.lineStyle(2, 0x75464b, 1);
    this.eyes.beginPath();
    this.eyes.moveTo(-5, -5);
    this.eyes.lineTo(0, -2);
    this.eyes.lineTo(5, -5);
    this.eyes.strokePath();
    this.add(this.eyes);
  }

  private drawLegs(scene: Phaser.Scene): void {
    const legs = scene.add.graphics();
    legs.fillStyle(0x33303d, 1);
    legs.fillEllipse(-22, 40, 35, 15);
    legs.fillEllipse(22, 40, 35, 15);
    legs.fillStyle(0x8d78bd, 1);
    legs.fillEllipse(-29, 43, 23, 10);
    legs.fillEllipse(29, 43, 23, 10);
    this.add(legs);
  }

  private blink(): void {
    this.scene.tweens.add({
      targets: this.eyes,
      scaleY: 0.08,
      duration: 90,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.InOut',
    });
  }
}
