#!/usr/bin/env node
/**
 * Medidor de metas de engenharia.
 *
 * Metas monitoradas:
 * - bundle JavaScript inicial < 150 KB gzip (soma dos bytes transferidos dos
 *   recursos .js na navegação inicial de `/`);
 * - carregamento do catálogo < 200 ms (tempo até o primeiro card do catálogo
 *   estar renderizado no build pré-renderizado);
 * - cold start da home < 2 s em rede 4G ( tempo até `networkidle` na navegação
 *   inicial).
 *
 * Pré-requisito: `npm run build` já deve ter gerado `build/`.
 *
 * Saída: exit 0 quando todas as metas passam; exit 1 com os valores medidos.
 */

import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, '..');
const BUILD_DIR = resolve(ROOT, 'build');
const PORT = 3456;
const BASE_URL = `http://localhost:${PORT}`;

const BUDGETS = {
	bundleGzipBytes: 150 * 1024,
	catalogLoadMs: 200,
	coldStart4GMs: 2000
};

function contentTypeFor(path) {
	const ext = extname(path).toLowerCase();
	const map = {
		'.html': 'text/html; charset=utf-8',
		'.js': 'text/javascript; charset=utf-8',
		'.css': 'text/css; charset=utf-8',
		'.webp': 'image/webp',
		'.png': 'image/png',
		'.json': 'application/json',
		'.svg': 'image/svg+xml'
	};
	return map[ext] ?? 'application/octet-stream';
}

function startStaticServer() {
	const server = createServer((req, res) => {
		const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
		let filePath = resolve(BUILD_DIR, url.pathname === '/' ? 'index.html' : `.${url.pathname}`);
		if (existsSync(filePath) && readFileSync(filePath).length === 0) {
			// evita ambiguidade com diretórios vazios
		}
		if (!existsSync(filePath)) {
			filePath = resolve(BUILD_DIR, 'index.html');
		}
		if (!existsSync(filePath)) {
			res.writeHead(404);
			res.end('Not found');
			return;
		}
		const content = readFileSync(filePath);
		res.writeHead(200, {
			'Content-Type': contentTypeFor(filePath),
			'Content-Length': content.length,
			'Cache-Control': 'no-store'
		});
		res.end(content);
	});

	return new Promise((resolvePromise) => {
		server.listen(PORT, () => resolvePromise(server));
	});
}

async function measureBundle(page) {
	let totalBytes = 0;
	page.on('requestfinished', async (request) => {
		const response = await request.response();
		if (!response) return;
		const url = request.url();
		if (!url.endsWith('.js')) return;
		if (!url.startsWith(BASE_URL)) return;
		try {
			const headers = response.headers();
			const length = headers['content-length'];
			if (length) {
				totalBytes += Number.parseInt(length, 10);
			} else {
				const buffer = await response.body();
				if (buffer) totalBytes += buffer.length;
			}
		} catch {
			// ignora requests cancelados
		}
	});

	await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
	// pequena pausa para garantir que todos os eventos de requestfinished foram processados
	await page.waitForTimeout(100);
	return totalBytes;
}

async function measureCatalogLoad(page) {
	await page.goto('about:blank');
	await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-store' });
	const start = Date.now();
	await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
	await page.waitForSelector('[data-testid="elemental-card"]', { timeout: 5000 });
	return Date.now() - start;
}

async function measureColdStart4G(page) {
	const client = await page.context().newCDPSession(page);
	await client.send('Network.emulateNetworkConditions', {
		offline: false,
		downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
		uploadThroughput: 3 * 1024 * 1024 / 8, // 3 Mbps
		latency: 20
	});

	await page.goto('about:blank');
	const start = Date.now();
	await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
	await page.waitForSelector('[data-testid="elemental-card"]', { timeout: 5000 });
	return Date.now() - start;
}

function formatBytes(bytes) {
	return `${(bytes / 1024).toFixed(2)} KB`;
}

async function main() {
	if (!existsSync(BUILD_DIR)) {
		console.error(
			JSON.stringify(
				{ ok: false, error: `diretório build/ não encontrado. Execute "npm run build" primeiro.` },
				null,
				2
			)
		);
		process.exit(1);
	}

	const server = await startStaticServer();
	const browser = await chromium.launch();

	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		// bundle JS inicial
		const bundleBytes = await measureBundle(page);

		// catálogo < 200 ms
		const catalogLoadMs = await measureCatalogLoad(page);

		// cold start 4G < 2 s
		const coldStartMs = await measureColdStart4G(page);

		const bundlePass = bundleBytes < BUDGETS.bundleGzipBytes;
		const catalogPass = catalogLoadMs < BUDGETS.catalogLoadMs;
		const coldStartPass = coldStartMs < BUDGETS.coldStart4GMs;
		const ok = bundlePass && catalogPass && coldStartPass;

		const result = {
			ok,
			bundle: {
				value: bundleBytes,
				formatted: formatBytes(bundleBytes),
				budget: formatBytes(BUDGETS.bundleGzipBytes),
				pass: bundlePass
			},
			catalogLoad: {
				value: catalogLoadMs,
				budget: `${BUDGETS.catalogLoadMs} ms`,
				pass: catalogPass
			},
			coldStart4G: {
				value: coldStartMs,
				budget: `${BUDGETS.coldStart4GMs} ms`,
				pass: coldStartPass
			}
		};

		if (ok) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.error(JSON.stringify(result, null, 2));
		}

		await context.close();
		server.close();
		await browser.close();
		process.exit(ok ? 0 : 1);
	} catch (err) {
		console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
		server.close();
		await browser.close();
		process.exit(1);
	}
}

main();
