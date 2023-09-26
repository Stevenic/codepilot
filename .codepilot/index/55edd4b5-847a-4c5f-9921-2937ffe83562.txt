import * as fs from 'fs/promises';
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Colorize } from "./internals";
import { CodeIndex, CodeIndexConfig } from "./CodeIndex";
import { Codepilot } from './Codepilot';

/**
 * Defines the commands supported by the Codepilot CLI.
 */
export async function run() {
    // prettier-ignore
    const args = await yargs(hideBin(process.argv))
        .scriptName('vectra')
        .command('$0', 'chat mode', {}, async () => {
            // Ensure index exists and has keys
            const index = new CodeIndex();
            if (!await index.isCreated()) {
                console.log(Colorize.output([
                    `We need to first create an index before you can chat with Codepilot.`,
                    `You'll need to provide an OpenAI API key and a source folder to index.`,
                    `You can create an OpenAI API key at https://platform.openai.com/account/api-keys.`,
                    `A paid account is recommended but OpenAI will give you $5 in free credits to get started.`,
                    `Once you have your OpenAI API key, you can create a new index by running:\n`,
                    `codepilot create --key <api key> --source <source folder> [--source <additional source folder>]\n`,
                    `By default, all files under your source folders will be included in the index.`,
                    `If you'd only like certain file extensions to be indexed, you can add the "--extension <included extensions> [--extension <additional extension>]" option.`,
                    `Once the index has finished building, you can start chatting with Codepilot by running:\n`,
                    `codepilot\n`,
                ].join(`\n`)));
                return;
            }
            if (!await index.hasKeys()) {
                console.log(Colorize.output([
                    `A Codepilot index was found but you haven't configured your personal OpenAI key.`,
                    `You'll need to provide an OpenAI API key before you can continue.`,
                    `You can create an OpenAI API key at https://platform.openai.com/account/api-keys.`,
                    `A paid account is recommended but OpenAI will give you $5 in free credits to get started.`,
                    `Once you have your OpenAI API key, you can configure your local index to use that key by running:\n`,
                    `codepilot set --key <api key>\n`,
                    `Once you've configured your personal key, you can start chatting with Codepilot by running:\n`,
                    `codepilot\n`,
                ].join(`\n`)));
                return;
            }

            // Load index
            await index.load();

            // Start a Codepilot chat session
            const codepilot = new Codepilot(index);
            await codepilot.chat();
        })
        .command('create', `creates a new code index`, (yargs) => {
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
            console.log(Colorize.title(`Creating new code index`));

            // Get optimal config
            const config = getOptimalConfig(args.model as string, args.source as string[], args.extension as string[]);

            // Create index
            const index = new CodeIndex();
            await index.create({ apiKey: args.key as string }, config);
            console.log(Colorize.output([
                `I created a new code index under the '${index.folderPath}' folder.`,
                `Building the index can take a while depending on the size of your source folders.\n`,
            ].join('\n')));

            // Build index
            await index.rebuild();
            console.log(Colorize.output([
                `\nThe index for your source code has been built.`,
                `You can add additional sources and/or extension filters to your index by running:\n`,
                `codepilot add --source <source folder> [--source <additional source folder>] [--extension <included extensions> [--extension <additional extension>]]\n`,
                `You current model is '${index.config!.model}'. You can change the model by running:\n`,
                `codepilot set --model <model name>\n`,
                `Only chat completion based models are currently supported.`,
                `To start chatting with Codepilot simply run:\n`,
                `codepilot\n`,
            ].join('\n')));
        })
        .command('delete', `delete an existing code index`, {}, async (args) => {
            const index = new CodeIndex();
            await index.delete();
            console.log(Colorize.output(`Your index was deleted.`));
        })
        .command('add', `adds additional source folders and/or extension filters to your code index`, (yargs) => {
            return yargs
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
        }, async (args) => {
            // Ensure index exists and has keys
            const index = new CodeIndex();
            if (!await index.isCreated()) {
                console.log(Colorize.output(`No index was found. Please run 'codepilot create' first.`));
                return;
            }
            if (!await index.hasKeys()) {
                console.log(Colorize.output([
                    `A Codepilot index was found but you haven't configured your personal OpenAI key.`,
                    `You'll need to provide an OpenAI API key before you can continue.`,
                    `You can create an OpenAI API key at https://platform.openai.com/account/api-keys.`,
                    `A paid account is recommended but OpenAI will give you $5 in free credits to get started.`,
                    `Once you have your OpenAI API key, you can configure your local index to use that key by running:\n`,
                    `codepilot set --key <api key>\n`,
                    `Once you've configured your personal key, you can re-run your command.`,
                ].join(`\n`)));
                return;
            }

            // Add sources and/or extensions
            console.log(Colorize.title('Updating sources and/or extensions'));
            await index.add({
                sources: args.source as string[],
                extensions: args.extension as string[]
            });
            console.log(Colorize.output([
                `Your sources and/or extensions have been updated.`,
                `You can rebuild your index by running:\n`,
                `codepilot rebuild\n`,
            ].join('\n')));
        })
        .command('rebuild', 'chat mode', {}, async () => {
            // Ensure index exists and has keys
            const index = new CodeIndex();
            if (!await index.isCreated()) {
                console.log(Colorize.output(`No index was found. Please run 'codepilot create' first.`));
                return;
            }
            if (!await index.hasKeys()) {
                console.log(Colorize.output([
                    `A Codepilot index was found but you haven't configured your personal OpenAI key.`,
                    `You'll need to provide an OpenAI API key before you can continue.`,
                    `You can create an OpenAI API key at https://platform.openai.com/account/api-keys.`,
                    `A paid account is recommended but OpenAI will give you $5 in free credits to get started.`,
                    `Once you have your OpenAI API key, you can configure your local index to use that key by running:\n`,
                    `codepilot set --key <api key>\n`,
                    `Once you've configured your personal key, you can re-run your command.`,
                ].join(`\n`)));
                return;
            }

            // Rebuild index
            console.log(Colorize.title('Rebuilding code index'));
            await index.rebuild();
            console.log(Colorize.output([
                `\nThe index for your source code has been rebuilt.`,
                `To start chatting with Codepilot run:\n`,
                `codepilot\n`,
            ].join('\n')));
        })
        .command('remove', `removes source folders and/or extension filters from your code index`, (yargs) => {
            return yargs
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
        }, async (args) => {
            // Ensure index exists and has keys
            const index = new CodeIndex();
            if (!await index.isCreated()) {
                console.log(Colorize.output(`No index was found. Please run 'codepilot create' first.`));
                return;
            }
            if (!await index.hasKeys()) {
                console.log(Colorize.output([
                    `A Codepilot index was found but you haven't configured your personal OpenAI key.`,
                    `You'll need to provide an OpenAI API key before you can continue.`,
                    `You can create an OpenAI API key at https://platform.openai.com/account/api-keys.`,
                    `A paid account is recommended but OpenAI will give you $5 in free credits to get started.`,
                    `Once you have your OpenAI API key, you can configure your local index to use that key by running:\n`,
                    `codepilot set --key <api key>\n`,
                    `Once you've configured your personal key, you can re-run your command.`,
                ].join(`\n`)));
                return;
            }

            // Removing sources and/or extensions
            console.log(Colorize.title('Updating sources and/or extensions'));
            await index.remove({
                sources: args.source as string[],
                extensions: args.extension as string[]
            });
            console.log(Colorize.output([
                `Your sources and/or extensions have been updated.`,
                `You can rebuild your index by running:\n`,
                `codepilot rebuild\n`,
            ].join('\n')));
        })
        .command('set', `creates a new code index`, (yargs) => {
            return yargs
                .option('key', {
                    alias: 'k',
                    describe: 'OpenAI API key to use for generating embeddings and querying the model.',
                    type: 'string'
                })
                .option('model', {
                    alias: 'm',
                    describe: 'OpenAI model to use for queries. Defaults to "gpt-3.5-turbo-16k".',
                    type: 'string'
                });
        }, async (args) => {
            const index = new CodeIndex();
            if (args.key) {
                console.log(Colorize.output(`Updating OpenAI key`));
                await index.setKeys({ apiKey: args.key as string });
            }

            if (args.model) {
                console.log(Colorize.output(`Updating model`));
                const config = getOptimalConfig(args.model as string, args.source as string[], args.extension as string[]);
                index.setConfig(config);
            }
        })
        .help()
        .demandCommand()
        .parseAsync();
}

function getOptimalConfig(model: string, sources: string[], extensions: string[]): CodeIndexConfig {
    const config = {
        model,
        sources,
        extensions,
        temperature: 0.2
    } as CodeIndexConfig;

    if (model.startsWith('gpt-3.5-turbo-16k')) {
        config.max_input_tokens = 12000;
        config.max_tokens = 3000;
    } else if (model.startsWith('gpt-3.5-turbo-instruct')) {
        throw new Error(`The 'gpt-3.5-turbo-instruct' model is not yet supported.`);
    } else if (model.startsWith('gpt-3.5-turbo')) {
        config.max_input_tokens = 3000;
        config.max_tokens = 800;
    } else if (model.startsWith('gpt-4-32k')) {
        config.max_input_tokens = 24000;
        config.max_tokens = 6000;
    } else if (model.startsWith('gpt-4')) {
        config.max_input_tokens = 6000;
        config.max_tokens = 1500;
    } else {
        throw new Error(`The '${model}' model is not yet supported.`);
    }

    return config;
}