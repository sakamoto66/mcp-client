import { ZodObject } from "zod";

export type AiAgentConfig = {
    systemPrompt: string; // システムプロンプト
    llm: {
        provider: 'openai' | 'anthropic' | 'azure' | 'google'; // LLMプロバイダ
        model: string
        api_key?: string,
        temperature?: number
        base_url? : string
        default_headers?: any
    },

    mcpServers: Record<string, {
        command: string; 
        args: string[]; 
        env?: Record<string, string> 
    }>;
};

export type ToolSchema = {
    name: string;
    description?: string;
    inputSchema: any;
}

export type LocalToolSchema = {
    name: string;
    description: string;
    params: ZodObject<any, any, any>;
    func: (params: any) => Promise<string>;
}

export function isLocalToolSchema(value: unknown): value is LocalToolSchema {
    return (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        "description" in value &&
        "params" in value &&
        "func" in value
    );
}