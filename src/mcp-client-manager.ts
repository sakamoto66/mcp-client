import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { AiAgentConfig, ToolSchema } from './types.js';

export class MCPClientManager {
    public allTools: ToolSchema[] = [];
    private toolServerMap: Map<string, MCPClient> = new Map();

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
        const parts = tool_name.split("--");
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
