import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { WhatsappBotTool, WhatsappBotToolInputs } from './core'

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
        this.label = 'Whatsapp Bot'
        this.name = 'whatsappBot'
        this.version = 1.0
        this.type = 'whatsappBot'
        this.icon = 'whatsapp-icon.svg'
        this.category = 'Communication'
        this.description = 'Send messages to phone number via whatsapp'
        this.baseClasses = [this.type, ...getBaseClasses(WhatsappBotTool)]
        // Add node inputs
        this.inputs = [
            {
                label: 'Api Token',
                name: 'apiToken',
                type: 'password',
                description: 'Your Whatsapp API Token'
            },
            {
                label: 'Instance ID',
                name: 'instance_id',
                type: 'string',
                description: 'Your Whatsapp instance ID'
            }
        ]
    }

    /**
     * Initialize the tool with node data
     * @param nodeData Inputs required for the tool
     */
    async init(nodeData: INodeData): Promise<any> {
        if (isDefined(nodeData.inputs) && 'apiToken' in nodeData.inputs && 'instance_id' in nodeData.inputs) {
            return new WhatsappBotTool(nodeData.inputs as WhatsappBotToolInputs)
        }
    }
}

module.exports = { nodeClass: TelegramBot_Tools }
