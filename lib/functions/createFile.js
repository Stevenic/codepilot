"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCreateFile = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Schema for a function that creates a file at the specified path.
 */
const createFileFunction = {
    name: "createFile",
    description: "Creates a new file at the specified path. Only use for new files not existing ones.",
    parameters: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The path to the file to create"
            },
            contents: {
                type: "string",
                description: "The contents to write to the new file"
            }
        },
        required: ["filePath", "contents"]
    }
};
/**
 * Adds the createFile function to the codepilot instance.
 */
function addCreateFile(codepilot) {
    codepilot.addFunction(createFileFunction, (args) => __awaiter(this, void 0, void 0, function* () {
        const { filePath, contents } = args;
        // Check if the file already exists
        if (yield fs.access(path.join(process.cwd(), filePath)).then(() => true).catch(() => false)) {
            return `File already exists at ${filePath}`;
        }
        try {
            // Write the code to the file
            yield fs.writeFile(path.join(process.cwd(), filePath), contents);
            return `Successfully created file at ${filePath}`;
        }
        catch (error) {
            return `Failed to create file at ${filePath}`;
        }
    }));
}
exports.addCreateFile = addCreateFile;
//# sourceMappingURL=createFile.js.map