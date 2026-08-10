#!/usr/bin/env node
/**
 * Validador do seed `src/data/catalog.json`.
 *
 * Regras validadas:
 * - estrutura dos 5 campos obrigatórios (id, type, rarity, variation, imagePath);
 * - unicidade de IDs (117 únicos);
 * - enums: 5 raridades, 8 variações, 25 tipos;
 * - padrão do ID `<typeSlug>_<variationSlug>` consistente com type/variation;
 * - regra cruzada: variação não-Normal ⇒ raridade "Especial";
 * - cardinalidade: exatamente 117 itens e 25 tipos distintos;
 * - existência em disco de cada `imagePath` sob `static/`.
 *
 * Saída: exit 0 com resumo no stdout; exit 1 com relatório JSON item a item no stderr.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, '..');
const SEED_PATH = resolve(ROOT, 'src/data/catalog.json');
const STATIC_ROOT = resolve(ROOT, 'static');

const RARITIES = ['Raro', 'Especial', 'Épico', 'Lendário', 'Mítico'];
const VARIATIONS = ['Normal', 'Dourado', 'Gelatinoso', 'Galático', 'Metalizado', 'Cubo', 'Gema', 'Quack'];
const VARIATION_SLUGS = {
	Normal: 'basic',
	Dourado: 'gold',
	Gelatinoso: 'candy',
	Galático: 'galaxy',
	Metalizado: 'holofoil',
	Cubo: 'cube',
	Gema: 'gem',
	Quack: 'quack'
};

const TYPE_SLUGS = {
	'Água': 'water',
	'Terra': 'earth',
	'Fogo': 'fire',
	'Ar': 'air',
	'Peixoto': 'fishy',
	'Pato': 'duck',
	'Fantasma': 'ghost',
	'Demônio': 'demon',
	'Rei': 'king',
	'Aura': 'drifter',
	'Atacante': 'soccer',
	'Sonolento': 'sleepy',
	'Banana': 'peely',
	'Punk': 'punk',
	'Chefe': 'boss',
	'Seven': 'seven',
	'Lhama': 'llama',
	'Ceifador': 'grimreaper',
	'Ponto Zero': 'zeropoint',
	'Batman': 'batman',
	'John Wick': 'fillergrunt',
	'Vini JR': 'vinijr',
	'Pedicure Antacid': 'pedicureantacid',
	'Amendoin Queimado': 'theburntpeanut',
	'Pollo': 'pollo'
};

const EXPECTED_TOTAL = 117;
const EXPECTED_TYPE_COUNT = 25;

const elementalSchema = z.object({
	id: z.string().min(1),
	type: z.enum(Object.keys(TYPE_SLUGS)),
	rarity: z.enum(RARITIES),
	variation: z.enum(Object.keys(VARIATION_SLUGS)),
	imagePath: z.string().min(1)
});

const seedSchema = z.object({
	elementals: z.array(elementalSchema)
});

function validateItem(item, index, seenIds) {
	const errors = [];

	// unicidade de ID
	if (seenIds.has(item.id)) {
		errors.push(`ID duplicado: "${item.id}"`);
	} else {
		seenIds.add(item.id);
	}

	// consistência do ID com type/variation
	const expectedTypeSlug = TYPE_SLUGS[item.type];
	const expectedVariationSlug = VARIATION_SLUGS[item.variation];
	const expectedId = `${expectedTypeSlug}_${expectedVariationSlug}`;
	if (item.id !== expectedId) {
		errors.push(
			`ID "${item.id}" inconsistente com type="${item.type}" (${expectedTypeSlug}) / variation="${item.variation}" (${expectedVariationSlug}); esperado "${expectedId}"`
		);
	}

	// regra cruzada variação × raridade
	if (item.variation !== 'Normal' && item.rarity !== 'Especial') {
		errors.push(`variação "${item.variation}" deve ter rarity="Especial", mas tem "${item.rarity}"`);
	}

	// existência da imagem em disco
	const imageFullPath = resolve(STATIC_ROOT, item.imagePath);
	if (!existsSync(imageFullPath)) {
		errors.push(`imagem ausente: ${item.imagePath}`);
	}

	return errors;
}

function validateBaseRarityConsistency(seed) {
	const baseByType = new Map();
	const inconsistencies = [];

	seed.elementals.forEach((item) => {
		if (item.variation !== 'Normal') return;
		const current = baseByType.get(item.type);
		if (current === undefined) {
			baseByType.set(item.type, item.rarity);
		} else if (current !== item.rarity) {
			inconsistencies.push(
				`tipo "${item.type}" possui múltiplas raridades base: "${current}" e "${item.rarity}"`
			);
		}
	});

	return inconsistencies;
}

function runValidation(seed) {
	const report = [];
	const seenIds = new Set();
	let structuralErrors = 0;

	seed.elementals.forEach((item, index) => {
		const itemErrors = validateItem(item, index, seenIds);
		if (itemErrors.length > 0) {
			structuralErrors += itemErrors.length;
			report.push({ index, id: item.id ?? `#[${index}]`, errors: itemErrors });
		}
	});

	const total = seed.elementals.length;
	const uniqueTypes = new Set(seed.elementals.map((i) => i.type)).size;
	const baseRarityErrors = validateBaseRarityConsistency(seed);

	const summaryErrors = [];
	if (total !== EXPECTED_TOTAL) {
		summaryErrors.push(`cardinalidade inválida: ${total} itens (esperado ${EXPECTED_TOTAL})`);
	}
	if (uniqueTypes !== EXPECTED_TYPE_COUNT) {
		summaryErrors.push(`contagem de tipos inválida: ${uniqueTypes} (esperado ${EXPECTED_TYPE_COUNT})`);
	}

	return {
		ok: structuralErrors === 0 && summaryErrors.length === 0 && baseRarityErrors.length === 0,
		total,
		uniqueTypes,
		structuralErrors,
		summaryErrors,
		baseRarityErrors,
		report
	};
}

function main() {
	if (!existsSync(SEED_PATH)) {
		console.error(JSON.stringify({ ok: false, error: `seed não encontrado: ${SEED_PATH}` }, null, 2));
		process.exit(1);
	}

	let raw;
	try {
		raw = JSON.parse(readFileSync(SEED_PATH, 'utf-8'));
	} catch (err) {
		console.error(JSON.stringify({ ok: false, error: `falha ao parsear JSON: ${err.message}` }, null, 2));
		process.exit(1);
	}

	const parsed = seedSchema.safeParse(raw);
	if (!parsed.success) {
		const issues = parsed.error.issues.map((issue) => ({
			path: issue.path,
			message: issue.message
		}));
		console.error(JSON.stringify({ ok: false, errors: issues }, null, 2));
		process.exit(1);
	}

	const result = runValidation(parsed.data);

	if (!result.ok) {
		console.error(
			JSON.stringify(
				{
					ok: false,
					total: result.total,
					uniqueTypes: result.uniqueTypes,
					structuralErrors: result.structuralErrors,
					summaryErrors: result.summaryErrors,
					baseRarityErrors: result.baseRarityErrors,
					items: result.report
				},
				null,
				2
			)
		);
		process.exit(1);
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				total: result.total,
				uniqueTypes: result.uniqueTypes,
				message: 'seed válido'
			},
			null,
			2
		)
	);
	process.exit(0);
}

main();
