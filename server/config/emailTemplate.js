export const EMAIL_VERIFY_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Email Verify</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', sans-serif;
      background: #E5E5E5;
    }

    table, td {
      border-collapse: collapse;
    }

    .container {
      width: 100%;
      max-width: 500px;
      margin: 70px 0px;
      background-color: #ffffff;
    }

    .main-content {
      padding: 48px 30px 40px;
      color: #000000;
    }

    .button {
      width: 100%;
      background: #22D172;
      text-decoration: none;
      display: inline-block;
      padding: 10px 0;
      color: #fff;
      font-size: 14px;
      text-align: center;
      font-weight: bold;
      border-radius: 7px;
    }

    @media only screen and (max-width: 480px) {
      .container {
        width: 80% !important;
      }

      .button {
        width: 50% !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F6FAFB">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td style="padding: 0 0 24px; font-size: 18px; line-height: 150%; font-weight: bold;">
                          Verify your email
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          You are just one step away to verify your account for this email: <span style="color: #4C83EE;">{{email}}</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px; font-size: 14px; line-height: 150%; font-weight: 700;">
                          Use below OTP to verify your account.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 24px;">
                          <p class="button" >{{otp}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          This OTP is valid for 24 hours.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>

`

export const PASSWORD_RESET_TEMPLATE = `

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <title>Password Reset</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Open Sans', sans-serif;
      background: #E5E5E5;
    }

    table, td {
      border-collapse: collapse;
    }

    .container {
      width: 100%;
      max-width: 500px;
      margin: 70px 0px;
      background-color: #ffffff;
    }

    .main-content {
      padding: 48px 30px 40px;
      color: #000000;
    }

    .button {
      width: 100%;
      background: #22D172;
      text-decoration: none;
      display: inline-block;
      padding: 10px 0;
      color: #fff;
      font-size: 14px;
      text-align: center;
      font-weight: bold;
      border-radius: 7px;
    }

    @media only screen and (max-width: 480px) {
      .container {
        width: 80% !important;
      }

      .button {
        width: 50% !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F6FAFB">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td style="padding: 0 0 24px; font-size: 18px; line-height: 150%; font-weight: bold;">
                          Forgot your password?
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          We received a password reset request for your account: <span style="color: #4C83EE;">{{email}}</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px; font-size: 14px; line-height: 150%; font-weight: 700;">
                          Use the OTP below to reset the password.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 24px;">
                          <p class="button" >{{otp}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          The password reset otp is only valid for the next 15 minutes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`

export const USER_REGISTER_TEMPLATE=`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>New Template</title><!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
<noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
<![endif]--><!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css2?family=Imprima&display=swap" rel="stylesheet"><!--<![endif]--><!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  <style type="text/css">
.rollover:hover .rollover-first {
  max-height:0px!important;
  display:none!important;
}
.rollover:hover .rollover-second {
  max-height:none!important;
  display:block!important;
}
.rollover span {
  font-size:0px;
}
u + .body img ~ div div {
  display:none;
}
#outlook a {
  padding:0;
}
span.MsoHyperlink,
span.MsoHyperlinkFollowed {
  color:inherit;
  mso-style-priority:99;
}
a.es-button {
  mso-style-priority:100!important;
  text-decoration:none!important;
}
a[x-apple-data-detectors],
#MessageViewBody a {
  color:inherit!important;
  text-decoration:none!important;
  font-size:inherit!important;
  font-family:inherit!important;
  font-weight:inherit!important;
  line-height:inherit!important;
}
.es-desk-hidden {
  display:none;
  float:left;
  overflow:hidden;
  width:0;
  max-height:0;
  line-height:0;
  mso-hide:all;
}

@media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
</style>
 </head>
 <body class="body" style="width:100%;height:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div dir="ltr" class="es-wrapper-color" lang="en" style="background-color:#FFFFFF"><!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#ffffff"></v:fill>
			</v:background>
		<![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FFFFFF">
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellpadding="0" cellspacing="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#bcb8b1" align="center" cellpadding="0" cellspacing="0" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" style="Margin:0;padding-top:20px;padding-right:40px;padding-bottom:20px;padding-left:40px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="center" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://viewstripo.email" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2D3142;font-size:14px"><img src="https://fulsueq.stripocdn.email/content/guids/CABINET_055ba03e85e991c70304fecd78a2dceaf6b3f0bc1b0eb49336463d3599679494/images/vector.png" alt="Logo" height="60" title="Logo" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none"></a></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#efefef" align="center" cellpadding="0" cellspacing="0" class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#EFEFEF;border-radius:20px 20px 0 0;width:600px" role="none">
             <tr>
              <td align="left" style="padding:0;Margin:0;padding-right:40px;padding-left:40px;padding-top:40px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="left" class="es-m-txt-c" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://viewstripo.email" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2D3142;font-size:18px"><img src="https://fulsueq.stripocdn.email/content/guids/CABINET_ee77850a5a9f3068d9355050e69c76d26d58c3ea2927fa145f0d7a894e624758/images/group_4076323.png" alt="Confirm email" width="100" title="Confirm email" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none;border-radius:100px"></a></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-right:40px;padding-left:40px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                   <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#fafafa" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;background-color:#fafafa;border-radius:10px" role="presentation">
                     <tr>
                      <td align="left" style="padding:20px;Margin:0"><h3 style="Margin:0;font-family:Imprima, Arial, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:28px;font-style:normal;font-weight:bold;line-height:33.6px;color:#2D3142">Welcome,&nbsp;{{name}}</h3><p style="Margin:0;mso-line-height-rule:exactly;font-family:Imprima, Arial, sans-serif;line-height:27px;letter-spacing:0;color:#2D3142;font-size:18px"><br></p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Imprima, Arial, sans-serif;line-height:27px;letter-spacing:0;color:#2D3142;font-size:18px">You're receiving this message because you recently signed up for a account.</p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#efefef" align="center" cellpadding="0" cellspacing="0" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#EFEFEF;width:600px">
             <tr>
              <td align="left" style="Margin:0;padding-right:40px;padding-left:40px;padding-top:30px;padding-bottom:40px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td valign="top" align="center" style="padding:0;Margin:0;width:520px">
                   <table role="none" cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="center" style="padding:0;Margin:0;display:none"></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
             <tr>
              <td align="left" style="padding:0;Margin:0;padding-right:40px;padding-left:40px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="center" valign="top" style="padding:0;Margin:0;width:520px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="left" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Imprima, Arial, sans-serif;line-height:27px;letter-spacing:0;color:#2D3142;font-size:18px">Thanks,<br><br>Company</p></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;padding-bottom:20px;padding-top:40px;font-size:0">
                       <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr>
                          <td style="padding:0;Margin:0;border-bottom:1px solid #666666;background:unset;height:0px;width:100%;margin:0px"></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#efefef" align="center" cellpadding="0" cellspacing="0" class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#EFEFEF;border-radius:0 0 20px 20px;width:600px" role="none">
             <tr>
              <td align="left" class="esdev-adapt-off" style="Margin:0;padding-top:20px;padding-right:40px;padding-bottom:20px;padding-left:40px">
               <table cellpadding="0" cellspacing="0" class="esdev-mso-table" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:520px">
                 <tr>
                  <td valign="top" class="esdev-mso-td" style="padding:0;Margin:0">
                   <table cellpadding="0" cellspacing="0" align="left" class="es-left" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                     <tr>
                      <td align="center" valign="top" style="padding:0;Margin:0;width:47px">
                       <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr>
                          <td align="center" class="es-m-txt-l" style="padding:0;Margin:0;font-size:0px"><a target="_blank" href="https://viewstripo.email" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2D3142;font-size:18px"><img src="https://fulsueq.stripocdn.email/content/guids/CABINET_ee77850a5a9f3068d9355050e69c76d26d58c3ea2927fa145f0d7a894e624758/images/group_4076325.png" alt="Demo" width="47" title="Demo" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none"></a></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table></td>
                  <td style="padding:0;Margin:0;width:20px"></td>
                  <td valign="top" class="esdev-mso-td" style="padding:0;Margin:0">
                   <table cellpadding="0" cellspacing="0" align="right" class="es-right" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                     <tr>
                      <td align="center" valign="top" style="padding:0;Margin:0;width:453px">
                       <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr>
                          <td align="left" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Imprima, Arial, sans-serif;line-height:24px;letter-spacing:0;color:#2D3142;font-size:16px">This link expire in 24 hours. If you have questions, <a target="_blank" href="https://viewstripo.email" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2D3142;font-size:16px">we're here to help</a></p></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#bcb8b1" align="center" cellpadding="0" cellspacing="0" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" style="Margin:0;padding-top:40px;padding-right:20px;padding-bottom:30px;padding-left:20px">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:20px;font-size:0px"><img src="https://fulsueq.stripocdn.email/content/guids/CABINET_055ba03e85e991c70304fecd78a2dceaf6b3f0bc1b0eb49336463d3599679494/images/vector.png" alt="Logo" title="Logo" height="60" style="display:block;font-size:12px;border:0;outline:none;text-decoration:none"></td>
                     </tr>
                     <tr>
                      <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:20px;padding-top:10px;font-size:0">
                       <table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                         <tr>
                          <td align="center" valign="top" style="padding:0;Margin:0;padding-right:5px"><img src="https://fulsueq.stripocdn.email/content/assets/img/social-icons/logo-black/x-logo-black.png" alt="X" title="X" height="24" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none"></td>
                          <td align="center" valign="top" style="padding:0;Margin:0;padding-right:5px"><img src="https://fulsueq.stripocdn.email/content/assets/img/social-icons/logo-black/facebook-logo-black.png" alt="Fb" title="Facebook" height="24" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none"></td>
                          <td align="center" valign="top" style="padding:0;Margin:0"><img src="https://fulsueq.stripocdn.email/content/assets/img/social-icons/logo-black/linkedin-logo-black.png" alt="In" title="Linkedin" height="24" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none"></td>
                         </tr>
                       </table></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Imprima, Arial, sans-serif;line-height:21px;letter-spacing:0;color:#2D3142;font-size:13px"><a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#2D3142;font-size:14px" href=""></a><a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#2D3142;font-size:14px" href="">Privacy Policy</a><a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#2D3142;font-size:13px" href=""></a> • <a target="_blank" style="mso-line-height-rule:exactly;text-decoration:none;color:#2D3142;font-size:14px" href="">Unsubscribe</a></p></td>
                     </tr>
                     <tr>
                      <td align="center" style="padding:0;Margin:0;padding-top:20px"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Imprima, Arial, sans-serif;line-height:21px;letter-spacing:0;color:#2D3142;font-size:14px"><a target="_blank" href="" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2D3142;font-size:14px"></a>Copyright © 2023&nbsp;Company<a target="_blank" href="" style="mso-line-height-rule:exactly;text-decoration:underline;color:#2D3142;font-size:14px"></a></p></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table>
       <table cellpadding="0" cellspacing="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent;background-repeat:repeat;background-position:center top">
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" align="center" cellpadding="0" cellspacing="0" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
             <tr>
              <td align="left" style="padding:20px;Margin:0">
               <table cellpadding="0" cellspacing="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                 <tr>
                  <td align="left" style="padding:0;Margin:0;width:560px">
                   <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                     <tr>
                      <td align="center" class="es-infoblock made_with" style="padding:0;Margin:0;font-size:0"><a target="_blank" href="https://viewstripo.email/?utm_source=templates&utm_medium=email&utm_campaign=cold_emails_2&utm_content=account_registration" style="mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"><img src="https://fulsueq.stripocdn.email/content/guids/CABINET_09023af45624943febfa123c229a060b/images/7911561025989373.png" alt="" width="125" style="display:block;font-size:18px;border:0;outline:none;text-decoration:none"></a></td>
                     </tr>
                   </table></td>
                 </tr>
               </table></td>
             </tr>
           </table></td>
         </tr>
       </table></td>
     </tr>
   </table>
  </div>
 </body>
</html>`

export const Class_Scheulde_Template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{topicName}} - Class Schedule</title>
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
    <style>
        /* Reset styles for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body, table, td, p, a, span {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 16px;
            margin: 0;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .header-decoration {
            width: 60px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            margin: 20px auto 0;
            border-radius: 2px;
        }
        
        /* Content Section */
        .content {
            padding: 40px 30px;
        }
        
        .welcome-text {
            font-size: 18px;
            color: #374151;
            margin-bottom: 30px;
            text-align: center;
            line-height: 1.5;
        }
        
        /* Schedule Items */
        .schedule-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 22px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            text-align: center;
        }
        
        .schedule-item {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .schedule-item:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            transform: translateY(-2px);
        }
        
        .schedule-header {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px 25px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .schedule-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .day-time {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .time-icon {
            width: 16px;
            height: 16px;
            background-color: #2563eb;
            border-radius: 50%;
            display: inline-block;
        }
        
        .duration-badge {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            display: inline-block;
        }
        
        .schedule-body {
            padding: 25px;
        }
        
        .class-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        
        .class-description {
            font-size: 15px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        
        .class-features {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .feature-tag {
            background-color: #f3f4f6;
            color: #374151;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
        }
        
        /* Statistics Section */
        .stats-section {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
        }
        
        .stats-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 25px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 20px;
            max-width: 500px;
            margin: 0 auto;
        }
        
        .stat-item {
            background-color: white;
            padding: 20px 15px;
            border-radius: 10px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease;
        }
        
        .stat-item:hover {
            transform: translateY(-3px);
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            display: block;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 13px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Call to Action */
        .cta-section {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            padding: 30px;
            text-align: center;
            border-radius: 12px;
            margin: 30px 0;
        }
        
        .cta-title {
            font-size: 20px;
            font-weight: 600;
            color: white;
            margin-bottom: 10px;
        }
        
        .cta-text {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 20px;
        }
        
        .cta-button {
            display: inline-block;
            background-color: white;
            color: #2563eb;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            background-color: #f8fafc;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Footer */
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 15px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .footer-link {
            color: #2563eb;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .header, .content, .stats-section, .cta-section, .footer {
                padding: 20px !important;
            }
            
            .header h1 {
                font-size: 24px !important;
            }
            
            .schedule-meta {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .stats-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 15px !important;
            }
            
            .schedule-header, .schedule-body {
                padding: 15px !important;
            }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .schedule-item {
                background-color: #1f2937;
                border-color: #374151;
            }
            
            .class-title {
                color: #f9fafb;
            }
            
            .class-description {
                color: #d1d5db;
            }
        }
        
        /* Email client specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .stats-grid {
                display: flex !important;
                flex-wrap: wrap !important;
            }
            
            .stat-item {
                flex: 1 1 140px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>{{topicName}}</h1>
            <p>Professional Class Schedule</p>
            <div class="header-decoration"></div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="welcome-text">
                Welcome to your comprehensive learning journey. Below you'll find your complete class schedule with all the details you need.
            </p>
            
            <!-- Schedule Section -->
            <div class="schedule-section">
                <h2 class="section-title">📅 Class Schedule</h2>
                
                {{scheduleContent}}
            </div>
            
            <!-- Statistics -->
            <div class="stats-section">
                <h3 class="stats-title">📊 Course Overview</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">{{totalClasses}}</span>
                        <span class="stat-label">Total Classes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">{{totalHours}}h</span>
                        <span class="stat-label">Study Hours</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">{{weeklyClasses}}</span>
                        <span class="stat-label">Classes/Week</span>
                    </div>
                </div>
            </div>
            
            <!-- Call to Action -->
            <div class="cta-section">
                <h3 class="cta-title">Ready to Get Started?</h3>
                <p class="cta-text">Join thousands of successful learners and advance your skills today.</p>
                <a href="#" class="cta-button">Enroll Now</a>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Questions about your schedule? We're here to help you succeed.
            </p>
            <div class="footer-links">
                <a href="#" class="footer-link">Support Center</a>
                <a href="#" class="footer-link">Course Materials</a>
                <a href="#" class="footer-link">Contact Us</a>
            </div>
        </div>
    </div>
</body>
</html>`


export const Home_Work_Template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subjectName}} - Home Assignment</title>
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
    <style>
        /* Reset styles for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body, table, td, p, a, span {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
        }
        
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(255, 255, 255, 0.03) 20px,
                rgba(255, 255, 255, 0.03) 40px
            );
            animation: slide 30s linear infinite;
        }
        
        @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header-content {
            position: relative;
            z-index: 2;
        }
        
        .assignment-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 16px;
            margin: 0;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .header-decoration {
            width: 60px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            margin: 20px auto 0;
            border-radius: 2px;
        }
        
        /* Alert Banner */
        .alert-banner {
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
            padding: 20px 30px;
            text-align: center;
            border-bottom: 3px solid #f59e0b;
        }
        
        .alert-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .alert-icon {
            font-size: 24px;
        }
        
        .alert-text {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
        }
        
        .due-date {
            background: #dc2626;
            color: white;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
        }
        
        /* Content Section */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        
        .student-name {
            font-weight: 600;
            color: #dc2626;
        }
        
        /* Assignment Details */
        .assignment-section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 22px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-icon {
            font-size: 24px;
        }
        
        /* Assignment Items */
        .assignment-item {
            background-color: #ffffff;
            border-left: 4px solid #dc2626;
            border-radius: 8px;
            margin-bottom: 25px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }
        
        .assignment-item:hover {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            transform: translateY(-2px);
        }
        
        .assignment-header {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            padding: 20px 25px;
            border-bottom: 1px solid #fecaca;
        }
        
        .assignment-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .assignment-number {
            background: #dc2626;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .difficulty-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .difficulty-easy {
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .difficulty-medium {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .difficulty-hard {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .assignment-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0;
        }
        
        .assignment-body {
            padding: 25px;
        }
        
        .assignment-description {
            font-size: 15px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .assignment-requirements {
            background-color: #f9fafb;
            border-left: 3px solid #3b82f6;
            padding: 15px 20px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .requirements-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .requirements-list {
            list-style: none;
            padding: 0;
        }
        
        .requirements-list li {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 5px;
            position: relative;
            padding-left: 20px;
        }
        
        .requirements-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        
        .submission-info {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 15px 20px;
            margin-top: 20px;
        }
        
        .submission-title {
            font-size: 14px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .submission-details {
            font-size: 14px;
            color: #1e3a8a;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .submission-detail {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        /* Important Notes Section */
        .notes-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .notes-title {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .notes-content {
            font-size: 15px;
            color: #78350f;
            line-height: 1.6;
        }
        
        .notes-list {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
        }
        
        .notes-list li {
            margin-bottom: 8px;
            position: relative;
            padding-left: 20px;
        }
        
        .notes-list li::before {
            content: '⚠️';
            position: absolute;
            left: 0;
            font-size: 14px;
        }
        
        /* Resources Section */
        .resources-section {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .resources-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .resource-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-decoration: none;
            transition: all 0.3s ease;
            display: block;
        }
        
        .resource-item:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            transform: translateY(-2px);
        }
        
        .resource-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .resource-description {
            font-size: 14px;
            color: #6b7280;
        }
        
        /* Contact Section */
        .contact-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .contact-title {
            font-size: 20px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 15px;
        }
        
        .contact-text {
            font-size: 16px;
            color: #0369a1;
            margin-bottom: 20px;
        }
        
        .contact-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .contact-button {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background-color: #3b82f6;
            color: white;
        }
        
        .btn-secondary {
            background-color: white;
            color: #3b82f6;
            border: 2px solid #3b82f6;
        }
        
        .contact-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Footer */
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-content {
            max-width: 500px;
            margin: 0 auto;
        }
        
        .footer-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .footer-link {
            color: #dc2626;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .header, .content, .footer {
                padding: 20px !important;
            }
            
            .alert-banner {
                padding: 15px 20px !important;
            }
            
            .header h1 {
                font-size: 24px !important;
            }
            
            .assignment-meta {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .resources-grid {
                grid-template-columns: 1fr !important;
            }
            
            .contact-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .assignment-header, .assignment-body {
                padding: 15px !important;
            }
            
            .section-title {
                font-size: 20px !important;
            }
        }
        
        /* Print styles */
        @media print {
            .email-container {
                box-shadow: none;
                max-width: 100%;
            }
            
            .header {
                background: #dc2626 !important;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="assignment-badge">📝 Home Assignment</div>
                <h1>{{subjectName}}</h1>
                <p>{{assignmentTitle}}</p>
                <div class="header-decoration"></div>
            </div>
        </div>
        
        <!-- Alert Banner -->
        <div class="alert-banner">
            <div class="alert-content">
                <span class="alert-icon">⏰</span>
                <span class="alert-text">Due Date:</span>
                <span class="due-date">{{dueDate}}</span>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="greeting">
                Dear <span class="student-name">{{studentName}}</span>,
            </p>
            <p class="greeting">
                Here is your home assignment for {{subjectName}}. Please read through all instructions carefully and complete all tasks before the due date.
            </p>
            
            <!-- Assignment Details -->
            <div class="assignment-section">
                <h2 class="section-title">
                    <span class="section-icon">📋</span>
                    Assignment Tasks
                </h2>
                
                {{assignmentTasks}}
            </div>
            
            <!-- Important Notes -->
            <div class="notes-section">
                <h3 class="notes-title">
                    ⚠️ Important Guidelines
                </h3>
                <div class="notes-content">
                    <ul class="notes-list">
                        <li>Submit your work before the deadline to avoid late penalties</li>
                        <li>Ensure all answers are in your own words</li>
                        <li>Show all working steps for mathematical problems</li>
                        <li>Use proper formatting and clear handwriting</li>
                        <li>Include your name and roll number on every page</li>
                    </ul>
                </div>
            </div>
            
            <!-- Resources -->
            <div class="resources-section">
                <h3 class="section-title">
                    <span class="section-icon">📚</span>
                    Helpful Resources
                </h3>
                <div class="resources-grid">
                    {{resourceLinks}}
                </div>
            </div>
            
            <!-- Contact Section -->
            <div class="contact-section">
                <h3 class="contact-title">Need Help?</h3>
                <p class="contact-text">
                    If you have any questions about this assignment, don't hesitate to reach out!
                </p>
                <div class="contact-buttons">
                    <a href="mailto:{{teacherEmail}}" class="contact-button btn-primary">Email Teacher</a>
                    <a href="#" class="contact-button btn-secondary">Join Office Hours</a>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <h4 class="footer-title">Academic Excellence</h4>
                <p class="footer-text">
                    Remember, this assignment is designed to reinforce your learning. Take your time and do your best work.
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Academic Calendar</a>
                    <a href="#" class="footer-link">Assignment Portal</a>
                    <a href="#" class="footer-link">Study Resources</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`

export const Payment_Reminder_Template=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder - {{courseName}}</title>
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
    <style>
        /* Reset styles for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body, table, td, p, a, span {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
        }
        
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(255, 255, 255, 0.03) 20px,
                rgba(255, 255, 255, 0.03) 40px
            );
            animation: slide 30s linear infinite;
        }
        
        @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header-content {
            position: relative;
            z-index: 2;
        }
        
        .payment-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 16px;
            margin: 0;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .header-decoration {
            width: 60px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            margin: 20px auto 0;
            border-radius: 2px;
        }
        
        /* Status Banner */
        .status-banner {
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
            padding: 20px 30px;
            text-align: center;
            border-bottom: 3px solid #f59e0b;
        }
        
        .status-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .status-icon {
            font-size: 24px;
        }
        
        .status-text {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
        }
        
        .amount-due {
            background: #dc2626;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 18px;
            font-weight: 700;
        }
        
        /* Content Section */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        
        .student-name {
            font-weight: 600;
            color: #059669;
        }
        
        /* Payment Details Card */
        .payment-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #bbf7d0;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.1);
        }
        
        .payment-card-title {
            font-size: 22px;
            font-weight: 700;
            color: #065f46;
            margin-bottom: 20px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .payment-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .detail-item {
            background: white;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #059669;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .detail-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .detail-value {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
        }
        
        .amount-highlight {
            color: #dc2626;
            font-size: 24px;
            font-weight: 700;
        }
        
        /* Payment Breakdown */
        .breakdown-section {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            margin: 25px 0;
        }
        
        .breakdown-header {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 20px 25px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .breakdown-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }
        
        .breakdown-body {
            padding: 0;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 25px;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.2s ease;
        }
        
        .breakdown-item:hover {
            background-color: #f9fafb;
        }
        
        .breakdown-item:last-child {
            border-bottom: none;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            font-weight: 600;
        }
        
        .item-description {
            font-size: 15px;
            color: #374151;
        }
        
        .item-amount {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        
        .total-amount {
            color: #dc2626 !important;
            font-size: 18px !important;
            font-weight: 700 !important;
        }
        
        /* Payment Methods */
        .payment-methods {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .methods-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .methods-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .method-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .method-card:hover {
            border-color: #059669;
            box-shadow: 0 4px 16px rgba(5, 150, 105, 0.15);
            transform: translateY(-2px);
        }
        
        .method-icon {
            font-size: 32px;
            margin-bottom: 10px;
            display: block;
        }
        
        .method-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .method-description {
            font-size: 14px;
            color: #6b7280;
        }
        
        /* Action Buttons */
        .action-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .action-button {
            display: inline-block;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .btn-pay-now {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }
        
        .btn-pay-now:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
        }
        
        .btn-contact {
            background-color: white;
            color: #059669;
            border: 2px solid #059669;
        }
        
        .btn-contact:hover {
            background-color: #059669;
            color: white;
            transform: translateY(-2px);
        }
        
        /* Important Notice */
        .notice-section {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border: 2px solid #f87171;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .notice-title {
            font-size: 18px;
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .notice-content {
            font-size: 15px;
            color: #7f1d1d;
            line-height: 1.6;
        }
        
        .notice-list {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
        }
        
        .notice-list li {
            margin-bottom: 8px;
            position: relative;
            padding-left: 20px;
        }
        
        .notice-list li::before {
            content: '⚠️';
            position: absolute;
            left: 0;
            font-size: 14px;
        }
        
        /* Contact Support */
        .support-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .support-title {
            font-size: 20px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 15px;
        }
        
        .support-text {
            font-size: 16px;
            color: #0369a1;
            margin-bottom: 20px;
        }
        
        .support-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .support-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .support-icon {
            font-size: 24px;
            color: #0369a1;
        }
        
        .support-label {
            font-size: 14px;
            color: #0c4a6e;
            font-weight: 500;
        }
        
        .support-value {
            font-size: 16px;
            color: #1e40af;
            font-weight: 600;
        }
        
        /* Footer */
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-content {
            max-width: 500px;
            margin: 0 auto;
        }
        
        .footer-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .footer-link {
            color: #059669;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .header, .content, .footer {
                padding: 20px !important;
            }
            
            .status-banner {
                padding: 15px 20px !important;
            }
            
            .header h1 {
                font-size: 24px !important;
            }
            
            .payment-details {
                grid-template-columns: 1fr !important;
            }
            
            .methods-grid {
                grid-template-columns: 1fr !important;
            }
            
            .action-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .support-info {
                flex-direction: column;
                gap: 15px;
            }
            
            .amount-due {
                font-size: 16px !important;
                padding: 6px 15px !important;
            }
        }
        
        /* Print styles */
        @media print {
            .email-container {
                box-shadow: none;
                max-width: 100%;
            }
            
            .header {
                background: #059669 !important;
                -webkit-print-color-adjust: exact;
            }
            
            .action-buttons {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="payment-badge">💳 Payment Reminder</div>
                <h1>{{instituteName}}</h1>
                <p>Course Fee Payment Due</p>
                <div class="header-decoration"></div>
            </div>
        </div>
        
        <!-- Status Banner -->
        <div class="status-banner">
            <div class="status-content">
                <span class="status-icon">⏰</span>
                <span class="status-text">Payment Due:</span>
                <span class="amount-due">₹{{totalAmount}}</span>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="greeting">
                Dear <span class="student-name">{{studentName}}</span>,
            </p>
            <p class="greeting">
                This is a friendly reminder that your course fee payment for <strong>{{courseName}}</strong> is due. Please review the payment details below and complete your payment at your earliest convenience.
            </p>
            
            <!-- Payment Details Card -->
            <div class="payment-card">
                <h2 class="payment-card-title">
                    💼 Payment Details
                </h2>
                <div class="payment-details">
                    <div class="detail-item">
                        <div class="detail-label">Student ID</div>
                        <div class="detail-value">{{studentId}}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Course</div>
                        <div class="detail-value">{{courseName}}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Due Date</div>
                        <div class="detail-value">{{dueDate}}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Amount Due</div>
                        <div class="detail-value amount-highlight">₹{{totalAmount}}</div>
                    </div>
                </div>
            </div>
            
            <!-- Payment Breakdown -->
            <div class="breakdown-section">
                <div class="breakdown-header">
                    <h3 class="breakdown-title">📊 Fee Breakdown</h3>
                </div>
                <div class="breakdown-body">
                    {{feeBreakdown}}
                </div>
            </div>
            
            <!-- Payment Methods -->
            <div class="payment-methods">
                <h3 class="methods-title">
                    💳 Payment Options
                </h3>
                <div class="methods-grid">
                    <div class="method-card">
                        <span class="method-icon">🏦</span>
                        <div class="method-name">Bank Transfer</div>
                        <div class="method-description">Direct bank transfer or NEFT</div>
                    </div>
                    <div class="method-card">
                        <span class="method-icon">💳</span>
                        <div class="method-name">Online Payment</div>
                        <div class="method-description">Credit/Debit card, UPI, Net Banking</div>
                    </div>
                    <div class="method-card">
                        <span class="method-icon">🏢</span>
                        <div class="method-name">In-Person</div>
                        <div class="method-description">Visit our office during business hours</div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="action-section">
                <div class="action-buttons">
                    <a href="{{paymentLink}}" class="action-button btn-pay-now">Pay Now</a>
                    <a href="mailto:{{supportEmail}}" class="action-button btn-contact">Contact Support</a>
                </div>
            </div>
            
            <!-- Important Notice -->
            <div class="notice-section">
                <h3 class="notice-title">
                    ⚠️ Important Information
                </h3>
                <div class="notice-content">
                    <ul class="notice-list">
                        <li>Late payment charges may apply after the due date</li>
                        <li>Your course access may be suspended for overdue payments</li>
                        <li>Keep your payment receipt for future reference</li>
                        <li>Contact us immediately if you face any payment issues</li>
                    </ul>
                </div>
            </div>
            
            <!-- Support Section -->
            <div class="support-section">
                <h3 class="support-title">Need Assistance?</h3>
                <p class="support-text">
                    Our support team is here to help you with any payment-related queries.
                </p>
                <div class="support-info">
                    <div class="support-item">
                        <span class="support-icon">📞</span>
                        <span class="support-label">Phone</span>
                        <span class="support-value">{{supportPhone}}</span>
                    </div>
                    <div class="support-item">
                        <span class="support-icon">📧</span>
                        <span class="support-label">Email</span>
                        <span class="support-value">{{supportEmail}}</span>
                    </div>
                    <div class="support-item">
                        <span class="support-icon">🕒</span>
                        <span class="support-label">Hours</span>
                        <span class="support-value">9 AM - 6 PM</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <h4 class="footer-title">Thank You</h4>
                <p class="footer-text">
                    We appreciate your prompt attention to this payment reminder. Your continued learning journey is important to us.
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Payment Portal</a>
                    <a href="#" class="footer-link">Payment History</a>
                    <a href="#" class="footer-link">Fee Structure</a>
                    <a href="#" class="footer-link">Support Center</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`

export const ClassAttendence_Template=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Attendance Report - {{monthYear}}</title>
    <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
    <style>
        /* Reset styles for email compatibility */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body, table, td, p, a, span {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            width: 100% !important;
            min-width: 100%;
        }
        
        .email-container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(255, 255, 255, 0.03) 20px,
                rgba(255, 255, 255, 0.03) 40px
            );
            animation: slide 30s linear infinite;
        }
        
        @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header-content {
            position: relative;
            z-index: 2;
        }
        
        .attendance-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 16px;
            margin: 0;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .header-decoration {
            width: 60px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            margin: 20px auto 0;
            border-radius: 2px;
        }
        
        /* Summary Banner */
        .summary-banner {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 25px 30px;
            border-bottom: 3px solid #0ea5e9;
        }
        
        .summary-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .summary-item {
            text-align: center;
            min-width: 120px;
        }
        
        .summary-value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 14px;
            color: #0c4a6e;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .attendance-percentage {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white !important;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 18px !important;
            font-weight: 700 !important;
        }
        
        .low-attendance {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        }
        
        .average-attendance {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        }
        
        /* Content Section */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        
        .student-name {
            font-weight: 600;
            color: #7c3aed;
        }
        
        /* Student Info Card */
        .student-info-card {
            background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
            border: 2px solid #d8b4fe;
            border-radius: 16px;
            padding: 25px;
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
        }
        
        .student-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .info-item {
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            border-left: 4px solid #7c3aed;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .info-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }
        
        /* Calendar Section */
        .calendar-section {
            margin: 35px 0;
        }
        
        .section-title {
            font-size: 22px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-icon {
            font-size: 24px;
        }
        
        /* Calendar Grid */
        .calendar-container {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .calendar-header {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 15px 20px;
            border-bottom: 1px solid #e5e7eb;
            text-align: center;
        }
        
        .calendar-month {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background-color: #e5e7eb;
        }
        
        .calendar-day-header {
            background-color: #374151;
            color: white;
            padding: 10px 5px;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .calendar-day {
            background-color: white;
            padding: 12px 8px;
            text-align: center;
            min-height: 50px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            font-size: 14px;
            font-weight: 500;
        }
        
        .calendar-day.other-month {
            background-color: #f9fafb;
            color: #9ca3af;
        }
        
        .calendar-day.present {
            background-color: #d1fae5;
            color: #065f46;
            font-weight: 600;
        }
        
        .calendar-day.absent {
            background-color: #fee2e2;
            color: #991b1b;
            font-weight: 600;
        }
        
        .calendar-day.holiday {
            background-color: #fef3c7;
            color: #92400e;
            font-weight: 600;
        }
        
        .calendar-day.partial {
            background-color: #fed7aa;
            color: #9a3412;
            font-weight: 600;
        }
        
        .day-number {
            font-size: 16px;
            margin-bottom: 2px;
        }
        
        .day-status {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Legend */
        .legend-section {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .legend-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .legend-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            flex-shrink: 0;
        }
        
        .legend-present { background-color: #d1fae5; }
        .legend-absent { background-color: #fee2e2; }
        .legend-holiday { background-color: #fef3c7; }
        .legend-partial { background-color: #fed7aa; }
        
        /* Statistics Section */
        .stats-section {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
        }
        
        .stat-icon {
            font-size: 32px;
            margin-bottom: 10px;
            display: block;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #059669;
            display: block;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Performance Indicator */
        .performance-section {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        
        .performance-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        
        .performance-meter {
            width: 100%;
            max-width: 300px;
            height: 20px;
            background-color: #f3f4f6;
            border-radius: 10px;
            margin: 20px auto;
            overflow: hidden;
            position: relative;
        }
        
        .performance-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
            position: relative;
        }
        
        .performance-excellent {
            background: linear-gradient(90deg, #10b981, #059669);
        }
        
        .performance-good {
            background: linear-gradient(90deg, #3b82f6, #2563eb);
        }
        
        .performance-average {
            background: linear-gradient(90deg, #f59e0b, #d97706);
        }
        
        .performance-poor {
            background: linear-gradient(90deg, #ef4444, #dc2626);
        }
        
        .performance-text {
            font-size: 16px;
            margin-top: 10px;
            font-weight: 500;
        }
        
        /* Remarks Section */
        .remarks-section {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .remarks-title {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .remarks-content {
            font-size: 15px;
            color: #78350f;
            line-height: 1.6;
        }
        
        /* Action Section */
        .action-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .action-text {
            font-size: 16px;
            color: #374151;
            margin-bottom: 20px;
        }
        
        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .action-button {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            color: white;
        }
        
        .btn-secondary {
            background-color: white;
            color: #7c3aed;
            border: 2px solid #7c3aed;
        }
        
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Footer */
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-content {
            max-width: 500px;
            margin: 0 auto;
        }
        
        .footer-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .footer-link {
            color: #7c3aed;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        /* Responsive Design */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .header, .content, .footer {
                padding: 20px !important;
            }
            
            .summary-banner {
                padding: 20px !important;
            }
            
            .header h1 {
                font-size: 24px !important;
            }
            
            .student-info-grid {
                grid-template-columns: 1fr !important;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .legend-grid {
                grid-template-columns: 1fr !important;
            }
            
            .calendar-day {
                min-height: 40px !important;
                padding: 8px 4px !important;
            }
            
            .day-number {
                font-size: 14px !important;
            }
            
            .day-status {
                font-size: 9px !important;
            }
            
            .calendar-day-header {
                padding: 8px 2px !important;
                font-size: 10px !important;
            }
        }
        
        /* Print styles */
        @media print {
            .email-container {
                box-shadow: none;
                max-width: 100%;
            }
            
            .header {
                background: #7c3aed !important;
                -webkit-print-color-adjust: exact;
            }
            
            .action-buttons {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="attendance-badge">📊 Monthly Report</div>
                <h1>Attendance Report</h1>
                <p>{{monthYear}}</p>
                <div class="header-decoration"></div>
            </div>
        </div>
        
        <!-- Summary Banner -->
        <div class="summary-banner">
            <div class="summary-content">
                <div class="summary-item">
                    <span class="summary-value">{{totalDays}}</span>
                    <span class="summary-label">Total Days</span>
                </div>
                <div class="summary-item">
                    <span class="summary-value">{{presentDays}}</span>
                    <span class="summary-label">Present</span>
                </div>
                <div class="summary-item">
                    <span class="summary-value">{{absentDays}}</span>
                    <span class="summary-label">Absent</span>
                </div>
                <div class="summary-item">
                    <span class="summary-value attendance-percentage">{{attendancePercentage}}%</span>
                    <span class="summary-label">Attendance</span>
                </div>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="greeting">
                Dear <span class="student-name">{{studentName}}</span>,
            </p>
            <p class="greeting">
                Here is your detailed attendance report for {{monthYear}}. Please review your attendance pattern and let us know if you have any concerns.
            </p>
            
            <!-- Student Info Card -->
            <div class="student-info-card">
                <div class="student-info-grid">
                    <div class="info-item">
                        <div class="info-label">Student ID</div>
                        <div class="info-value">{{studentId}}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Course</div>
                        <div class="info-value">{{courseName}}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Class</div>
                        <div class="info-value">{{className}}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Month</div>
                        <div class="info-value">{{monthYear}}</div>
                    </div>
                </div>
            </div>
            
            <!-- Attendance Summary -->
            <div class="calendar-section">
                <h2 class="section-title">
                    <span class="section-icon">📋</span>
                    Attendance Summary
                </h2>
                
                <div class="stats-section">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-icon">✅</span>
                            <span class="stat-number">{{presentDays}}</span>
                            <span class="stat-label">Days Present</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">❌</span>
                            <span class="stat-number">{{absentDays}}</span>
                            <span class="stat-label">Days Absent</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">📊</span>
                            <span class="stat-number">{{attendancePercentage}}%</span>
                            <span class="stat-label">Attendance Rate</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">📅</span>
                            <span class="stat-number">{{totalDays}}</span>
                            <span class="stat-label">Total Days</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Important Notice -->
            <div class="remarks-section">
                <h3 class="remarks-title">
                    📝 Important Notice
                </h3>
                <div class="remarks-content">
                    Regular attendance is essential for academic success. If you have any concerns about your attendance record, please contact your teacher or the academic office immediately.
                </div>
            </div>
            
            <!-- Action Section -->
            <div class="action-section">
                <p class="action-text">
                    For any attendance queries or to discuss improvement strategies, feel free to reach out.
                </p>
                <div class="action-buttons">
                    <a href="#" class="action-button btn-primary">View Detailed Report</a>
                    <a href="mailto:teacher@school.com" class="action-button btn-secondary">Contact Teacher</a>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <h4 class="footer-title">Academic Excellence</h4>
                <p class="footer-text">
                    Regular attendance is crucial for academic success. We encourage consistent participation in all classes.
                </p>
                <div class="footer-links">
                    <a href="#" class="footer-link">Attendance Policy</a>
                    <a href="#" class="footer-link">Academic Calendar</a>
                    <a href="#" class="footer-link">Contact Support</a>
                    <a href="#" class="footer-link">Student Portal</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`