declare module 'nodemailer' {
  export interface TransportOptions {
    service?: string;
    auth?: {
      user: string;
      pass: string;
    };
  }
  
  export interface MailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
    }>;
  }
  
  export interface Transporter {
    sendMail(options: MailOptions): Promise<any>;
  }
  
  export function createTransport(options: TransportOptions): Transporter;
  
  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };
  
  export default nodemailer;
}

