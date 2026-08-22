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
    server.get('/login', async (_request: FastifyRequest, reply: FastifyReply) => {
        const html = await renderPage('login.html', { pagename: '登录', posts: [] });
        return reply.type('text/html').send(html);
    });
}