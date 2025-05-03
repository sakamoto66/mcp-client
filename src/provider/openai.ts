import OpenAI from 'openai';
import { MCPClientManager } from '../mcp-client-manager.js';
import { AiAgentConfig, ToolSchema } from '../types.js';

/**
 * OpenAI LLMを使用して質問を行う
 * @param config 
 * @param mcpManager 
 * @param userQuestion 
 */
export async function promptOpenAI(config: AiAgentConfig, mcpManager: MCPClientManager, userQuestion: string) {
    // ツール取得
    const tools = mcpManager.allTools.map(convert_toolschema);

    const openai = new OpenAI({
        apiKey: config.llm.api_key,
        baseURL: config.llm.base_url,
        defaultHeaders: config.llm.default_headers,
    });
    
    //
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if(config.systemPrompt) {
        messages.push({
            role: 'assistant',
            content: config.systemPrompt,
        });
    }
    messages.push({
        role: 'user',
        content: userQuestion,
    });

    while (true) {
        // LLMに問い合わせる
        const response = await openai.chat.completions.create({
            model: config.llm.model,
            max_tokens: 100,
            temperature: config.llm.temperature || 0.0,
            messages,
            tools
        });

        // 受信したメッセージ履歴に格納
        messages.push(...response.choices.map((a) => a.message));

        // 受信したメッセージを表示
        process.stdout.write(response.choices.map((a) => a.message.content).join(""))

        // ツールの使用を確認する
        const tool_uses = response.choices[0].message.tool_calls || [];
        for (const tool_use of tool_uses) {
            console.log(`Tool Use: ${tool_use.function.name}`, tool_use.function.arguments);
            try {
                const params:any = JSON.parse(tool_use.function.arguments);
                const result = await mcpManager.callTool(tool_use.function.name, params);
                console.log(`Tool Result: ${result}`);
                const tool_result = convert_tool_result_to_message(tool_use, result);
                messages.push(tool_result);
            } catch (e) {
                console.log(`Tool Error: ${e}`);
                const tool_result = convert_tool_result_to_message(tool_use, `Error: ${e}`);
                messages.push(tool_result);
            }
        }

        if (response.choices[0].finish_reason === 'stop') {
            break;
        }
    }
    process.stdout.write("\n");
    console.log("Prompt finished.");
}

/**
 * ツールの実行結果をOpenAIの形式に変換する
 * @param tool_use 
 * @param content 
 * @param is_error 
 * @returns 
 */
function convert_tool_result_to_message(tool_use: OpenAI.Chat.Completions.ChatCompletionMessageToolCall, content: string): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    return {
        role: 'tool',
        tool_call_id: tool_use.id,
        content: content
    }
}

/**
 * ToolSchemaをOpenAIの形式に変換する
 * @param tool 
 * @returns 
 */
function convert_toolschema(tool: ToolSchema):OpenAI.Chat.Completions.ChatCompletionTool {
    convert_strict_format(tool.inputSchema);
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
            strict: true,
        },
    }
}

/**
 * OpenAIのstrictな形式に変換する
 * "additionalProperties": falseの場合
 * "required"にpropertiesの項目すべて列挙する必要がある
 * オプションにしたい場合、項目のtypeを"null"にする必要がある
 * @param obj 
 */
const convert_strict_format = (obj:any) => {
    if(!obj) return;
    if (obj.type === 'array') {
        if(obj.items) {
            convert_strict_format(obj.items);
        }
    }
    if (obj.type === 'object' && obj.properties) {
        if(!('additionalProperties' in obj)) {
            obj.additionalProperties = false;
        }
        for(const [k,v] of Object.entries(obj.properties)) {
            convert_strict_format(v);
            if(!obj.required.includes(k) && v && typeof v === 'object' && 'type' in v) {
                if(Array.isArray(v.type)) {
                    if(!v.type.includes('null')) {
                        v.type.push('null');
                        obj.required.push(k);
                    }
                } else if(v.type !== 'null') {
                    v.type = [v.type, 'null'];
                    obj.required.push(k);
                }
                if('default' in v) {
                    delete v.default;
                }
            }
        }
    }
}
