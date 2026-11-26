import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import { initialSeedData } from './seedData.js';

class JSONDatabase {
  constructor() {
    this.filePath = CONFIG.DB_PATH;
    this.dirPath = path.dirname(this.filePath);
    this.data = {};
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dirPath)) {
      fs.mkdirSync(this.dirPath, { recursive: true });
    }

    if (!fs.existsSync(CONFIG.UPLOADS_DIR)) {
      fs.mkdirSync(CONFIG.UPLOADS_DIR, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);

        // Ensure tender_invitations collection exists and is seeded
        if (!this.data.tender_invitations || this.data.tender_invitations.length === 0) {
          this.data.tender_invitations = JSON.parse(JSON.stringify(initialSeedData.tender_invitations || []));
        }

        // Ensure all opportunities have visibility and opp-2026-005 exists
        if (this.data.opportunities) {
          this.data.opportunities.forEach(o => {
            if (!o.visibility) o.visibility = 'PUBLIC';
          });
          const hasPrivate = this.data.opportunities.some(o => o.id === 'opp-2026-005');
          if (!hasPrivate && initialSeedData.opportunities) {
            const privOpp = initialSeedData.opportunities.find(o => o.id === 'opp-2026-005');
            if (privOpp) this.data.opportunities.push(privOpp);
          }
        }
        this.save();
      } catch (err) {
        console.error('Failed to read database file, restoring from seed:', err);
        this.resetSeed();
      }
    } else {
      this.resetSeed();
    }
  }

  resetSeed() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.save();
    console.log('Database seeded successfully.');
  }

  save() {
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  get(collection) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    return this.data[collection];
  }

  find(collection, filterFn) {
    const list = this.get(collection);
    return filterFn ? list.filter(filterFn) : [...list];
  }

  findOne(collection, filterFn) {
    const list = this.get(collection);
    return list.find(filterFn) || null;
  }

  findById(collection, id) {
    return this.findOne(collection, item => item.id === id);
  }

  insert(collection, item) {
    const list = this.get(collection);
    const newItem = {
      ...item,
      id: item.id || `${collection.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: item.created_at || new Date().toISOString()
    };
    list.unshift(newItem);
    this.save();
    return newItem;
  }

  update(collection, id, updates) {
    const list = this.get(collection);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return list[index];
  }

  delete(collection, id) {
    const list = this.get(collection);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;

    list.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new JSONDatabase();
