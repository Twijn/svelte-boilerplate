/**
 * Global Configuration Variables System
 *
 * Provides a type-safe way to register and access configuration variables
 * that are stored in the database and can be modified at runtime.
 */

import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export type ConfigType = 'string' | 'number' | 'boolean' | 'json';

export interface ConfigVariableDefinition<T = unknown> {
	key: string;
	defaultValue: T;
	type: ConfigType;
	category: string;
	description: string;
	isEditable?: boolean;
	validator?: (value: T) => boolean | string; // Return true or error message
}

// Registry of all config variables
const configRegistry = new Map<string, ConfigVariableDefinition>();

/**
 * Register a new configuration variable
 * This should be called during application startup
 */
export function registerConfig<T>(definition: ConfigVariableDefinition<T>): void {
	if (configRegistry.has(definition.key)) {
		throw new Error(`Config variable "${definition.key}" is already registered`);
	}
	configRegistry.set(definition.key, definition as ConfigVariableDefinition);
}

/**
 * Get all registered configuration definitions
 */
export function getAllConfigDefinitions(): ConfigVariableDefinition[] {
	return Array.from(configRegistry.values());
}

/**
 * Get a specific configuration definition
 */
export function getConfigDefinition(key: string): ConfigVariableDefinition | undefined {
	return configRegistry.get(key);
}

/**
 * Parse a stored string value based on type
 */
function parseValue(value: string, type: ConfigType): unknown {
	switch (type) {
		case 'number':
			return Number(value);
		case 'boolean':
			return value === 'true';
		case 'json':
			return JSON.parse(value);
		case 'string':
		default:
			return value;
	}
}

/**
 * Serialize a value to string for storage
 */
function serializeValue(value: unknown, type: ConfigType): string {
	switch (type) {
		case 'json':
			return JSON.stringify(value);
		case 'number':
		case 'boolean':
			return String(value);
		case 'string':
		default:
			return value as string;
	}
}

/**
 * Get a configuration variable value
 * Returns the database value if exists, otherwise the default value
 */
export async function getConfig<T>(key: string): Promise<T> {
	const definition = configRegistry.get(key);
	if (!definition) {
		throw new Error(`Config variable "${key}" is not registered`);
	}

	try {
		const [row] = await db
			.select()
			.from(table.configVariable)
			.where(eq(table.configVariable.key, key))
			.limit(1);

		if (row) {
			return parseValue(row.value, definition.type) as T;
		}
	} catch (error) {
		console.error(`Error fetching config "${key}":`, error);
	}

	// Return default value if not found or error occurred
	return definition.defaultValue as T;
}

/**
 * Set a configuration variable value
 * Creates or updates the database record
 */
export async function setConfig<T>(
	key: string,
	value: T,
	updatedBy?: string
): Promise<{ success: boolean; error?: string }> {
	const definition = configRegistry.get(key);
	if (!definition) {
		return { success: false, error: `Config variable "${key}" is not registered` };
	}

	if (definition.isEditable === false) {
		return { success: false, error: `Config variable "${key}" is not editable` };
	}

	// Validate the value
	if (definition.validator) {
		const validationResult = definition.validator(value);
		if (validationResult !== true) {
			return {
				success: false,
				error: typeof validationResult === 'string' ? validationResult : 'Validation failed'
			};
		}
	}

	const serializedValue = serializeValue(value, definition.type);
	const serializedDefault = serializeValue(definition.defaultValue, definition.type);

	try {
		const [existing] = await db
			.select()
			.from(table.configVariable)
			.where(eq(table.configVariable.key, key))
			.limit(1);

		if (existing) {
			await db
				.update(table.configVariable)
				.set({
					value: serializedValue,
					updatedAt: new Date(),
					updatedBy
				})
				.where(eq(table.configVariable.key, key));
		} else {
			await db.insert(table.configVariable).values({
				key,
				value: serializedValue,
				type: definition.type,
				category: definition.category,
				description: definition.description,
				defaultValue: serializedDefault,
				isEditable: definition.isEditable ?? true,
				updatedBy
			});
		}

		return { success: true };
	} catch (error) {
		console.error(`Error setting config "${key}":`, error);
		return { success: false, error: 'Database error' };
	}
}

/**
 * Reset a configuration variable to its default value
 */
export async function resetConfig(key: string, updatedBy?: string): Promise<boolean> {
	const definition = configRegistry.get(key);
	if (!definition) {
		return false;
	}

	return (await setConfig(key, definition.defaultValue, updatedBy)).success;
}

/**
 * Get all configuration variables with their current and default values
 */
export async function getAllConfigs(): Promise<
	Array<{
		key: string;
		value: unknown;
		defaultValue: unknown;
		type: ConfigType;
		category: string;
		description: string;
		isEditable: boolean;
		isDefault: boolean;
	}>
> {
	const definitions = Array.from(configRegistry.values());
	const dbConfigs = await db.select().from(table.configVariable);

	const dbConfigMap = new Map(dbConfigs.map((c) => [c.key, c]));

	return definitions.map((def) => {
		const dbConfig = dbConfigMap.get(def.key);
		const currentValue = dbConfig ? parseValue(dbConfig.value, def.type) : def.defaultValue;

		return {
			key: def.key,
			value: currentValue,
			defaultValue: def.defaultValue,
			type: def.type,
			category: def.category,
			description: def.description,
			isEditable: def.isEditable ?? true,
			isDefault: !dbConfig || dbConfig.value === serializeValue(def.defaultValue, def.type)
		};
	});
}

/**
 * Initialize all config variables in the database
 * This ensures all registered configs have database records
 */
export async function initializeConfigs(): Promise<void> {
	const definitions = Array.from(configRegistry.values());

	for (const def of definitions) {
		const [existing] = await db
			.select()
			.from(table.configVariable)
			.where(eq(table.configVariable.key, def.key))
			.limit(1);

		if (!existing) {
			await db.insert(table.configVariable).values({
				key: def.key,
				value: serializeValue(def.defaultValue, def.type),
				type: def.type,
				category: def.category,
				description: def.description,
				defaultValue: serializeValue(def.defaultValue, def.type),
				isEditable: def.isEditable ?? true
			});
		}
	}
}
