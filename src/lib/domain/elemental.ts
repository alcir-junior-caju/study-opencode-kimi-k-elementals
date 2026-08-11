export type Rarity = 'Raro' | 'Especial' | 'Épico' | 'Lendário' | 'Mítico';

export type ElementalType =
	| 'Água'
	| 'Terra'
	| 'Fogo'
	| 'Ar'
	| 'Peixoto'
	| 'Pato'
	| 'Fantasma'
	| 'Demônio'
	| 'Rei'
	| 'Aura'
	| 'Atacante'
	| 'Sonolento'
	| 'Banana'
	| 'Punk'
	| 'Chefe'
	| 'Seven'
	| 'Lhama'
	| 'Ceifador'
	| 'Ponto Zero'
	| 'Batman'
	| 'John Wick'
	| 'Vini JR'
	| 'Pedicure Antacid'
	| 'Amendoin Queimado'
	| 'Pollo';

export type Variation =
	| 'Normal'
	| 'Dourado'
	| 'Gelatinoso'
	| 'Galático'
	| 'Metalizado'
	| 'Cubo'
	| 'Gema'
	| 'Quack';

export interface Elemental {
	readonly id: string;
	readonly type: ElementalType;
	readonly rarity: Rarity;
	readonly variation: Variation;
	readonly imagePath: string;
}

export const RARITY_ORDER: readonly Rarity[] = ['Raro', 'Especial', 'Épico', 'Lendário', 'Mítico'];

export const TYPE_ORDER: readonly ElementalType[] = [
	'Água',
	'Terra',
	'Fogo',
	'Ar',
	'Peixoto',
	'Pato',
	'Fantasma',
	'Demônio',
	'Rei',
	'Aura',
	'Atacante',
	'Sonolento',
	'Banana',
	'Punk',
	'Chefe',
	'Seven',
	'Lhama',
	'Ceifador',
	'Ponto Zero',
	'Batman',
	'John Wick',
	'Vini JR',
	'Pedicure Antacid',
	'Amendoin Queimado',
	'Pollo'
];

export const VARIATION_ORDER: readonly Variation[] = [
	'Normal',
	'Dourado',
	'Gelatinoso',
	'Galático',
	'Metalizado',
	'Cubo',
	'Gema',
	'Quack'
];
