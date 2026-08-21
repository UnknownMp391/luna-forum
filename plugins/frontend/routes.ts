// import { renderTemplate } from './render.js';
// import { getDB } from '../../src/db.js';
// import { ObjectId } from 'mongodb';
import { getConfig } from '../../src/config.js';
import fastifyStatic from '@fastify/static';
import { renderPage } from './render.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export function setupFrontendRoutes(server: FastifyInstance): void {
    server.register(fastifyStatic, {
        root: resolve(dirname(fileURLToPath(import.meta.url)), 'public'),
        prefix: '/static/'
    });
    server.register(fastifyStatic, {
        root: resolve(dirname(fileURLToPath(import.meta.url)), '../../node_modules/@fluentui/web-components/dist'),
        prefix: '/static/fluentui/',
        decorateReply: false,
        maxAge: '30d',
        immutable: true,
        cacheControl: true
    });
    // server.get('/dev/layout-preview', async (_request: FastifyRequest, reply: FastifyReply) => {
    //     const html = renderPage('layout.html', { pagename: 'Home', posts: [] });
    //     return reply.type('text/html').send(html);
    // });
}