import resend from "../configs/resend-config";
import { Env } from "../configs/env-config";

type Params = {
    to:string;
    subject:string;
    text:string;
    html:string;
}
const getFromEmail = () =>
  Env.NODE_ENV === 'development' ? 'onboarding@resend.dev' : Env.EMAIL_SENDER;

const getToEmail = (to: string) => (Env.NODE_ENV === 'development' ? 'delivered@resend.dev' : to);


export const sendMail = async( {to, subject, text, html}:Params): Promise<any> => {
    return resend.emails.send({
        from: getFromEmail() as string,
        to : getToEmail(to) as string,
        subject,
        text,html
    })
}