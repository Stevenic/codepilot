import { LocalDocumentIndex, DocumentQueryOptions, LocalDocumentResult } from "vectra";
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
export declare class CodeIndex {
    private readonly _folderPath;
    private _config?;
    private _keys?;
    private _index?;
    constructor(folderPath?: string);
    get config(): CodeIndexConfig | undefined;
    get folderPath(): string;
    get keys(): OpenAIKeys | undefined;
    add(config: Partial<CodeIndexConfig>): Promise<void>;
    create(keys: OpenAIKeys, config: CodeIndexConfig): Promise<void>;
    delete(): Promise<void>;
    hasKeys(): Promise<boolean>;
    isCreated(): Promise<boolean>;
    load(): Promise<LocalDocumentIndex>;
    query(query: string, options?: DocumentQueryOptions): Promise<LocalDocumentResult[]>;
    rebuild(): Promise<void>;
    remove(config: Partial<CodeIndexConfig>): Promise<void>;
    setKeys(keys: OpenAIKeys): Promise<void>;
    setConfig(config: Partial<CodeIndexConfig>): Promise<void>;
    private ensureDocumentIndex;
}
//# sourceMappingURL=CodeIndex.d.ts.map