"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFunctions = void 0;
const createFile_1 = require("./createFile");
/**
 * Registers all functions with the codepilot instance.
 */
function registerFunctions(codepilot) {
    // Add the createFile function to the codepilot instance
    (0, createFile_1.addCreateFile)(codepilot);
}
exports.registerFunctions = registerFunctions;
//# sourceMappingURL=index.js.map