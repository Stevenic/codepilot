import { LocalDocumentIndex, DocumentQueryOptions, LocalDocumentResult } from "vectra";
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
/**
 * The current projects source code index.
 */
export declare class CodeIndex {
    private readonly _folderPath;
    private _config?;
    private _keys?;
    private _index?;
    /**
     * Creates a new 'CodeIndex' instance.
     * @param folderPath Optional. The path to the folder containing the index. Defaults to '.codepilot'.
     */
    constructor(folderPath?: string);
    /**
     * Gets the current code index configuration.
     */
    get config(): CodeIndexConfig | undefined;
    /**
     * Gets the path to the folder containing the index.
     */
    get folderPath(): string;
    /**
     * Gets the current OpenAI keys.
     */
    get keys(): OpenAIKeys | undefined;
    /**
     * Adds sources and extensions to the index.
     * @param config The configuration containing the sources and extensions to add.
     */
    add(config: Partial<CodeIndexConfig>): Promise<void>;
    /**
     * Creates a new code index.
     * @param keys OpenAI keys to use.
     * @param config Source code index configuration.
     */
    create(keys: OpenAIKeys, config: CodeIndexConfig): Promise<void>;
    /**
     * Deletes the current code index.
     */
    delete(): Promise<void>;
    /**
     * Returns whether a `vectra.keys` file exists for the index.
     */
    hasKeys(): Promise<boolean>;
    /**
     * Returns true if the index has been created.
     */
    isCreated(): Promise<boolean>;
    /**
     * Loads the current code index.
     */
    load(): Promise<LocalDocumentIndex>;
    /**
     * Queries the code index.
     * @param query Text to query the index with.
     * @param options Optional. Options to use when querying the index.
     * @returns Found documents.
     */
    query(query: string, options?: DocumentQueryOptions): Promise<LocalDocumentResult[]>;
    /**
     * Rebuilds the code index.
     */
    rebuild(): Promise<void>;
    /**
     * Removes sources and extensions from the index.
     * @param config The configuration containing the sources and extensions to remove.
     */
    remove(config: Partial<CodeIndexConfig>): Promise<void>;
    /**
     * Updates the OpenAI keys for the index.
     * @param keys Keys to use.
     */
    setKeys(keys: OpenAIKeys): Promise<void>;
    /**
     * Updates the code index configuration.
     * @param config Settings to update.
     */
    setConfig(config: Partial<CodeIndexConfig>): Promise<void>;
    /**
     * Adds a document to the index.
     * @param path Path to the document to add.
     */
    upsertDocument(path: string): Promise<void>;
}
//# sourceMappingURL=CodeIndex.d.ts.map