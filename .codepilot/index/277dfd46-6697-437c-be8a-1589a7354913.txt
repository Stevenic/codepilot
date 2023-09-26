import { Codepilot } from '../Codepilot';
import { addCreateFile } from './createFile';

/**
 * Registers all functions with the codepilot instance.
 */
export function registerFunctions(codepilot: Codepilot): void {
    // Add the createFile function to the codepilot instance
    addCreateFile(codepilot);
}