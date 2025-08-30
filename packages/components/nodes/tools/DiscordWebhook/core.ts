import axios from 'axios'
import { Tool } from '@langchain/core/tools'

export interface DiscordWebhookToolInputs {
    webhookURL: string
}

export class DiscordWebhookTool extends Tool {
    name = 'discord'
    description = 'Send a message to Discord. You may need to send this message and then use another tool'
    returnDirect = false
    webhookURL: string

    constructor(toolInput: DiscordWebhookToolInputs) {
        super()
        this.webhookURL = toolInput.webhookURL
    }

    /**
     * @param input Comes from the agent, when the agent decides to use this tool!
     * This is a string.
     *
     * INPUT HERE IS INPUT FROM THE CHAT.
     * THE RETURN VALUE OF THIS FUNCTION GOES BACK TO THE AGENT,
     * AND THE AGENT CAN SHOW IT TO THE USER IN THE CHAT OR DO SOMETHING WITH IT.
     */
    async _call(input: string): Promise<string> {
        if (!this.webhookURL) {
            throw new Error('Webhook URL not provided!')
        }

        try {
            const axiosResponse = await axios.post(
                this.webhookURL,
                {
                    content: input
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            return `Message sent successfully! Response: ${axiosResponse}`
        } catch (error) {
            return `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
