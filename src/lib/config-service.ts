
import type { PageConfig, PageElement } from '@/lib/types';

export const loadConfig = async (configFile: string, configParam: string | null): Promise<PageConfig> => {
  const load = async (file: string) => {
    // Always bypass cache when fetching config
    const res = await fetch(file, { cache: 'no-store' });
    if (res.ok) return res.json();
    throw new Error(`Failed to load ${file}`);
  };

  const process = (data: any): PageConfig => {
    return {
      ...data,
      elements: data.elements.map((el: PageElement, index: number) => ({
        ...el,
        zIndex: el.zIndex ?? index + 1,
        status: 'idle',
      })),
    };
  };

  try {
    const data = await load(configFile);
    return process(data);
  } catch (error) {
    console.error(`Failed to load ${configFile}`, error);
    if (configParam) {
      try {
        const errorData = await load('error.json');
        return process(errorData);
      } catch (e) {
        console.error("Failed to load error.json", e);
      }
    }
    throw new Error(`Failed to load initial configuration. Please make sure ${configFile} exists in the public folder.`);
  }
};
