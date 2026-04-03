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

export const RUMORS: Rumor[] = [
  {
    id: "drone-banyan",
    text: "I couldn't sleep last night. I swear I saw a strange drone with a blinking blue light hovering near the Old Banyan Tree.",
    isTrue: true,
    credibility: 0.9,
    verificationLocation: { x: 17, y: 19, name: "Old Banyan Tree" },
    tags: ["banyan", "tree", "drone", "light"],
    category: "village"
  },
  {
    id: "pump-north",
    text: "The water pump at the North Fields turned on by itself at midnight. I went to check and saw someone in a dark hoodie running towards the Cybercafe.",
    isTrue: true,
    credibility: 0.8,
    verificationLocation: { x: 26, y: 6, name: "North Fields" },
    tags: ["north", "fields", "pump", "hoodie", "cybercafe"],
    category: "village"
  },
  {
    id: "flyers-hall",
    text: "Someone is printing fake flyers trying to incite a riot. I found a fresh stack of them near the Village Hall dumpster. They smelled like expensive, chemical ink from the city.",
    isTrue: true,
    credibility: 0.85,
    verificationLocation: { x: 4, y: 34, name: "Village Hall" },
    tags: ["village", "hall", "flyers", "ink", "riot"],
    category: "village"
  },
  {
    id: "wifi-library",
    text: "The free Wi-Fi at the Library is compromised. It keeps redirecting to a fake login page. Someone definitely tampered with the main router.",
    isTrue: true,
    credibility: 0.95,
    verificationLocation: { x: 17, y: 34, name: "Library" },
    tags: ["library", "wifi", "router", "login"],
    category: "village"
  },
  {
    id: "tracks-warehouse",
    text: "I saw fresh, heavy tire tracks leading up to the Abandoned Warehouse on the edge of town. Nobody has used that place in years, but there's a shiny new padlock on the door.",
    isTrue: true,
    credibility: 0.8,
    verificationLocation: { x: 29, y: 34, name: "Abandoned Warehouse" },
    tags: ["warehouse", "tracks", "padlock", "tire"],
    category: "village"
  }
];

export const DIALOGUE_FLAVOR = [
  "I heard something interesting today...",
  "Don't tell anyone I told you this, but...",
  "Have you been keeping up with the latest whispers?",
  "The village is full of strange stories lately.",
  "I'm not sure if it's true, but people are saying...",
  "I saw something odd near the edge of town.",
  "The wind carries many secrets in this village.",
  "You look like someone who appreciates a good story."
];

export const LOCATIONS = [
  { id: 'cafe', name: 'Chai Nashta Point', emoji: '☕', x: 2, y: 2, w: 8, h: 8, color: 'bg-orange-900/20', border: 'border-orange-900/50' },
  { id: 'banyan_tree', name: 'Old Banyan Tree', emoji: '🌳', x: 14, y: 16, w: 6, h: 6, color: 'bg-green-900/20', border: 'border-green-900/50' },
  { id: 'north_fields', name: 'North Fields', emoji: '🌾', x: 22, y: 2, w: 8, h: 8, color: 'bg-yellow-900/20', border: 'border-yellow-900/50' },
  { id: 'village_hall', name: 'Village Hall', emoji: '🏛️', x: 0, y: 30, w: 10, h: 8, color: 'bg-blue-900/20', border: 'border-blue-900/50' },
  { id: 'library', name: 'Library', emoji: '📚', x: 12, y: 30, w: 10, h: 8, color: 'bg-purple-900/20', border: 'border-purple-900/50' },
  { id: 'warehouse', name: 'Abandoned Warehouse', emoji: '🏭', x: 24, y: 30, w: 10, h: 8, color: 'bg-gray-900/20', border: 'border-gray-900/50' },
];

export const MAP_SIZE = 40;
export const DAY_2_TIMER_LIMIT = 180; // 3 minutes in seconds

const BASE_TILE_MAP = [
  [5,5,5,5,5,5,5,0,0,0,0,0,0,0,0,0,5,5,5,5],
  [5,3,3,3,3,2,0,0,0,0,0,2,2,2,2,0,0,0,0,5],
  [5,3,3,3,3,2,0,0,0,0,0,2,4,4,2,0,0,0,0,5],
  [5,3,3,3,3,2,0,0,0,0,0,2,4,4,2,0,0,0,0,5],
  [5,3,3,3,3,2,0,0,0,0,0,2,4,1,2,0,0,0,0,5],
  [0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0],
  [2,2,2,2,2,0,0,5,5,5,0,0,0,1,0,2,2,2,2,2],
  [2,3,3,3,2,0,0,5,0,5,0,0,0,1,0,2,4,4,4,2],
  [2,3,3,3,2,0,0,5,0,5,0,0,0,1,0,2,4,4,4,2],
  [2,3,3,3,2,0,0,0,0,0,0,0,0,1,0,2,4,4,4,2],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
  [2,2,1,2,2,0,2,2,1,2,2,0,2,2,1,2,2,0,0,0],
  [2,3,3,3,2,0,2,3,3,3,2,0,2,3,3,3,2,0,0,0],
  [2,3,3,3,2,0,2,3,3,3,2,0,2,3,3,3,2,0,0,0],
  [2,2,2,2,2,0,2,2,2,2,2,0,2,2,2,2,2,0,0,0],
  [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
];

export const TILE_MAP = Array.from({ length: MAP_SIZE }, (_, y) => 
  Array.from({ length: MAP_SIZE }, (_, x) => BASE_TILE_MAP[Math.floor(y / 2)][Math.floor(x / 2)])
);
