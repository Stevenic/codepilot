import * as fs from 'fs/promises';
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Colorize } from "./internals";
import { CodeIndex } from "./CodeIndex";

export async function run() {
    // prettier-ignore
    const args = await yargs(hideBin(process.argv))
        .scriptName('vectra')
        .command('$0', 'interactive mode', {}, async () => {
            //
        })
        .command('delete', `delete an existing code index`, {}, async (args) => {
            const index = new CodeIndex();
            await index.delete();
            console.log(Colorize.output(`Index deleted.`));
        })
        .command('create', `initializes a new code index`, (yargs) => {
            return yargs
                .option('key', {
                    alias: 'k',
                    describe: 'OpenAI API key to use for generating embeddings and querying the model.',
                    type: 'string'
                })
                .option('model', {
                    alias: 'm',
                    describe: 'OpenAI model to use for queries. Defaults to "gpt-3.5-turbo-16k".',
                    type: 'string',
                    default: 'gpt-3.5-turbo-16k'
                })
                .option('source', {
                    alias: 's',
                    array: true,
                    describe: 'source folder(s) to index.',
                    type: 'string'
                })
                .option('extension', {
                    alias: 'e',
                    array: true,
                    describe: 'extension(s) to filter to.',
                    type: 'string'
                })
                .demandOption(['key', 'source']);
        }, async (args) => {
            console.log(Colorize.title('Creating new code index'));

            // Create index
            const index = new CodeIndex();
            await index.create({ apiKey: args.key as string }, {
                model: args.model as string,
                sources: args.source as string[],
                extensions: args.extension as string[]
            });
        })
        .command('remove <index>', `removes one or more documents from an index`, (yargs) => {
            return yargs
                .option('uri', {
                    alias: 'u',
                    array: true,
                    describe: 'uri of a document to remove',
                    type: 'string'
                })
                .option('list', {
                    alias: 'l',
                    describe: 'path to a file containing a list of documents to remove',
                    type: 'string'
                })
                .check((argv) => {
                    if (Array.isArray(argv.uri) && argv.uri.length > 0) {
                        return true;
                    } else if (typeof argv.list == 'string' && argv.list.trim().length > 0) {
                        return true;
                    } else {
                        throw new Error(`you must specify either one or more "--uri <link>" for the pages to add or a "--list <file path>" for a file containing the list of pages to add.`);
                    }
                });
        }, async (args) => {
            // Initialize index
            const folderPath = args.index as string;
            const index = new LocalDocumentIndex({ folderPath });

            // Get list of uri's
            const uris = await getItemList(args.uri as string[], args.list as string, 'document');

            // Remove documents
            for (const uri of uris) {
                console.log(`removing ${uri}`);
                await index.deleteDocument(uri);
            }
        })
        .command('stats <index>', `prints the stats for a local index`, {}, async (args) => {
            const folderPath = args.index as string;
            const index = new LocalDocumentIndex({ folderPath });
            const stats = await index.getCatalogStats();
            console.log(Colorize.title('Index Stats'));
            console.log(Colorize.output(stats));
        })
        .command('query <index> <query>', `queries a local index`, (yargs) => {
            return yargs
                .option('keys', {
                    alias: 'k',
                    describe: 'path of a JSON file containing the model keys to use for generating embeddings'
                })
                .option('document-count', {
                    alias: 'dc',
                    describe: 'max number of documents to return (defaults to 10)',
                    type: 'number',
                    default: 10
                })
                .option('chunk-count', {
                    alias: 'cc',
                    describe: 'max number of chunks to return (defaults to 50)',
                    type: 'number',
                    default: 50
                })
                .option('section-count', {
                    alias: 'sc',
                    describe: 'max number of document sections to render (defaults to 1)',
                    type: 'number',
                    default: 1
                })
                .option('tokens', {
                    alias: 't',
                    describe: 'max number of tokens to render for each document section (defaults to 2000)',
                    type: 'number',
                    default: 2000
                })
                .option('format', {
                    alias: 'f',
                    describe: `format of the rendered results. Defaults to 'sections'`,
                    choices: ['sections', 'stats', 'chunks'],
                    default: 'sections'
                })
                .demandOption(['keys']);
        }, async (args) => {
            console.log(Colorize.title('Querying Index'));

            // Create embeddings
            const keys = JSON.parse(await fs.readFile(args.keys as string, 'utf-8'));
            const embeddings = new OpenAIEmbeddings(Object.assign({ model: 'text-embedding-ada-002' }, keys));

            // Initialize index
            const folderPath = args.index as string;
            const index = new LocalDocumentIndex({
                folderPath,
                embeddings
            });

            // Query index
            const query = args.query as string;
            const results = await index.queryDocuments(query, {
                maxDocuments: args.documentCount,
                maxChunks: args.chunkCount,
            });

            // Render results
            for (const result of results) {
                console.log(Colorize.output(result.uri));
                console.log(Colorize.value('score', result.score));
                console.log(Colorize.value('chunks', result.chunks.length));
                if (args.format == 'sections') {
                    const sections = await result.renderSections(args.tokens, args.sectionCount);
                    for (let i = 0; i < sections.length; i++) {
                        const section = sections[i];
                        console.log(Colorize.title(args.sectionCount == 1 ? 'Section' : `Section ${i + 1}`));
                        console.log(Colorize.value('score', section.score));
                        console.log(Colorize.value('tokens', section.tokenCount));
                        console.log(Colorize.output(section.text));
                    }
                } else if (args.format == 'chunks') {
                    const text = await result.loadText();
                    for (let i = 0; i < result.chunks.length; i++) {
                        const chunk = result.chunks[i];
                        const startPos = chunk.item.metadata.startPos;
                        const endPos = chunk.item.metadata.endPos;
                        console.log(Colorize.title(`Chunk ${i + 1}`));
                        console.log(Colorize.value('score', chunk.score));
                        console.log(Colorize.value('startPos', startPos));
                        console.log(Colorize.value('endPos', endPos));
                        console.log(Colorize.output(text.substring(startPos, endPos + 1)));
                    }
                }
            }
        })
        .help()
        .demandCommand()
        .parseAsync();
}


async function getItemList(items: string[], listFile: string, uriType: string): Promise<string[]> {
    if (Array.isArray(items) && items.length > 0) {
        return items;
    } else if (typeof listFile == 'string' && listFile.trim().length > 0) {
        const list = await fs.readFile(listFile, 'utf-8');
        return list.split('\n').map((item) => item.trim()).filter((item) => item.length > 0);
    } else {
        throw new Error(`you must specify either one or more "--uri <${uriType}>" for the items or a "--list <file path>" for a file containing the items.`)
    }
}