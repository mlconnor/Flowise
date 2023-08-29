import { LLM, BaseLLMParams } from 'langchain/llms/base'
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { HttpRequest } from '@aws-sdk/protocol-http';

/**
 * @author Michael Connor <mlconnor@yahoo.com>
 */
export interface AWSBedrockInput extends BaseLLMParams {
    aws_key: string
    aws_secret: string
    region: string
    max_tokens_to_sample: number
    temperature: number
    model: string
    top_k: number
    top_p: number
    stop_sequences: Array<string>
}

export class AWSBedrock extends LLM implements AWSBedrockInput {
    aws_key = ''
    aws_secret = ''
    region = 'us-east-1'
    model = 'anthropic.claude-v2'
    max_tokens_to_sample = 200
    temperature = 0.7
    top_k = 250
    top_p = 0.5
    stop_sequences = []

    constructor(fields: AWSBedrockInput) {
        super(fields ?? {})

        this.aws_key = fields.aws_key
        this.aws_secret = fields.aws_secret
        //this.aws_secret = fields.aws_secret
        this.region = fields.region
        this.model = fields.model
        this.max_tokens_to_sample = fields.max_tokens_to_sample
        this.temperature = fields.temperature
        this.top_k = fields.top_k
        this.top_p = fields.top_p
        //this.stop_sequences = fields.stop_sequences
    }

    _llmType() {
        return 'awsbedrock'
    }

    /** @ignore */
    async _call(prompt: string, options: this['ParsedCallOptions']): Promise<string> {

      let url = 'https://bedrock.' + this.region + '.amazonaws.com/model/' + this.model + '/invoke'
      const apiUrl = new URL(url);
      console.log("calling bedrock > " + apiUrl + " : promp > " + prompt, "OPTIONS",options)

      const signer = new SignatureV4({
        service: 'bedrock',
        region: this.region,
        credentials: {
          accessKeyId: this.aws_key,
          secretAccessKey: this.aws_secret
        },
        sha256: Sha256
      });

      if ( prompt.trim().charAt(0) == '[' || prompt.trim().charAt(0) == '{' ) {
        const obj : any = JSON.parse(prompt)
        const messages : Array<string> = []
        if ( Array.isArray(obj) ) {
          const objArr : Array<any> = obj as Array<any>
          for ( let i = 0; i < objArr.length; i++ ) {
            const msg = objArr[i]
            if ( msg.kwargs && msg.kwargs.content ) {
              messages.push(msg.kwargs.content)
            }
          }
        }
        prompt = "Human: " + messages.join("\n\n") + "\n\nAssistant:"
        console.log("fixed message prompt> " + prompt)
      }

      let requestBody = {
        "prompt":prompt,
        "max_tokens_to_sample": this.max_tokens_to_sample,
        "temperature": this.temperature,
        "top_k": this.top_k,
        "top_p": this.top_p,
        "stop_sequences": []
      }

      //console.log("AWSBedrock Request Body", JSON.stringify(requestBody,null,' '))
      const request = new HttpRequest({
        hostname: apiUrl.hostname,
        path: apiUrl.pathname,
        body: JSON.stringify(requestBody),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: apiUrl.hostname,
        }
      });

      const { headers, body, method } = await signer.sign(request);
      const result = await fetch(url, {
        headers : headers,
        body: JSON.stringify(requestBody),
        method: 'POST'
      }).then((res) => res.json());

      console.log("RESULT",result)
      let completion = "No result"
      if ( result.completion ) {
        completion = result.completion
      } else if ( result.message ) {
        completion = "ERROR: " + result.message
      }
      console.log("result", completion)
      return completion
    }
}

