import nodemailer, { Transporter } from 'nodemailer';
import aws from 'aws-sdk';
import handlebars from 'handlebars';
import fs from 'fs';

interface ITemplateVariables {
  [key: string]: string | number;
}

interface IParseMailTemplate {
  file: string;
  variables: ITemplateVariables;
}

interface ISendMail {
  to: string;
  from?: string;
  subject: string;
  templateData: IParseMailTemplate;
}

export default class SESMail {
  private client: Transporter;

  constructor() {
    this.client = nodemailer.createTransport({
      SES: new aws.SES({
        apiVersion: '2010-12-01',
        region: 'us-east-1',
      }),
    });
  }

  public async parse({ file, variables }: IParseMailTemplate): Promise<string> {
    const templateFileContent = await fs.promises.readFile(file, {
      encoding: 'utf-8',
    });

    const parseTemplate = handlebars.compile(templateFileContent);

    return parseTemplate(variables);
  }

  public async sendMail({
    to,
    subject,
    templateData,
  }: ISendMail): Promise<void> {
    try {
      await this.client.sendMail({
        from: 'AnimalBuddy <contato@animalbuddy.com.br>',
        to,
        subject,
        html: await this.parse(templateData),
      });
    } catch (err) {
      console.log(err);
    }
  }
}
