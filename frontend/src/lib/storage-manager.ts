export class StorageManager {
  // localStorage operations
  static setLocal(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  static getLocal<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }
  
  static removeLocal(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
  
  // sessionStorage operations
  static setSession(key: string, value: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }
  
  static getSession<T>(key: string, defaultValue: T): T {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  }
  
  static removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }
  
  // Clear all storage
  static clearAll(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
  
  // Clear test data
  static clearTestData(): void {
    const testKeys = [
      'test_data',
      'mock_data',
      'dummy_data',
      'vacations', // Remove old localStorage vacations
      'projectAllocations' // Remove old localStorage allocations
    ];
    
    testKeys.forEach(key => {
      this.removeLocal(key);
      this.removeSession(key);
    });
  }
  
  // Check storage availability
  static isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Get storage usage info
  static getStorageInfo(): { localStorage: number; sessionStorage: number } {
    const getSize = (storage: Storage): number => {
      let size = 0;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          size += storage.getItem(key)?.length || 0;
        }
      }
      return size;
    };
    
    return {
      localStorage: getSize(localStorage),
      sessionStorage: getSize(sessionStorage)
    };
  }
  
  // Migrate data from localStorage to sessionStorage
  static migrateToSession(key: string): boolean {
    try {
      const data = this.getLocal(key, null);
      if (data !== null) {
        this.setSession(key, data);
        this.removeLocal(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }
  
  // Backup storage data
  static backupStorage(): { localStorage: Record<string, any>; sessionStorage: Record<string, any> } {
    const backup: { localStorage: Record<string, any>; sessionStorage: Record<string, any> } = {
      localStorage: {},
      sessionStorage: {}
    };
    
    // Backup localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          backup.localStorage[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch (error) {
          backup.localStorage[key] = localStorage.getItem(key);
        }
      }
    }
    
    // Backup sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          backup.sessionStorage[key] = JSON.parse(sessionStorage.getItem(key) || 'null');
        } catch (error) {
          backup.sessionStorage[key] = sessionStorage.getItem(key);
        }
      }
    }
    
    return backup;
  }
  
  // Restore storage data
  static restoreStorage(backup: { localStorage: Record<string, any>; sessionStorage: Record<string, any> }): void {
    try {
      // Restore localStorage
      Object.entries(backup.localStorage).forEach(([key, value]) => {
        this.setLocal(key, value);
      });
      
      // Restore sessionStorage
      Object.entries(backup.sessionStorage).forEach(([key, value]) => {
        this.setSession(key, value);
      });
    } catch (error) {
      console.error('Error restoring storage:', error);
    }
  }
} 