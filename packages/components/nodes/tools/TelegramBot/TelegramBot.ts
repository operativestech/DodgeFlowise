import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { TelegramBotTool, TelegramBotToolInputs } from './core'

export function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== undefined && value !== null
}

class TelegramBot_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Telegram Bot'
        this.name = 'telegramBot'
        this.version = 1.0
        this.type = 'TelegramBot'
        this.icon = 'telegram-icon.svg'
        this.category = 'Communication'
        this.description = 'Send messages to a Telegram chat'
        this.baseClasses = [this.type, ...getBaseClasses(TelegramBotTool)]
        // Add node inputs
        this.inputs = [
            {
                label: 'Bot Token',
                name: 'botToken',
                type: 'password',
                description: 'Your Telegram Bot API Token'
            }
        ]
    }

    /**
     * Initialize the tool with node data
     * @param nodeData Inputs required for the tool
     */
    async init(nodeData: INodeData): Promise<any> {
        if (isDefined(nodeData.inputs) && 'botToken' in nodeData.inputs) {
            return new TelegramBotTool(nodeData.inputs as TelegramBotToolInputs)
        }
    }
}

module.exports = { nodeClass: TelegramBot_Tools }
