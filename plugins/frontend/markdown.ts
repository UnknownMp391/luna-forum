import { marked } from 'marked';
import katex from 'katex';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);

const inlineMath = {
    name: 'inlineMath',
    level: 'inline' as const,
    start(src: string) { return src.indexOf('$'); },
    tokenizer(src: string) {
        const match = src.match(/^\$([^\$\n]+?)\$/);
        if (match) {
            return { type: 'inlineMath', raw: match[0], text: match[1].trim() };
        }
    },
    renderer(token: { text: string }) {
        return katex.renderToString(token.text, { throwOnError: false, displayMode: false });
    }
};

const blockMath = {
    name: 'blockMath',
    level: 'block' as const,
    start(src: string) { return src.indexOf('$$'); },
    tokenizer(src: string) {
        const match = src.match(/^\$\$([\s\S]+?)\$\$/);
        if (match) {
            return { type: 'blockMath', raw: match[0], text: match[1].trim() };
        }
    },
    renderer(token: { text: string }) {
        return katex.renderToString(token.text, { throwOnError: false, displayMode: true });
    }
};

marked.use({ extensions: [inlineMath, blockMath] });

export function renderMarkdown(content: string): string {
    const html = marked.parse(content) as string;
    const withFluentLinks = html.replace(
        /<a([^>]*href="[^"]*"[^>]*)>([\s\S]*?)<\/a>/g,
        '<fluent-link$1>$2</fluent-link>'
    );
    return withFluentLinks.replace(
        /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g,
        (emoji: string) => {
            const codepoint = require('twemoji').convert.toCodePoint(emoji);
            try {
                const svgPath = require.resolve(`@twemoji/svg/${codepoint}.svg`);
                const svg = readFileSync(svgPath, 'utf-8')
                    .replace('<svg', '<svg width="1.2em" height="1.2em"');
                return `<span class="twemoji" style="width:1.2em;height:1.2em;display:inline-block;vertical-align:-0.2em">${svg}</span>`;
            } catch {
                return emoji;
            }
        }
    );
}