/**
 * Configuration System Initialization
 * This file registers all configuration variables and should be imported early in the app lifecycle
 */

import { registerRateLimitConfigs } from './rate-limits';

/**
 * Register all application configuration variables
 * Call this once during application startup
 */
export function initializeConfigSystem() {
	// Register rate limit and security configurations
	registerRateLimitConfigs();

	// Add more config registration functions here as needed
	// e.g., registerFeatureFlags(), registerEmailConfigs(), etc.
}

// Export config utilities for use throughout the application
export { getConfig, setConfig, resetConfig, getAllConfigs, initializeConfigs } from './variables';
export { minutesToMs, hoursToMs } from './rate-limits';
