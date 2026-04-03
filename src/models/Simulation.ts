/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position, RUMORS, Rumor, LOCATIONS } from '../types';
import { Agent } from './Agent';

export class SimulationEngine {
  agents: Agent[] = [];
  misinfoIndex: number = 20;
  logs: string[] = [];
  rumorSources: Record<string, number> = {}; // rumorId -> agentId
  rumorLineage: Record<string, Record<string, string>> = {}; // rumorId -> { receiverId: senderId }
  verifiedRumors: Record<string, boolean> = {}; // rumorId -> isTrue
  rumorLocations: Record<string, Position> = {};
  rumorRedirects: Record<string, number> = {};
  rumorVisitedLocs: Record<string, string[]> = {};

  day: number = 1;

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const names = ["Aarti", "Babu", "Chacha", "Deepa", "Eshaan"];
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    
    const cafe = LOCATIONS.find(l => l.id === 'cafe');
    const cafeX = cafe ? cafe.x : 1;
    const cafeY = cafe ? cafe.y : 1;

    this.agents = names.map((name, i) => {
      const agent = new Agent(i, name, colors[i]);
      // Position them in a horizontal line right outside the cafe (x:2, y:2, w:8, h:8)
      // Placing them at y: 10, which is just below the cafe wall
      agent.pos = { x: 3 + (i * 1), y: 10 };
      return agent;
    });

    const bgNames = ["Raju", "Sita", "Gita", "Ramesh", "Suresh", "Kamla", "Vikas", "Pooja", "Amit", "Neha"];
    const bgAgents = bgNames.map((name, i) => {
      const agent = new Agent(i + 5, name, "#9ca3af"); // Gray color
      agent.isBackground = true;
      return agent;
    });

    this.agents = [...this.agents, ...bgAgents];

    // Assign specific rumors to specific agents for Day 1
    this.agents[0].knownRumors.push("drone-banyan");
    this.agents[1].knownRumors.push("pump-north");
    this.agents[2].knownRumors.push("flyers-hall");
    this.agents[3].knownRumors.push("wifi-library");
    this.agents[4].knownRumors.push("tracks-warehouse");

    // Set lineage origin
    this.agents.forEach(a => {
      const rumorId = a.knownRumors[0];
      this.rumorLineage[rumorId] = this.rumorLineage[rumorId] || {};
      this.rumorLineage[rumorId][a.id.toString()] = 'origin';
    });

    // Initialize rumor locations based on tags
    RUMORS.forEach(r => {
      let loc = LOCATIONS.find(l => r.tags.some(t => l.name.toLowerCase().includes(t)));
      if (!loc) {
        if (r.tags.includes('park') || r.tags.includes('nature')) loc = LOCATIONS.find(l => l.id === 'park');
        else if (r.tags.includes('mayor') || r.tags.includes('office')) loc = LOCATIONS.find(l => l.id === 'office');
        else if (r.tags.includes('school') || r.tags.includes('learn')) loc = LOCATIONS.find(l => l.id === 'school');
        else if (r.tags.includes('house') || r.tags.includes('home')) loc = LOCATIONS.find(l => l.id === 'residential');
        else if (r.tags.includes('cafe') || r.tags.includes('coffee')) loc = LOCATIONS.find(l => l.id === 'cafe');
        else loc = LOCATIONS.find(l => l.id === 'store'); // default
      }
      if (!loc) loc = LOCATIONS[0];

      this.rumorLocations[r.id] = { 
        x: r.verificationLocation?.x || loc.x + Math.floor(loc.w / 2), 
        y: r.verificationLocation?.y || loc.y + Math.floor(loc.h / 2), 
        name: r.verificationLocation?.name || loc.name 
      };
      this.rumorRedirects[r.id] = 0;
      this.rumorVisitedLocs[r.id] = [loc.name];
    });
  }

  investigate(rumorId: string): { status: 'verified' | 'redirected', message: string } {
    const rumor = RUMORS.find(r => r.id === rumorId);
    if (!rumor) return { status: 'redirected', message: 'Rumor not found.' };

    this.verifiedRumors[rumorId] = rumor.isTrue;
    return {
      status: 'verified',
      message: `🔍 You investigated "${rumor.tags[0]}" and found it to be ${rumor.isTrue ? 'TRUE' : 'FALSE'}!`
    };
  }

  step(pausedAgentId?: number) {
    // Move agents
    this.agents.forEach(a => {
      if (a.id !== pausedAgentId && Math.random() < 0.4) {
        if (this.day > 1 || a.isBackground) {
          a.move();
        }
      }
    });

    return [];
  }

  search(query: string): Rumor[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const results = RUMORS.filter(r => 
      r.tags.some(tag => q.includes(tag)) || 
      r.text.toLowerCase().includes(q) ||
      q.split(' ').some(word => word.length > 3 && r.text.toLowerCase().includes(word))
    ).sort((a, b) => b.credibility - a.credibility);

    return results;
  }

  factCheck(rumorId: string, targetAgentId: number): { success: boolean, message: string, repChange: number } {
    const rumor = RUMORS.find(r => r.id === rumorId);
    if (!rumor) return { success: false, message: "Rumor not found.", repChange: 0 };

    if (this.verifiedRumors[rumorId] === undefined) {
      return { success: false, message: "Verify this at the Cybercafe first!", repChange: 0 };
    }

    const isTrue = this.verifiedRumors[rumorId];
    const targetAgent = this.agents.find(a => a.id === targetAgentId);

    if (isTrue) {
      // Endorse true info
      this.misinfoIndex = Math.max(0, this.misinfoIndex - 5);
      return { 
        success: true, 
        message: `🌟 VILLAGE ANNOUNCEMENT: The info about "${rumor.tags[0]}" is TRUE! ${targetAgent ? targetAgent.name : "The source"} is a reliable agent!`,
        repChange: 10
      };
    } else {
      // Expose false info
      let announcementMsg = `📢 VILLAGE ANNOUNCEMENT: The rumor about "${rumor.tags[0]}" was FALSE! `;
      
      this.misinfoIndex = Math.max(0, this.misinfoIndex - 15);
      return { 
        success: true, 
        message: announcementMsg,
        repChange: 15
      };
    }
  }
}
