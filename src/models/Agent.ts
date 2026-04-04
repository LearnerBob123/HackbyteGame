/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position } from '../types';
import { MAP_SIZE, TILE_MAP } from '../data/map';
import { RUMORS } from '../data/rumors';

export type AgentRole = 'villager' | 'oracle';

export class Agent {
  id: number;
  name: string;
  color: string;
  
  // State
  pos: Position;
  knownRumors: string[] = [];
  isBackground: boolean = false;
  isStationary: boolean = false;
  role: AgentRole = 'villager';
  title?: string;
  intro?: string;

  constructor(id: number, name: string, color: string) {
    this.id = id;
    this.name = name;
    this.color = color;
    
    let spawned = false;
    while (!spawned) {
      const rx = Math.floor(Math.random() * MAP_SIZE);
      const ry = Math.floor(Math.random() * MAP_SIZE);
      if (TILE_MAP[ry][rx] !== 2 && TILE_MAP[ry][rx] !== 5) {
        this.pos = { x: rx, y: ry };
        spawned = true;
      }
    }
  }

  move() {
    if (this.isStationary) return;

    const directions = [
      { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
    ];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const newX = Math.max(0, Math.min(MAP_SIZE - 1, this.pos.x + dir.x));
    const newY = Math.max(0, Math.min(MAP_SIZE - 1, this.pos.y + dir.y));

    const tile = TILE_MAP[newY][newX];
    if (tile !== 2 && tile !== 5) {
      this.pos = { x: newX, y: newY };
    }
  }

  receiveRumor(rumorId: string) {
    if (this.knownRumors.includes(rumorId)) return false;
    this.knownRumors.push(rumorId);
    return true;
  }
}
