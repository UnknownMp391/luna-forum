import nunjucks from 'nunjucks';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { RenderData } from './types.js';
import { t } from './i18n.js';
import { getConfig } from '../../src/config.js';
import { getCurrentUser } from '../../src/auth.js';

interface FileSystemLoaderLike {
    searchPaths: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesPath = resolve(__dirname, 'templates');
const env = nunjucks.configure(templatesPath, { autoescape: true });

let currentRequest: unknown = null;

export function setRequest(request: unknown): void {
    currentRequest = request;
}

function getLoader(environment: nunjucks.Environment): FileSystemLoaderLike {
    return (environment as unknown as { loader: FileSystemLoaderLike }).loader;
}

export function addTemplatePath(path: string): void {
    const loader = getLoader(env);
    if (loader && Array.isArray(loader.searchPaths)) {
        if (!loader.searchPaths.includes(path)) {
            loader.searchPaths.push(path);
        }
    }
}

env.addFilter('_', (key: string) => t(key));

function getSiteInfo(): Record<string, string> {
    try {
        const config = getConfig() as { site?: { name?: string; description?: string } };
        return {
            name: config.site?.name ?? 'Luna Forum',
            description: config.site?.description ?? ''
        };
    } catch {
        return { name: 'Luna Forum', description: '' };
    }
}

export async function renderPage(
    template: string,
    data: RenderData = {}
): Promise<string> {
    const site = getSiteInfo();
    const merged: Record<string, unknown> = {
        ...data,
        site,
        user: null
    };
    if (currentRequest) {
        merged.user = await getCurrentUser(currentRequest);
    }
    if (!merged.title) {
        merged.title = site.name;
    }
    return env.render(template, merged as RenderData) as string;
}

export function renderTemplate(template: string, data: RenderData = {}): string {
    return env.render(template, data) as string;
}