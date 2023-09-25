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
exports.CodeIndex = void 0;
const vectra_1 = require("vectra");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const internals_1 = require("./internals");
class CodeIndex {
    constructor(folderPath = '.codepilot') {
        this._folderPath = folderPath;
    }
    get config() {
        return this._config;
    }
    get folderPath() {
        return this._folderPath;
    }
    get keys() {
        return this._keys;
    }
    add(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isCreated())) {
                throw new Error('Index has not been created yet. Please run `codepilot create` first.');
            }
            // Ensure config loaded
            const configPath = path.join(this.folderPath, 'config.json');
            if (!this._config) {
                this._config = JSON.parse(yield fs.readFile(configPath, 'utf-8'));
            }
            // Clone config
            const newConfig = Object.assign({}, this._config);
            // Add sources
            if (Array.isArray(config.sources)) {
                config.sources.forEach(source => {
                    if (!newConfig.sources.includes(source)) {
                        newConfig.sources.push(source);
                    }
                });
            }
            // Add extensions
            if (Array.isArray(config.extensions)) {
                if (!newConfig.extensions) {
                    newConfig.extensions = [];
                }
                config.extensions.forEach(extension => {
                    if (!newConfig.extensions.includes(extension)) {
                        newConfig.extensions.push(extension);
                    }
                });
            }
            // Write config
            yield fs.writeFile(configPath, JSON.stringify(newConfig));
            this._config = newConfig;
        });
    }
    create(keys, config) {
        return __awaiter(this, void 0, void 0, function* () {
            // Delete folder if it exists
            if (yield fs.stat(this.folderPath).then(() => true).catch(() => false)) {
                yield fs.rm(this.folderPath, { recursive: true });
            }
            // Create folder
            yield fs.mkdir(this.folderPath);
            try {
                // Create config file
                yield fs.writeFile(path.join(this.folderPath, 'config.json'), JSON.stringify(config));
                // Create keys file
                yield fs.writeFile(path.join(this.folderPath, 'vectra.keys'), JSON.stringify(keys));
                // Create .gitignore file
                yield fs.writeFile(path.join(this.folderPath, '.gitignore'), 'vectra.keys');
                this._config = config;
                this._keys = keys;
                // Create index
                const index = yield this.ensureDocumentIndex();
                yield index.createIndex();
            }
            catch (err) {
                this._config = undefined;
                this._keys = undefined;
                yield fs.rm(this.folderPath, { recursive: true });
                throw new Error(`Error creating index: ${err.toString()}`);
            }
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.rm(this.folderPath, { recursive: true });
            this._config = undefined;
            this._keys = undefined;
            this._index = undefined;
        });
    }
    hasKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fs.stat(path.join(this.folderPath, 'vectra.keys')).then(() => true).catch(() => false);
        });
    }
    isCreated() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield fs.stat(this.folderPath).then(() => true).catch(() => false);
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._config) {
                const configPath = path.join(this.folderPath, 'config.json');
                this._config = JSON.parse(yield fs.readFile(configPath, 'utf-8'));
            }
            if (!this._keys) {
                const keysPath = path.join(this.folderPath, 'vectra.keys');
                this._keys = JSON.parse(yield fs.readFile(keysPath, 'utf-8'));
            }
            return this.ensureDocumentIndex();
        });
    }
    query(query, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isCreated())) {
                throw new Error('Index has not been created yet. Please run `codepilot create` first.');
            }
            if (!(yield this.hasKeys())) {
                throw new Error("A local vectra.keys file couldn't be found. Please run `codepilot set --key <your OpenAI key>`.");
            }
            // Query document index
            const index = yield this.ensureDocumentIndex();
            return yield index.queryDocuments(query, options);
        });
    }
    rebuild() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isCreated())) {
                throw new Error('Index has not been created yet. Please run `codepilot create` first.');
            }
            if (!(yield this.hasKeys())) {
                throw new Error("A local vectra.keys file couldn't be found. Please run `codepilot set --key <your OpenAI key>`.");
            }
            // Create fresh index
            const index = yield this.ensureDocumentIndex();
            if (yield index.isCatalogCreated()) {
                yield index.deleteIndex();
            }
            yield index.createIndex();
            // Index files
            const fetcher = new vectra_1.FileFetcher();
            for (const source of this._config.sources) {
                yield fetcher.fetch(source, (uri, text, docType) => __awaiter(this, void 0, void 0, function* () {
                    // Ignore if extension not allowed
                    if (this._config.extensions && docType && !this._config.extensions.includes(docType)) {
                        return true;
                    }
                    // Upsert document
                    console.log(internals_1.Colorize.progress(`adding: ${uri}`));
                    yield index.upsertDocument(uri, text, docType);
                    return true;
                }));
            }
        });
    }
    remove(config) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isCreated())) {
                throw new Error('Index has not been created yet. Please run `codepilot create` first.');
            }
            // Ensure config loaded
            const configPath = path.join(this.folderPath, 'config.json');
            if (!this._config) {
                this._config = JSON.parse(yield fs.readFile(configPath, 'utf-8'));
            }
            // Clone config
            const newConfig = Object.assign({}, this._config);
            // Remove sources
            if (Array.isArray(config.sources)) {
                newConfig.sources = newConfig.sources.filter(source => !config.sources.includes(source));
            }
            // Remove extensions
            if (Array.isArray(config.extensions)) {
                newConfig.extensions = (_a = newConfig.extensions) === null || _a === void 0 ? void 0 : _a.filter(extension => !config.extensions.includes(extension));
            }
            // Write config
            yield fs.writeFile(configPath, JSON.stringify(newConfig));
            this._config = newConfig;
        });
    }
    setKeys(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isCreated())) {
                throw new Error('Index has not been created yet. Please run `codepilot create` first.');
            }
            // Overwrite keys file
            yield fs.writeFile(path.join(this.folderPath, 'vectra.keys'), JSON.stringify(keys));
            this._keys = keys;
        });
    }
    setConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.isCreated())) {
                throw new Error('Index has not been created yet. Please run `codepilot create` first.');
            }
            // Ensure config loaded
            const configPath = path.join(this.folderPath, 'config.json');
            if (!this._config) {
                this._config = JSON.parse(yield fs.readFile(configPath, 'utf-8'));
            }
            // Clone config
            const newConfig = Object.assign({}, this._config);
            // Apply changes
            if (config.model !== undefined) {
                newConfig.model = config.model;
            }
            if (config.max_input_tokens !== undefined) {
                newConfig.max_input_tokens = config.max_input_tokens;
            }
            if (config.max_tokens !== undefined) {
                newConfig.max_tokens = config.max_tokens;
            }
            if (config.temperature !== undefined) {
                newConfig.temperature = config.temperature;
            }
            // Write config
            yield fs.writeFile(configPath, JSON.stringify(newConfig));
            this._config = newConfig;
        });
    }
    ensureDocumentIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._index) {
                yield this.load();
                const folderPath = path.join(this.folderPath, 'index');
                const embeddings = new vectra_1.OpenAIEmbeddings(Object.assign({ model: 'text-embedding-ada-002' }, this._keys));
                this._index = new vectra_1.LocalDocumentIndex({
                    folderPath,
                    embeddings,
                });
            }
            return this._index;
        });
    }
}
exports.CodeIndex = CodeIndex;
//# sourceMappingURL=CodeIndex.js.map