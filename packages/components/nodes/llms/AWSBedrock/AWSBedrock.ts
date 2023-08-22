import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { AWSBedrock, AWSBedrockInput } from './core'

/**
 * I had to run the following to build the component
 * and get the icon copied over to the dist directory
 * Flowise/packages/components > yarn build
 * 
 * @author Michael Connor <mlconnor@yahoo.com>
 */
class AWSBedrock_LLMs implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'AWS Bedrock'
        this.name = 'awsBedrock'
        this.version = 1.1
        this.type = 'AWSBedrock'
        this.icon = 'awsBedrock.png'
        this.category = 'LLMs'
        this.description = 'Wrapper around AWS Bedrock large language models'
        this.baseClasses = [this.type, ...getBaseClasses(AWSBedrock)]
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi']
        }
        this.inputs = [
            {
                label: 'Region',
                name: 'region',
                type: 'options',
                options: [
                    {"label":"af-south-1","name":"af-south-1"},
                    {"label":"ap-east-1","name":"ap-east-1"},
                    {"label":"ap-northeast-1","name":"ap-northeast-1"},
                    {"label":"ap-northeast-2","name":"ap-northeast-2"},
                    {"label":"ap-northeast-3","name":"ap-northeast-3"},
                    {"label":"ap-south-1","name":"ap-south-1"},
                    {"label":"ap-south-2","name":"ap-south-2"},
                    {"label":"ap-southeast-1","name":"ap-southeast-1"},
                    {"label":"ap-southeast-2","name":"ap-southeast-2"},
                    {"label":"ap-southeast-3","name":"ap-southeast-3"},
                    {"label":"ap-southeast-4","name":"ap-southeast-4"},
                    {"label":"ap-southeast-5","name":"ap-southeast-5"},
                    {"label":"ap-southeast-6","name":"ap-southeast-6"},
                    {"label":"ca-central-1","name":"ca-central-1"},
                    {"label":"ca-west-1","name":"ca-west-1"},
                    {"label":"cn-north-1","name":"cn-north-1"},
                    {"label":"cn-northwest-1","name":"cn-northwest-1"},
                    {"label":"eu-central-1","name":"eu-central-1"},
                    {"label":"eu-central-2","name":"eu-central-2"},
                    {"label":"eu-north-1","name":"eu-north-1"},
                    {"label":"eu-south-1","name":"eu-south-1"},
                    {"label":"eu-south-2","name":"eu-south-2"},
                    {"label":"eu-west-1","name":"eu-west-1"},
                    {"label":"eu-west-2","name":"eu-west-2"},
                    {"label":"eu-west-3","name":"eu-west-3"},
                    {"label":"il-central-1","name":"il-central-1"},
                    {"label":"me-central-1","name":"me-central-1"},
                    {"label":"me-south-1","name":"me-south-1"},
                    {"label":"sa-east-1","name":"sa-east-1"},
                    {"label":"us-east-1","name":"us-east-1"},
                    {"label":"us-east-2","name":"us-east-2"},
                    {"label":"us-gov-east-1","name":"us-gov-east-1"},
                    {"label":"us-gov-west-1","name":"us-gov-west-1"},
                    {"label":"us-west-1","name":"us-west-1"},
                    {"label":"us-west-2","name":"us-west-2"}
                ],
                default: 'us-east-1',
                optional: false
            },
            {
                label: 'Model Name',
                name: 'model',
                type: 'options',
                options: [
                    {"label":"amazon.titan-tg1-large","name":"amazon.titan-tg1-large"},
                    {"label":"amazon.titan-e1t-medium","name":"amazon.titan-e1t-medium"},
                    {"label":"stability.stable-diffusion-xl","name":"stability.stable-diffusion-xl"},
                    {"label":"ai21.j2-grande-instruct","name":"ai21.j2-grande-instruct"},
                    {"label":"ai21.j2-jumbo-instruct","name":"ai21.j2-jumbo-instruct"},
                    {"label":"ai21.j2-mid","name":"ai21.j2-mid"},
                    {"label":"ai21.j2-ultra","name":"ai21.j2-ultra"},
                    {"label":"anthropic.claude-instant-v1","name":"anthropic.claude-instant-v1"},
                    {"label":"anthropic.claude-v1","name":"anthropic.claude-v1"},
                    {"label":"anthropic.claude-v2","name":"anthropic.claude-v2"}
                ],
                default: 'anthropic.claude-v2',
                optional: false
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                description: 'Temperature parameter may not apply to certain model. Please check available model parameters',
                optional: true,
                default: 0.7,
                additionalParams: false
            },
            {
                label: 'Max Tokens to Sample',
                name: 'max_tokens_to_sample',
                type: 'number',
                step: 10,
                description: 'Max Tokens parameter may not apply to certain model. Please check available model parameters',
                optional: false,
                default: 200,
                additionalParams: false
            },
            {
                label: 'Top Probability',
                name: 'top_p',
                type: 'number',
                step: 0.1,
                description: 'Top Probability parameter may not apply to certain model. Please check available model parameters',
                optional: false,
                additionalParams: true,
                default: 0.5
            },
            {
                label: 'Top K',
                name: 'top_k',
                type: 'number',
                step: 10,
                description: 'Top K parameter may not apply to certain model. Please check available model parameters',
                optional: false,
                default: 25
                /*additionalParams: true*/
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const iRegion = nodeData.inputs?.region as string 
        const iModel = nodeData.inputs?.model as string
        const iTemperature = nodeData.inputs?.temperature as string
        const iMax_tokens_to_sample = nodeData.inputs?.max_tokens_to_sample as string
        const iTop_p = nodeData.inputs?.top_p as string
        const iTop_k = nodeData.inputs?.top_k as string
        const iStop_sequences = [] as Array<string>

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const credentialApiKey = getCredentialParam('awsKey', credentialData, nodeData)
        const credentialApiSecret = getCredentialParam('awsSecret', credentialData, nodeData)


        const obj: AWSBedrockInput = {
          aws_key :             credentialApiKey,
          aws_secret :          credentialApiSecret,
          region:               iRegion,
          model :               iModel,
          max_tokens_to_sample: parseInt(iMax_tokens_to_sample,10),
          temperature :         parseFloat(iTemperature),
          top_k :               parseInt(iTop_k, 10),
          top_p :               parseFloat(iTop_p),
          stop_sequences :      iStop_sequences
        }

        console.log("AWS OBJ", JSON.stringify(obj))

        const amazonBedrock = new AWSBedrock(obj)
        return amazonBedrock
    }
}

module.exports = { nodeClass: AWSBedrock_LLMs }
