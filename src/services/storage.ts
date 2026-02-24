
// Server-side storage sync
let assetsCache: Record<string, string> | null = null;

async function fetchAssets() {
  if (assetsCache) return assetsCache;
  try {
    const response = await fetch("/api/assets");
    if (response.ok) {
      assetsCache = await response.json();
      return assetsCache!;
    }
  } catch (error) {
    console.error("Failed to fetch assets from server", error);
  }
  return {};
}

export const assetStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (response.ok) {
        if (assetsCache) assetsCache[key] = value;
      }
    } catch (error) {
      console.error("Failed to save asset to server", error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    const assets = await fetchAssets();
    return assets[key] || null;
  },

  async removeItem(key: string): Promise<void> {
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: null }),
      });
      if (response.ok) {
        if (assetsCache) delete assetsCache[key];
      }
    } catch (error) {
      console.error("Failed to remove asset from server", error);
    }
  },

  async clear(): Promise<void> {
    try {
      const response = await fetch("/api/assets/clear", { method: "POST" });
      if (response.ok) {
        assetsCache = {};
      }
    } catch (error) {
      console.error("Failed to clear assets from server", error);
    }
  },

  async getAllKeys(): Promise<string[]> {
    const assets = await fetchAssets();
    return Object.keys(assets);
  }
};
