import { LocalDocumentIndex, LocalDocumentIndexConfig, FileFetcher, OpenAIEmbeddingsOptions, OpenAIEmbeddings, DocumentQueryOptions, LocalDocumentResult } from "vectra";
import * as fs from 'fs/promises';
import * as path from 'path';
import { Colorize } from "./internals";

export interface CodeIndexConfig {
    model: string;
    max_input_tokens: number;
    max_tokens: number;
    sources: string[];
    temperature: number;
    extensions?: string[];
}

export interface OpenAIKeys {
    /**
     * API key to use when calling the OpenAI API.
     * @remarks
     * A new API key can be created at https://platform.openai.com/account/api-keys.
     */
    apiKey: string;

    /**
     * Optional. Organization to use when calling the OpenAI API.
     */
    organization?: string;

    /**
     * Optional. Endpoint to use when calling the OpenAI API.
     * @remarks
     * For Azure OpenAI this is the deployment endpoint.
     */
    endpoint?: string;
}

export class CodeIndex {
    private readonly _folderPath: string;
    private _config?: CodeIndexConfig;
    private _keys?: OpenAIKeys;
    private _index?: LocalDocumentIndex;

    constructor(folderPath = '.codepilot') {
        this._folderPath = folderPath;
    }

    public get config(): CodeIndexConfig | undefined {
        return this._config;
    }

    public get folderPath(): string {
        return this._folderPath;
    }

    public get keys(): OpenAIKeys | undefined {
        return this._keys;
    }

    public async add(config: Partial<CodeIndexConfig>): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }

        // Ensure config loaded
        const configPath = path.join(this.folderPath, 'config.json');
        if (!this._config) {
            this._config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
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
                if (!newConfig.extensions!.includes(extension)) {
                    newConfig.extensions!.push(extension);
                }
            });
        }

        // Write config
        await fs.writeFile(configPath, JSON.stringify(newConfig));
        this._config = newConfig;
    }

    public async create(keys: OpenAIKeys, config: CodeIndexConfig): Promise<void> {
        // Delete folder if it exists
        if (await fs.stat(this.folderPath).then(() => true).catch(() => false)) {
            await fs.rm(this.folderPath, { recursive: true });
        }

        // Create folder
        await fs.mkdir(this.folderPath);

        try {
            // Create config file
            await fs.writeFile(path.join(this.folderPath, 'config.json'), JSON.stringify(config));

            // Create keys file
            await fs.writeFile(path.join(this.folderPath, 'vectra.keys'), JSON.stringify(keys));

            // Create .gitignore file
            await fs.writeFile(path.join(this.folderPath, '.gitignore'), 'vectra.keys');
            this._config = config;
            this._keys = keys;

            // Create index
            const index = await this.ensureDocumentIndex();
            await index.createIndex();
        } catch(err: unknown) {
            this._config = undefined;
            this._keys = undefined;
            await fs.rm(this.folderPath, { recursive: true });
            throw new Error(`Error creating index: ${(err as any).toString()}`);
        }
    }

    public async delete(): Promise<void> {
        await fs.rm(this.folderPath, { recursive: true });
        this._config = undefined;
        this._keys = undefined;
        this._index = undefined;
    }

    public async hasKeys(): Promise<boolean> {
        return await fs.stat(path.join(this.folderPath, 'vectra.keys')).then(() => true).catch(() => false);
    }

    public async isCreated(): Promise<boolean> {
        return await fs.stat(this.folderPath).then(() => true).catch(() => false);
    }

    public async load(): Promise<LocalDocumentIndex> {
        if (!this._config) {
            const configPath = path.join(this.folderPath, 'config.json');
            this._config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        }

        if (!this._keys) {
            const keysPath = path.join(this.folderPath, 'vectra.keys');
            this._keys = JSON.parse(await fs.readFile(keysPath, 'utf-8'));
        }

        return this.ensureDocumentIndex();
    }

    public async query(query: string, options?: DocumentQueryOptions): Promise<LocalDocumentResult[]> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }
        if (!await this.hasKeys()) {
            throw new Error("A local vectra.keys file couldn't be found. Please run `codepilot set --key <your OpenAI key>`.");
        }

        // Query document index
        const index = await this.ensureDocumentIndex();
        return await index.queryDocuments(query, options);
    }

    public async rebuild(): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }
        if (!await this.hasKeys()) {
            throw new Error("A local vectra.keys file couldn't be found. Please run `codepilot set --key <your OpenAI key>`.");
        }

        // Create fresh index
        const index = await this.ensureDocumentIndex();
        if (await index.isCatalogCreated()) {
            await index.deleteIndex();
        }
        await index.createIndex();

        // Index files
        const fetcher = new FileFetcher();
        for (const source of this._config!.sources) {
            await fetcher.fetch(source, async (uri, text, docType) => {
                // Ignore if extension not allowed
                if (this._config!.extensions && docType && !this._config!.extensions!.includes(docType)) {
                    return true;
                }

                // Upsert document
                console.log(Colorize.progress(`adding: ${uri}`));
                await index.upsertDocument(uri, text, docType);
                return true;
            });
        }
    }

    public async remove(config: Partial<CodeIndexConfig>): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }

        // Ensure config loaded
        const configPath = path.join(this.folderPath, 'config.json');
        if (!this._config) {
            this._config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        }

        // Clone config
        const newConfig = Object.assign({}, this._config);

        // Remove sources
        if (Array.isArray(config.sources)) {
            newConfig.sources = newConfig.sources.filter(source => !config.sources!.includes(source));
        }

        // Remove extensions
        if (Array.isArray(config.extensions)) {
            newConfig.extensions = newConfig.extensions?.filter(extension => !config.extensions!.includes(extension));
        }

        // Write config
        await fs.writeFile(configPath, JSON.stringify(newConfig));
        this._config = newConfig;
    }

    public async setKeys(keys: OpenAIKeys): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }

        // Overwrite keys file
        await fs.writeFile(path.join(this.folderPath, 'vectra.keys'), JSON.stringify(keys));
        this._keys = keys;
    }

    public async setConfig(config: Partial<CodeIndexConfig>): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }

        // Ensure config loaded
        const configPath = path.join(this.folderPath, 'config.json');
        if (!this._config) {
            this._config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
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
        await fs.writeFile(configPath, JSON.stringify(newConfig));
        this._config = newConfig;
    }

    private async ensureDocumentIndex(): Promise<LocalDocumentIndex> {
        if (!this._index) {
            await this.load();
            const folderPath = path.join(this.folderPath, 'index');
            const embeddings = new OpenAIEmbeddings(Object.assign({ model: 'text-embedding-ada-002' }, this._keys));
            this._index = new LocalDocumentIndex({
                folderPath,
                embeddings,
            });
        }

        return this._index;
    }
}
