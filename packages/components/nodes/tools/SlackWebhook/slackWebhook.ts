import { getBaseClasses, INode, INodeData, INodeParams } from '../../../src'
import { SlackWebhookTool, SlackWebhookToolInputs } from './core'

export function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== undefined && value !== null
}

class SlackWebhook_Tools implements INode {
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
        this.label = 'Slack Webhook'
        this.name = 'slackWebhook'
        this.version = 1.0
        this.type = 'SlackWebhook'
        this.icon = 'slack.svg'
        this.category = 'Communication'
        this.description = 'Send messages to Slack via Webhook'
        this.baseClasses = [this.type, ...getBaseClasses(SlackWebhookTool)]
        this.inputs = [
            {
                label: 'Webhook URL',
                name: 'webhookURL',
                type: 'password',
                description: 'Your slack webhook URL'
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        console.log('Initializing the SlackWebhookTool...')
        if (isDefined(nodeData.inputs) && 'webhookURL' in nodeData.inputs) {
            return new SlackWebhookTool(nodeData.inputs as SlackWebhookToolInputs)
        }
    }
}

module.exports = { nodeClass: SlackWebhook_Tools }
