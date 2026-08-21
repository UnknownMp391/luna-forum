import i18next from 'i18next';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadLocale(locale: string): Record<string, string> {
  const filePath = resolve(__dirname, 'locales', `${locale}.json`);
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Record<string, string>;
}

export async function initI18n(locale: string = 'zh-cn'): Promise<void> {
  const resources: Record<string, { translation: Record<string, string> }> = {};
  resources[locale] = { translation: loadLocale(locale) };
  resources['en'] = { translation: loadLocale('en') };
  await i18next.init({
    lng: locale,
    fallbackLng: 'en',
    resources
  });
}

export function t(key: string): string {
  return i18next.t(key);
}