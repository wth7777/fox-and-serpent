/* FOX & SERPENT — Save System
   localStorage-based save/load for player progress */

export class SaveSystem {
  constructor() {
    this.storageKey = 'fox_and_serpent_save';
    this.defaultData = {
      health: 100,
      maxHealth: 100,
      treasure: 0,
      score: 0,
      level: 1,
      xp: 0,
      unlockedAreas: ['forest'],
      settings: {
        graphicsLevel: 'medium',
        soundEnabled: true
      },
      playTime: 0,
      lastSaved: null
    };
  }

  init() {
    // Migrate existing saves if needed
    const existing = this.loadRaw();
    if (existing) {
      // Ensure all required fields exist
      const merged = { ...this.defaultData, ...existing };
      this.saveRaw(merged);
    }
  }

  load() {
    const data = this.loadRaw();
    if (!data) return null;
    return data;
  }

  loadRaw() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Save load failed:', e);
      return null;
    }
  }

  save(data) {
    const saveData = {
      ...data,
      lastSaved: new Date().toISOString(),
      playTime: (data.playTime || 0) + 1 // rough increment
    };
    this.saveRaw(saveData);
  }

  saveRaw(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Save clear failed:', e);
    }
  }

  hasSave() {
    return this.loadRaw() !== null;
  }

  // Export/import save data
  exportSave() {
    const data = this.loadRaw();
    if (!data) return null;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fox_and_serpent_save.json';
    a.click();
    URL.revokeObjectURL(url);
    return data;
  }

  importSave(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this.saveRaw(data);
        return true;
      } catch (err) {
        console.error('Import failed:', err);
        return false;
      }
    };
    reader.readAsText(file);
  }
}

export default SaveSystem;