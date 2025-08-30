import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { WhatsappImageTool, WhatsappImageToolInputs } from './core'

export function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== undefined && value !== null
}

class WhatsappImageNode implements INode {
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
        this.label = 'WaConnect Image'
        this.name = 'waconnectImage'
        this.version = 1.0
        this.type = 'waconnectImage'
        this.icon = 'whatsapp-icon.svg'
        this.category = 'Communication'
        this.description = 'Send images to phone number via WhatsApp'
        this.baseClasses = [this.type, ...getBaseClasses(WhatsappImageTool)]
        // Add node inputs
        this.inputs = [
            {
                label: 'Api Token',
                name: 'apiToken',
                type: 'password',
                description: 'Your WhatsApp API Token'
            },
            {
                label: 'Instance ID',
                name: 'instance_id',
                type: 'string',
                description: 'Your WhatsApp instance ID'
            }
        ]
    }

    /**
     * Initialize the tool with node data
     * @param nodeData Inputs required for the tool
     */
    async init(nodeData: INodeData): Promise<any> {
        if (isDefined(nodeData.inputs) && 'apiToken' in nodeData.inputs && 'instance_id' in nodeData.inputs) {
            return new WhatsappImageTool(nodeData.inputs as WhatsappImageToolInputs)
        }
    }
}

module.exports = { nodeClass: WhatsappImageNode }
