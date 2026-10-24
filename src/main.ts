import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import './styles.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#171426',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1200,
    height: 760,
  },
  scene: [MainScene],
});

export default game;
