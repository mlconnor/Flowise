import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { Embeddings, EmbeddingsParams } from "langchain/embeddings/base";
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';

/**
 * I had to run the following to build the component
 * and get the icon copied over to the dist directory
 * Flowise/packages/components > yarn build
 * 
 * @author Michael Connor <mlconnor@yahoo.com>
 */
class AWSBedrock_EmbeddingsNode implements INode {
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
        this.label = 'AWSBedrock Embeddings'
        this.name = 'awsBedrockEmbeddings'
        this.version = 1.0
        this.type = 'AWSBedrockEmbeddings'
        this.icon = 'awsBedrock.png'
        this.category = 'Embeddings'
        this.description = 'AWSBedrock API to generate embeddings for a given text'
        this.baseClasses = [this.type, ...getBaseClasses(AWSBedrockEmbeddingsImpl)]
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
                    {
                        label: 'amazon.titan-e1t-medium',
                        name: 'amazon.titan-e1t-medium'
                    }
                ],
                default: 'amazon.titan-e1t-medium',
                optional: false
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const credentialApiKey = getCredentialParam('awsKey', credentialData, nodeData)
        const credentialApiSecret = getCredentialParam('awsSecret', credentialData, nodeData)

        const obj: Partial<AWSBedrockEmbeddingsParams> = {
            awsKey: credentialApiKey,
            awsSecret: credentialApiSecret,
            model: nodeData.inputs?.model,
            region: nodeData.inputs?.region,
            batchSize: nodeData.inputs?.batchSize
        } as AWSBedrockEmbeddingsParams

        const model = new AWSBedrockEmbeddingsImpl(obj)
        return model
    }
}

function chunkArray <T>(arr: T[], chunkSize: number) {
  arr.reduce((chunks, elem, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    const chunk = chunks[chunkIndex] || [];
    // eslint-disable-next-line no-param-reassign
    chunks[chunkIndex] = chunk.concat([elem]);
    return chunks;
  }, [] as T[][])
}

interface AWSBedrockEmbeddingsParams extends EmbeddingsParams {
  awsKey: string,
  awsSecret: string,
  model: string,
  region: string,
  batchSize?: number
}

export class AWSBedrockEmbeddingsImpl
  extends Embeddings
  implements AWSBedrockEmbeddingsParams
{
  model = "amazon.titan-e1t-medium"
  region = 'us-east-1'
  awsKey: string /* this should be private */
  awsSecret: string /* this should be private */
  batchSize?: number

  /**
   * Constructor for the CohereEmbeddings class.
   * @param fields - An optional object with properties to configure the instance.
   */
  constructor(
    fields?: Partial<AWSBedrockEmbeddingsParams> & {
      awsKey?: string,
      awsSecret?: string,
      model?: string,
      region?: string,
      batchSize?: number
    }
  ) {

    super({});

    const awsKey = fields?.awsKey
    const awsSecret = fields?.awsSecret

    if (!awsKey) {
      throw new Error("awsKey not found");
    }
    if (!awsSecret) {
      throw new Error("awsSecret not found");
    }

    this.model = fields?.model ?? this.model
    this.awsKey = awsKey
    this.awsSecret = awsSecret
  }

  /**
   * Generates embeddings for an array of texts.
   * @param texts - An array of strings to generate embeddings for.
   * @returns A Promise that resolves to an array of embeddings.
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {

    //const subPrompts = chunkArray(texts, this.batchSize);
    const config : AWSBedrockEmbeddingsParams = {
        model: this.model,
        awsKey: this.awsKey,
        awsSecret: this.awsSecret,
        region: this.region
    }

    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i++ ) {
        const txtEmbed : number[] = await getEmbedding(texts[i], config)
        embeddings.push(txtEmbed)
    }

    return embeddings
  }

  /**
   * Generates an embedding for a single text.
   * @param text - A string to generate an embedding for.
   * @returns A Promise that resolves to an array of numbers representing the embedding.
   */
  async embedQuery(text: string): Promise<number[]> {
    const config : AWSBedrockEmbeddingsParams = {
        model: this.model,
        awsKey: this.awsKey,
        awsSecret: this.awsSecret,
        region: this.region
    }
    const txtEmbed : Promise<number[]> = getEmbedding(text, config)
    return txtEmbed;
  }

  /**
   * Generates embeddings with retry capabilities.
   * @param request - An object containing the request parameters for generating embeddings.
   * @returns A Promise that resolves to the API response.
   */
  /*
  private async embeddingWithRetry(
    request: Parameters<AWSBedrockEmbeddingsParams>[0]
  ) {
    const config : AWSBedrockEmbeddingsParams = {
        model: this.model,
        awsKey: this.awsKey,
        awsSecret: this.awsSecret,
        region: this.region,
        batchSize: this.batchSize
    }
    const txtEmbed = await getEmbedding(text, config)
    return txtEmbed;
  }
  */

  /** @ignore
  static async imports(): Promise<{
    cohere: typeof import("cohere-ai");
  }> {
    try {
      const { default: cohere } = await import("cohere-ai");
      return { cohere };
    } catch (e) {
      throw new Error(
        "Please install cohere-ai as a dependency with, e.g. `yarn add cohere-ai`"
      );
    }
  }
  */
}

async function getEmbedding(text: string, config: AWSBedrockEmbeddingsParams) : Promise<number[]> {
    let url = `https://bedrock.${config.region}.amazonaws.com/model/${config.model}/invoke`
    let apiUrl = new URL(url)

    const signer = new SignatureV4({
      service: 'bedrock',
      region: config.region,
      credentials: {
        accessKeyId: config.awsKey,
        secretAccessKey: config.awsSecret
      },
      sha256: Sha256
    });

    const bodyObj = {"inputText": text}
    const bodyJSON = JSON.stringify(bodyObj)

    const request = new HttpRequest({
      hostname: apiUrl.hostname,
      path: apiUrl.pathname,
      body: bodyJSON,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: apiUrl.hostname,
      }
    })

    const { headers, body, method } = await signer.sign(request)

    try {
        const result = await fetch(url, { headers, body, method })
        const json : any = await result.json()
        if ( ! json.embedding ) {
            throw "error retrieving embeddings " + JSON.stringify(json)
        }
        console.log("result", json)
        //const embedNumbers : Array<number> = (Array<number>) json.embedding
        const embedNumbers : number[] = json.embedding as number[]
        console.log("AWSBedrockEmbedding", embedNumbers)
        return embedNumbers
        console.log("AWSBedrock Embeddings Result", json)
    } catch (e) {
        console.log(e)
        throw e
    }
}

module.exports = { nodeClass: AWSBedrock_EmbeddingsNode }


