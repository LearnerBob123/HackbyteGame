/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Position {
  x: number;
  y: number;
  name?: string;
}

export type RumorCategory = "village" | "world" | "conspiracy";

export interface Rumor {
  id: string;
  text: string;
  isTrue: boolean;
  credibility: number;
  verificationLocation?: Position;
  tags: string[];
  category: RumorCategory;
}

export interface Location {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  border: string;
  clue?: string;
}
