import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { MCPClientManager } from './mcp-client-manager.js';
import { AiAgentConfig, isLocalToolSchema } from './types.js';
import { promptAnthropic } from './provider/anthropic.js';
import { loadJs } from './util.js';
import { promptOpenAI } from './provider/openai.js';
import * as localtool from './tool/index.js';

async function main(userQuestion: string, configPath: string = 'config.js') {
    const config: AiAgentConfig = await loadJs(configPath);
    if (!config) {
        console.error(`Error: ${configPath} not found or invalid format.`);
        process.exit(1);
    }
    // Set up the MCP servers
    const mcpServers = new MCPClientManager();
    for(const [, value] of Object.entries(localtool)) {
        if (isLocalToolSchema(value)) {
            mcpServers.addTool(value);
        }
    }
    await mcpServers.init(config);

    if(config.llm.provider == 'anthropic') {
        await promptAnthropic(config, mcpServers, userQuestion);
    }
    if(config.llm.provider == 'openai') {
        await promptOpenAI(config, mcpServers, userQuestion);
    }

    await mcpServers.close();
    process.exit(0);
}

const program = new Command();
program
    .option('-i, --instruction <file>', 'path to instruction file')
    .parse(process.argv);

const options = program.opts();
const instructionFilePath = path.resolve(options.instruction || 'instruction.txt');
const initialInstruction = fs.existsSync(instructionFilePath) ? fs.readFileSync(instructionFilePath, 'utf-8') : 'Hello!';
main(initialInstruction);

/*
Tool: get_file_info {
  type: 'object',
  properties: { path: { type: 'string' } },
  required: [ 'path' ],
  additionalProperties: false,
  '$schema': 'http://json-schema.org/draft-07/schema#'
}
*/
