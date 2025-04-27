import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { AiAgentConfig, LocalToolSchema, ToolSchema } from './types.js';
import { z, ZodObject } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export class MCPClientManager {
    public allTools: ToolSchema[] = [];
    private toolServerMap: Map<string, MCPClient> = new Map();
    private toolMap: Map<string, Function> = new Map();

    public addTool(tool: LocalToolSchema) {
        this.toolMap.set(tool.name, tool.func); 
        this.allTools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: zodToJsonSchema(tool.params)
        });
    }

    public async init(config: AiAgentConfig) {
        const setupMcpServers = Object.entries(config.mcpServers).map(async ([mcpName, params]) => {
            const client = new MCPClient({ name: "example-client", version: "1.0.0" });
    
            await client.connect(new StdioClientTransport(params));
            this.toolServerMap.set(mcpName, client);    
    
            const toolList = await client.listTools();
            this.allTools.push(...toolList.tools.map((tool) => {
                return {
                    ...toolList.tools,
                    name: `${mcpName}--${tool.name}`,
                    inputSchema: tool.inputSchema
                };
            }));
        });

        // MCPサーバーの初期化
        await Promise.all(setupMcpServers);
    }
    
    public async callTool(tool_name:string, params:any): Promise<string> {
        // ツール名を分割
        const parts = tool_name.split("--");

        // MCPサーバ名がない場合は、ローカルツールを実行
        if (parts.length === 1) {
            const tool = this.toolMap.get(tool_name);
            if (!tool) {
                throw new Error(`Tool not found: ${tool_name}`);
            }
            return await tool(params);
        }

        // MCPサーバ名とツール名を取得
        const mcpName = parts[0];
        const toolName = parts.slice(1).join("--");

        const mcpClient = this.toolServerMap.get(mcpName);
        if (!mcpClient) {
            throw new Error(`Tool server not found for tool ${tool_name}`);
        }
        // MCPツール実行
        const toolResult = await mcpClient.callTool(
            {
                name: toolName,
                arguments: params,
            },
            CallToolResultSchema,
        );
        const content = toolResult.content as any[];
        const text = content.filter(a => a.type === 'text').map(a => a.text).join("\n");
        if(toolResult.isError) {
            throw new Error(text);
        }
        return text;
    }

    public async close() {
        const mcpClients = Object.entries(this.toolServerMap).map(([mcpName, client]) => client.close())
        await Promise.all(mcpClients);
    }
}
