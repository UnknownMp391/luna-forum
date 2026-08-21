// import { renderTemplate } from './render.js';
// import { getDB } from '../../src/db.js';
// import { ObjectId } from 'mongodb';
import fastifyStatic from '@fastify/static';
import { renderPage, setRequest } from './render.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export function setupFrontendRoutes(server: FastifyInstance): void {
    server.addHook('onRequest', async (request: FastifyRequest) => {
        setRequest(request);
    });
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
    server.register(fastifyStatic, {
        root: resolve(dirname(fileURLToPath(import.meta.url)), '../../node_modules/iconify-icon/dist'),
        prefix: '/static/fluent-icon/',
        decorateReply: false,
        maxAge: '30d',
        immutable: true,
        cacheControl: true
    });
    // server.get('/dev/layout-preview', async (_request: FastifyRequest, reply: FastifyReply) => {
    //     const html = await renderPage('layout.html', { pagename: 'Dev Layout Preview', posts: [] });
    //     return reply.type('text/html').send(html);
    // });
}