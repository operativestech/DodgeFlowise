import { ChatOpenAI as LangchainChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { IMultiModalOption, IVisionChatModal } from '../../../src'

export interface ChatGPT4MenaFields extends ChatOpenAIFields {
    apiKey: string
}

export class ChatGPT4Mena extends LangchainChatOpenAI implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    id: string

    constructor(id: string, fields?: ChatGPT4MenaFields) {
        // Adapt the fields to match what LangchainChatOpenAI expects
        const adaptedFields: ChatOpenAIFields = {
            ...fields,
            openAIApiKey: fields?.apiKey,
            configuration: {
                ...fields?.configuration,
                baseURL: fields?.configuration?.baseURL || 'https://openai.chatgpt4mena.com/v1'
            }
        }

        super(adaptedFields)
        this.id = id
        this.configuredModel = fields?.modelName ?? ''
        this.configuredMaxToken = fields?.maxTokens
    }

    revertToOriginalModel(): void {
        this.modelName = this.configuredModel
        this.maxTokens = this.configuredMaxToken
    }

    setMultiModalOption(multiModalOption: IMultiModalOption): void {
        this.multiModalOption = multiModalOption
    }

    setVisionModel(): void {
        // If ChatGPT4Mena has specific vision models, implement the logic here
        // For now, we'll assume it follows OpenAI's pattern
        if (this.modelName.includes('gpt-4') && !this.modelName.includes('vision')) {
            this.modelName = 'gpt-4-vision-preview'
        }
    }
}
