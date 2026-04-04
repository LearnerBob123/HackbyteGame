import { Rumor } from '../types';

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
