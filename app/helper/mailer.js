const nodemailer = require('nodemailer');
// var sgTransport = require('nodemailer-sendgrid-transport');
const Email = require('email-templates');
const path = require('path');

class Mailer {
    constructor() {
        this._transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.FROM_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            }
        })
    }

    /* @Method: sendMail
    // @Description: For sendmail
    */
    async sendMail(from, to, subject, tplName, locals) {
        try {

            const mailer = new Mailer();
            const templateDir = path.join(__dirname, "../views/", 'email-templates', tplName + '/html')

            //var Email = new EmailTemplate(templateDir)
            const email = new Email({
                message: {
                    from: from
                },
                transport: {
                    jsonTransport: true
                },
                views: {
                    root: templateDir,
                    options: {
                        extension: 'ejs'
                    }
                }
            });

            let getResponse = await email.render(templateDir, locals);

            if (getResponse) {
                let options = {
                    from: from,
                    to: to,
                    subject: subject,
                    html: getResponse
                };
                // console.log("To:", to);
                let mailresponse = await mailer._transport.sendMail(options);

                if (mailresponse) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (e) {
            console.log("email send err: ", e.message);
            return false;
        }
    };
}
module.exports = new Mailer();