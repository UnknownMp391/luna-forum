import nunjucks from 'nunjucks';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { RenderData } from './types.js';

interface FileSystemLoaderLike {
    searchPaths: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesPath = resolve(__dirname, 'templates');
const env = nunjucks.configure(templatesPath, { autoescape: true });

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

export function renderTemplate(template: string, data: RenderData = {}): string {
    return env.render(template, data);
}