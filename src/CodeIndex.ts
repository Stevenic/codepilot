import { LocalDocumentIndex, FileFetcher, OpenAIEmbeddings, DocumentQueryOptions, LocalDocumentResult } from "vectra";
import * as fs from 'fs/promises';
import * as path from 'path';
import { Colorize } from "./internals";

const IGNORED_FILES = [
    '.gif','.jpg','.jpeg','.png','.tiff','.tif','.ico','.svg','.bmp','.webp','.heif','.heic',
    '.mpeg','.mp4','.webm','.mov','.mkv','.avi','.wmv','.mp3','.wav','.ogg','.midi','.mid','.amr',
    '.zip','.tar','.gz','.rar','.7z','.xz','.bz2','.iso','.dmg','.bin','.exe','.apk','.torrent',
];

// LLM-REGION

/**
 * The configuration for a code index.
 */
export interface CodeIndexConfig {
    /**
     * The model to use when generating embeddings.
     */
    model: string;

    /**
     * The maximum number of tokens to use when generating embeddings.
     */
    max_input_tokens: number;

    /**
     * The maximum number of tokens to use when generating completions.
     */
    max_tokens: number;

    /**
     * The sources to index.
     */
    sources: string[];

    /**
     * The temperature to use when generating completions.
     */
    temperature: number;

    /**
     * Optional. The extensions to index.
     */
    extensions?: string[];
}

// LLM-REGION

/**
 * Keys to use for OpenAI embeddings and models.
 */
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

// LLM-REGION

/**
 * The current projects source code index.
 */
export class CodeIndex {
    private readonly _folderPath: string;
    private _config?: CodeIndexConfig;
    private _keys?: OpenAIKeys;
    private _index?: LocalDocumentIndex;

    /**
     * Creates a new 'CodeIndex' instance.
     * @param folderPath Optional. The path to the folder containing the index. Defaults to '.codepilot'.
     */
    constructor(folderPath = '.codepilot') {
        this._folderPath = folderPath;
    }

    /**
     * Gets the current code index configuration.
     */
    public get config(): CodeIndexConfig | undefined {
        return this._config;
    }

    /**
     * Gets the path to the folder containing the index.
     */
    public get folderPath(): string {
        return this._folderPath;
    }

    /**
     * Gets the current OpenAI keys.
     */
    public get keys(): OpenAIKeys | undefined {
        return this._keys;
    }

    // LLM-REGION

    /**
     * Adds sources and extensions to the index.
     * @param config The configuration containing the sources and extensions to add.
     */
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

    // LLM-REGION

    /**
     * Creates a new code index.
     * @param keys OpenAI keys to use.
     * @param config Source code index configuration.
     */
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
            const index = await this.load();
            await index.createIndex();
        } catch(err: unknown) {
            this._config = undefined;
            this._keys = undefined;
            await fs.rm(this.folderPath, { recursive: true });
            throw new Error(`Error creating index: ${(err as any).toString()}`);
        }
    }

    // LLM-REGION

    /**
     * Deletes the current code index.
     */
    public async delete(): Promise<void> {
        await fs.rm(this.folderPath, { recursive: true });
        this._config = undefined;
        this._keys = undefined;
        this._index = undefined;
    }

    // LLM-REGION

    /**
     * Returns whether a `vectra.keys` file exists for the index.
     */
    public async hasKeys(): Promise<boolean> {
        return await fs.stat(path.join(this.folderPath, 'vectra.keys')).then(() => true).catch(() => false);
    }

    /**
     * Returns true if the index has been created.
     */
    public async isCreated(): Promise<boolean> {
        return await fs.stat(this.folderPath).then(() => true).catch(() => false);
    }

    // LLM-REGION

    /**
     * Loads the current code index.
     */
    public async load(): Promise<LocalDocumentIndex> {
        if (!this._config) {
            const configPath = path.join(this.folderPath, 'config.json');
            this._config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        }

        if (!this._keys) {
            const keysPath = path.join(this.folderPath, 'vectra.keys');
            this._keys = JSON.parse(await fs.readFile(keysPath, 'utf-8'));
        }

        if (!this._index) {
            const folderPath = path.join(this.folderPath, 'index');
            const embeddings = new OpenAIEmbeddings(Object.assign({ model: 'text-embedding-ada-002' }, this._keys));
            this._index = new LocalDocumentIndex({
                folderPath,
                embeddings,
            });
        }

        return this._index;
    }

    // LLM-REGION

    /**
     * Queries the code index.
     * @param query Text to query the index with.
     * @param options Optional. Options to use when querying the index.
     * @returns Found documents.
     */
    public async query(query: string, options?: DocumentQueryOptions): Promise<LocalDocumentResult[]> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }
        if (!await this.hasKeys()) {
            throw new Error("A local vectra.keys file couldn't be found. Please run `codepilot set --key <your OpenAI key>`.");
        }

        // Query document index
        const index = await this.load();
        return await index.queryDocuments(query, options);
    }

    // LLM-REGION

    /**
     * Rebuilds the code index.
     */
    public async rebuild(): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }
        if (!await this.hasKeys()) {
            throw new Error("A local vectra.keys file couldn't be found. Please run `codepilot set --key <your OpenAI key>`.");
        }

        // Create fresh index
        const index = await this.load();
        if (await index.isCatalogCreated()) {
            await index.deleteIndex();
        }
        await index.createIndex();

        // Index files
        const fetcher = new FileFetcher();
        for (const source of this._config!.sources) {
            await fetcher.fetch(source, async (uri, text, docType) => {
                // Ignore binary files
                if (IGNORED_FILES.includes(path.extname(uri))) {
                    return true;
                }

                // Ignore any disallowed extensions
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

    // LLM-REGION

    /**
     * Removes sources and extensions from the index.
     * @param config The configuration containing the sources and extensions to remove.
     */
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

    // LLM-REGION

    /**
     * Updates the OpenAI keys for the index.
     * @param keys Keys to use.
     */
    public async setKeys(keys: OpenAIKeys): Promise<void> {
        if (!await this.isCreated()) {
            throw new Error('Index has not been created yet. Please run `codepilot create` first.');
        }

        // Overwrite keys file
        await fs.writeFile(path.join(this.folderPath, 'vectra.keys'), JSON.stringify(keys));
        this._keys = keys;
    }

    /**
     * Updates the code index configuration.
     * @param config Settings to update.
     */
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
}
