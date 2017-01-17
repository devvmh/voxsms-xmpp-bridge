### XMPP-SMS bridge for Voxbone's voxsms

[Voxbone][voxbone] provides an SMS API for their DIDs, so if you VoIP with Voxbone, you're able to text too. They don't provide an app, however.

If you have access to a cloud server, you can set up a [Prosody][prosody] XMPP server. After setting up the server, you can use any XMPP client (e.g. [Conversations][conversations] for Android) to send and receive SMS messages on the go.

### Initial setup at Voxbone

Create two new SMS link groups at https://www.voxbone.com/portal/configuration/sms-link. I call mine "outbound_group" and "me_inbound". Now create two sms links, one for inbound texts and one for outbound. Assume your did is +1-416-555-1234.

    Direction: To Voxbone
    Protocol: REST JSON
    Link Group: outbound_group
    Name: Outbound SMS Link
    Login: mylogin
    Password: My.Password.123:)
    Load Balancing Weight: 1

And the inbound (I have one inbound group for each DID, but you could set it up differently):

    Direction: From Voxbone
    Protocol: REST JSON
    Link Group: me_inbound
    Name: NodeJS Me (inbound)
    Login:
    Password:
    URL: http://xmpp.example.com:8080/receive
    Load Balancing Weight: 1

Note that the login and password are left blank, and that I'm assuming you have the domain `xmpp.example.com` and you're going to use port 8080. Voxbone limits the allowed ports to 443, 4443, 80, 8080, or 8443.
    
### Initial setup on your server

Again, I've assumed your domain will be xmpp.example.com and the port will be 8080. Install prosody and [nodejs][node] on your server. On Debian, I recommend using node source for an up to date node version, so the commands would be:

    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    sudo apt-get install nodejs prosody

Find a tutorial to configure prosody and set it up to serve on xmpp.example.com or your equivalent. You'll probably end up with a file called `/etc/prosody/conf.d/xmpp.example.com/cfg.lua. This will have `VirtualHost` blocks an `Component` blocks. Add two lines to this file:

    Component "sms.example.com"
        component_secret = "SMSBotPasswordIsVerySecret"

Note that xmpp.example.com needs to be a real domain that resolves, but sms.example.com is entirely internal to your prosody server and doesn't need to resolve.

Now add a user. Let's assume your user will be called "me".

    prosodyctl adduser me@xmpp.example.com

### Configure the server

Now clone this repository and enter the directory. Set up dependencies like so:

    npm install
    cp secrets.js.example secrets.js

Edit secrets.js to look something like this (of course all of your values will look different):

		const secrets = {
			apiLogin: 'mylogin',
			apiPassword: 'My.Password.123:)',

			xmppDomain: 'xmpp.example.com',
			xmppPort: '5280',
			xmppMappings: {
				'14165551234': 'me',
			}, 
			reverseXmppMappings: {
				'me':   '14165551234',
			},

			smsBotDomain: 'sms.example.com',
			smsBotPassword: 'SMSBotPasswordIsVerySecret'
		}

		module.exports = secrets

I have the code at /root/voxsms-xmpp-bridge. I use this systemd file at `/etc/systemd/system/voxsms-xmpp-bridge.service` to make sure the server stays up. Note that if you are on debian, your node may have a different path (e.g. `/usr/bin/nodejs):

		[Unit]
		Description=launch voxsms-xmpp-bridge node server on boot
		After=network-online.target

		[Service]
		ExecStart=/bin/bash -c '/usr/bin/node /root/voxsms-xmpp-bridge/server.js >> /var/log/voxsms-xmpp-bridge.log'
		WorkingDirectory=/root/voxsms-xmpp-bridge
		Restart=always
		RestartSec=1

		[Install]
		WantedBy=multi-user.target

This service is configured to log to /var/log/voxsms-xmpp-bridge.log - you might want to set up logrotate.d to rotate this file. To enable the service:

    systemctl daemon-reload
    systemctl enable voxsms-xmpp-bridge
    systemctl start voxsms-xmpp-bridge
    systemctl status voxsms-xmpp-bridge

### Send and receive SMS

Now log in to your XMPP client and connect to the server using the username "me" and the password you set up. Create a new contact, e.g. `14165550000@sms.example.com` to text that DID, and send a message. XMPP will pass the message to this server, which will POST to voxbone's API. Inbound messages will be sent to `http://xmpp.example.com/receive/:did:`, will be read by the server, and will be sent over XMPP to your client.

[voxbone]: http://voxbone.com 
[voxsms]: https://developers.voxbone.com/docs/sms/
[voxsms-npm]: https://github.com/voxbone/voxsms-npm
[prosody]: https://prosody.im
[conversations]: https://conversations.im
[node]: https://nodejs.org/en/
