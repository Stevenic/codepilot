"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const yargs_1 = __importDefault(require("yargs/yargs"));
const helpers_1 = require("yargs/helpers");
const internals_1 = require("./internals");
const CodeIndex_1 = require("./CodeIndex");
const Codepilot_1 = require("./Codepilot");
const functions_1 = require("./functions");
/**
 * Defines the commands supported by the Codepilot CLI.
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // prettier-ignore
        const args = yield (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
            .scriptName('codepilot')
            .command('$0', 'chat mode', {}, () => __awaiter(this, void 0, void 0, function* () {
            // Ensure index exists and has keys
            const index = new CodeIndex_1.CodeIndex();
            if (!(yield index.isCreated())) {
                console.log(internals_1.Colorize.output([
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
            if (!(yield index.hasKeys())) {
                console.log(internals_1.Colorize.output([
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
            yield index.load();
            // Start a Codepilot chat session
            const codepilot = new Codepilot_1.Codepilot(index);
            (0, functions_1.registerFunctions)(codepilot);
            yield codepilot.chat();
        }))
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
        }, (args) => __awaiter(this, void 0, void 0, function* () {
            console.log(internals_1.Colorize.title(`Creating new code index`));
            // Get optimal config
            const config = getOptimalConfig(args.model, args.source, args.extension);
            // Create index
            const index = new CodeIndex_1.CodeIndex();
            yield index.create({ apiKey: args.key }, config);
            console.log(internals_1.Colorize.output([
                `I created a new code index under the '${index.folderPath}' folder.`,
                `Building the index can take a while depending on the size of your source folders.\n`,
            ].join('\n')));
            // Build index
            yield index.rebuild();
            console.log(internals_1.Colorize.output([
                `\nThe index for your source code has been built.`,
                `You can add additional sources and/or extension filters to your index by running:\n`,
                `codepilot add --source <source folder> [--source <additional source folder>] [--extension <included extensions> [--extension <additional extension>]]\n`,
                `You current model is '${index.config.model}'. You can change the model by running:\n`,
                `codepilot set --model <model name>\n`,
                `Only chat completion based models are currently supported.`,
                `To start chatting with Codepilot simply run:\n`,
                `codepilot\n`,
            ].join('\n')));
        }))
            .command('delete', `delete an existing code index`, {}, (args) => __awaiter(this, void 0, void 0, function* () {
            const index = new CodeIndex_1.CodeIndex();
            yield index.delete();
            console.log(internals_1.Colorize.output(`Your index was deleted.`));
        }))
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
            });
        }, (args) => __awaiter(this, void 0, void 0, function* () {
            // Ensure index exists and has keys
            const index = new CodeIndex_1.CodeIndex();
            if (!(yield index.isCreated())) {
                console.log(internals_1.Colorize.output(`No index was found. Please run 'codepilot create' first.`));
                return;
            }
            if (!(yield index.hasKeys())) {
                console.log(internals_1.Colorize.output([
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
            console.log(internals_1.Colorize.title('Updating sources and/or extensions'));
            yield index.add({
                sources: args.source,
                extensions: args.extension
            });
            console.log(internals_1.Colorize.output([
                `Your sources and/or extensions have been updated.`,
                `You can rebuild your index by running:\n`,
                `codepilot rebuild\n`,
            ].join('\n')));
        }))
            .command('rebuild', 'chat mode', {}, () => __awaiter(this, void 0, void 0, function* () {
            // Ensure index exists and has keys
            const index = new CodeIndex_1.CodeIndex();
            if (!(yield index.isCreated())) {
                console.log(internals_1.Colorize.output(`No index was found. Please run 'codepilot create' first.`));
                return;
            }
            if (!(yield index.hasKeys())) {
                console.log(internals_1.Colorize.output([
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
            console.log(internals_1.Colorize.title('Rebuilding code index'));
            yield index.rebuild();
            console.log(internals_1.Colorize.output([
                `\nThe index for your source code has been rebuilt.`,
                `To start chatting with Codepilot run:\n`,
                `codepilot\n`,
            ].join('\n')));
        }))
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
            });
        }, (args) => __awaiter(this, void 0, void 0, function* () {
            // Ensure index exists and has keys
            const index = new CodeIndex_1.CodeIndex();
            if (!(yield index.isCreated())) {
                console.log(internals_1.Colorize.output(`No index was found. Please run 'codepilot create' first.`));
                return;
            }
            if (!(yield index.hasKeys())) {
                console.log(internals_1.Colorize.output([
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
            console.log(internals_1.Colorize.title('Updating sources and/or extensions'));
            yield index.remove({
                sources: args.source,
                extensions: args.extension
            });
            console.log(internals_1.Colorize.output([
                `Your sources and/or extensions have been updated.`,
                `You can rebuild your index by running:\n`,
                `codepilot rebuild\n`,
            ].join('\n')));
        }))
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
        }, (args) => __awaiter(this, void 0, void 0, function* () {
            const index = new CodeIndex_1.CodeIndex();
            if (args.key) {
                console.log(internals_1.Colorize.output(`Updating OpenAI key`));
                yield index.setKeys({ apiKey: args.key });
            }
            if (args.model) {
                console.log(internals_1.Colorize.output(`Updating model`));
                const config = getOptimalConfig(args.model, args.source, args.extension);
                index.setConfig(config);
            }
        }))
            .help()
            .demandCommand()
            .parseAsync();
    });
}
exports.run = run;
function getOptimalConfig(model, sources, extensions) {
    const config = {
        model,
        sources,
        extensions,
        temperature: 0.2
    };
    if (model.startsWith('gpt-3.5-turbo-16k')) {
        config.max_input_tokens = 12000;
        config.max_tokens = 3000;
    }
    else if (model.startsWith('gpt-3.5-turbo-instruct')) {
        throw new Error(`The 'gpt-3.5-turbo-instruct' model is not yet supported.`);
    }
    else if (model.startsWith('gpt-3.5-turbo')) {
        config.max_input_tokens = 3000;
        config.max_tokens = 800;
    }
    else if (model.startsWith('gpt-4-32k')) {
        config.max_input_tokens = 24000;
        config.max_tokens = 6000;
    }
    else if (model.startsWith('gpt-4')) {
        config.max_input_tokens = 6000;
        config.max_tokens = 1500;
    }
    else {
        throw new Error(`The '${model}' model is not yet supported.`);
    }
    return config;
}
//# sourceMappingURL=codepilot-cli.js.map