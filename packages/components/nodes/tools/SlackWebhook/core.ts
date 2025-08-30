import { Tool } from '@langchain/core/tools'
import axios from 'axios'

export interface SlackWebhookToolInputs {
    webhookURL: string
}

export class SlackWebhookTool extends Tool {
    name = 'Slack'
    description = 'Send a message to a Slack. You may need to send this message and then use another tool'
    returnDirect = false
    webhookURL: string

    constructor(toolInput: SlackWebhookToolInputs) {
        super()
        this.webhookURL = toolInput.webhookURL
    }

    async _call(input: string): Promise<string> {
        if (!this.webhookURL) {
            throw new Error('Webhook URL is missing!')
        }

        try {
            console.log('SlackWebhook _call method invoked with input:', input)
            // Log a message indicating the start of the message-sending process.
            console.log('Attempting to send Slack message...')
            const axiosResponse = await axios.post(
                this.webhookURL,
                { text: input },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            // console.log('Slack API response:', axiosResponse)
            if (axiosResponse.status === 200) {
                console.log('Message sent successfully!')
                return `Message sent successfully to Slack!`
            } else {
                console.error('Slack API response:', axiosResponse.data)
                throw new Error(`Slack API error: ${JSON.stringify(axiosResponse.data)}`)
            }
        } catch (error) {
            console.error('Error sending Slack message:', error)
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(`Slack API error: ${JSON.stringify(error.response.data)}`)
            }
            return `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
