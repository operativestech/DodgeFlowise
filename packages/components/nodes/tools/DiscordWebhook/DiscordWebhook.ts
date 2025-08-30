import { INode, INodeData, INodeParams } from '../../../src'
import { getBaseClasses } from '../../../src'
import { DiscordWebhookTool, DiscordWebhookToolInputs } from './core'

export function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== undefined && value !== null
}

class DiscordWebhook_Tools implements INode {
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
        this.label = 'Discord Webhook'
        this.name = 'discordWebhook'
        this.version = 1.0
        this.type = 'DiscordWebhook'
        this.icon = 'discord-icon.svg'
        this.category = 'Communication'
        this.description = 'Send messages to a Discord channel via Webhook'
        this.baseClasses = [this.type, ...getBaseClasses(DiscordWebhookTool)]

        // Add credential input
        // this.came: 'credential',
        //     tredential = {
        //     label: 'Discord Webhook Credential',
        //     nype: 'credential',
        //     credentialNames: ['discordWebhookCredential']
        // }
        // Add node inputs
        this.inputs = [
            {
                label: 'Webhook URL',
                name: 'webhookURL',
                type: 'password',
                description: 'Your discord webhook URL'
            }
            // {
            //     label: 'Message',
            //     name: 'message',
            //     type: 'string',
            //     description: 'Your discord message'
            // }
        ]
    }

    /**
     * Here, we just initialize the tool.
     * INPUTS HERE ARE NOT INPUTS FROM THE CHAT.
     * THEY ARE INPUTS THAT ARE REQUIRED WHEN THE TOOL IS MADE (from the node graph).
     * @param nodeData
     */
    async init(nodeData: INodeData): Promise<any> {
        if (isDefined(nodeData.inputs) && 'webhookURL' in nodeData.inputs) {
            return new DiscordWebhookTool(nodeData.inputs as DiscordWebhookToolInputs)
        }
    }
}

module.exports = { nodeClass: DiscordWebhook_Tools }
