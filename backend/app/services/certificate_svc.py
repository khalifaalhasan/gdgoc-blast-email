import src.config as config

def get_certificate_email_body(nama, role, certificate_link):
    """
    Generates HTML body for GDGoC UNSRI Gamejam 2026 certificate email.
    """
    return f"""
    <html>
    <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: 'Google Sans', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            
            <img src="{config.URL_HEADER}" style="width: 100%; display: block; pointer-events: none;" alt="GDGoC UNSRI Header">

            <div style="padding: 40px 30px; color: #333333; font-size: 15px; line-height: 1.6;">
                
            <p>Hi {nama} ✨</p>

            <p>Thank you for being a part of <b>GDGoC UNSRI InspireHer 2026</b>. We truly appreciate your contribution and dedication as a <b>{role}</b> during the event.</p>

            <p>In recognition of your hard work and contribution to empowering women in tech, we are pleased to present your official <b>E-Certificate</b>. You earned it! 🏆</p>

            <p>Your certificate is attached to this email as a file below.</p>

            <p>We hope this experience has helped you grow as a developer and provided valuable connections. We look forward to seeing what you build next! 🚀</p>

            <br>

            <p style="margin-bottom:0;">
                Best regards, <br>
                <b>The GDGoC UNSRI 2026 Organizing Team</b>
            </p>
                
            </div>

            <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                
                <img src="{config.URL_ICON}" style="width: 60px; margin-bottom: 10px; pointer-events: none;" alt="GDGoC Icon">
                
                <div style="color: #202124; font-size: 16px; font-weight: bold;">Google Developer Groups on Campus</div>
                <div style="color: #5f6368; font-size: 14px; margin-bottom: 20px;">Universitas Sriwijaya</div>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td align="center" style="font-size: 13px;">
                            <a href="{config.LINK_INSTAGRAM}" style="color: #4285f4; text-decoration: none; font-weight: 500;">Instagram</a> 
                            <span style="color: #bdc1c6; margin: 0 8px;">•</span> 
                            <a href="{config.LINK_WEBSITE}" style="color: #4285f4; text-decoration: none; font-weight: 500;">Website</a> 
                            <span style="color: #bdc1c6; margin: 0 8px;">•</span> 
                            <a href="{config.LINK_LINKEDIN}" style="color: #4285f4; text-decoration: none; font-weight: 500;">LinkedIn</a>
                        </td>
                    </tr>
                </table>
            </div>
            
        </div>
    </body>
    </html>
    """