# Corny Chat Installation

The following is intended for guidance on installing this software on a fresh vanilla install of Ubuntu 20.04 or better

## Prerequisites

The following are expected to already be established

- A server or virtual private server with Ubuntu 20.04 installed
- A domain name registered for the chat server
- DNS a records for the chat server domain pointing to the server IP address
    - An `A` record for wildcard `*` pointing to the IP address
    - An `A` record for `stun` pointing to the IP address
    - An `A` record for `turn` pointing to the IP address
- Any supplemental domains may be setup with CNAME or forwarding to the base domain
- An optional domain name registered if using lnbits.  This can have the `A` record pointing to the same server as the chat server.
- You should have the root account credentials to the box, or an account with sudo permissions

## Login to the box

If you have the root account credentials, but not a user account, SSH in as the root user

```sh
ssh root@<ip address>
```

Provide the password for the account when prompted.

**Add a new user**

Add a new user

```sh
adduser <theusername>
```

Provide password, press enter through prompts. 

**Add a group for ssh users**


```sh
addgroup sshusers
```

**Add users to sshusers group and sudo group**

```sh
usermod -a -G sshusers root
usermod -a -G sshusers <theusername>
usermod -a -G sudo <theusername>
```

**Add SSH public key for user just added**

```sh
mkdir -p /home/<theusername>/.ssh
nano /home/<theusername>/.ssh/authorized_keys
```

Paste in the contents of that users `~/.ssh/id_rsa.pub` from the connecting system

Save and exit

**Modify SSH config to allow groups**

```sh
nano /etc/ssh/sshd_config
```

Add the following line at the end, save and exit

```
AllowGroups sshusers

```

**Restart SSH**

```sh
systemctl restart sshd
```

**Exit and Relogin as the user created**

```sh
> ssh <theusername>@ip
```

If successful, it will pick up the SSH public key

## Install some common tools

**Python3, Git, JPEG Development Library, ImageMagic and Inkscape, JQ and Netcat**


```sh
sudo apt-get update

sudo apt-get install -y python3 python3-venv git libjpeg-dev zlib1g-dev imagemagick inkscape jq netcat
```

**Fail2Ban**

```sh
sudo apt-get install -y fail2ban
```

**Configure File Limits**

```sh
sudo nano /etc/systemd/user.conf
```

Find `DefaultLimitNOFILE`, uncomment and set value

```
DefaultLimitNOFILE=65535
```

Save and exit

**Notify changes**

```sh
sudo sh -c 'sysctl fs.inotify.max_user_watches=524288 && sysctl -p'
```

**Set limits**

```sh
sudo nano /etc/security/limits.conf
```

At bottom add the following

```
user soft nproc 10000
user hard nproc 10000
user soft nofile 10000
user hard nofile 10000
```

Save and exit

## Setup Docker 

```sh
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
apt-cache policy docker-ce
sudo apt install docker-ce
sudo systemctl status docker
```

**And then add user support**

```sh
sudo usermod -a -G docker <theusername>
```

**Exit and Relogin as the user created**

```sh
> ssh <theusername>@ip
```

If successful, the user will now have privileges to run docker commands.

**Install Docker Compose**

```sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

## Install Node, NPM, and Yarn


**Install newer version of node**

```sh
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install nodejs -y
```

**These common tools are also required for Jams**

```sh
node -v
sudo apt install npm
sudo npm install -g yarn
```

## Corny Chat

**Install the repo and configure environment**

```sh
cd ~
git clone https://github.com/vicariousdrama/cornychat.git
cd ~/cornychat/deployment
cp -n .env.example .env
hostname -I
# make note of the reported IP addresses
nano .env
```

1. Set the `JAM_HOST` value to the domain name

2. Set the `COMPOSE_PROFILES` value to `web,coturn,metrics,sfu`

3. Uncomment the `GRAFANA_ADMIN_PASSWORD` line and set a value

4. Uncomment the `JAM_SFU` line

5. Set the `JAM_SFU_EXTERNAL_IP` value to the external ip address reported from hostname -I.

6. If you want an announcement bot to announce live public rooms to nostr, uncomment and fill in an nsec for the `SERVER_NSEC` properties.  Don't use your personal NSEC. It's better to create a completely new one if you want to leverage this feature.

7. If you want to use LNbits, set the `LNBITS_HOST` value to the domain name you intend to use for lnbits. This will currently need to be different from the chat server domain due to the way some internal paths are handled.  You'll also need to add `,lnbits` to the end of the `COMPOSE_PROFILES` value. Be sure to follow the section _Configuring LNbits_ below

Press CTRL+O, CTRL+X to save and exit

**Edit the turnserver.conf file**

```sh
nano ~/cornychat/deployment/turnserver.conf
```

1. Set the `realm` value to the domain name

2. Set the `external-ip` value to the external ip address reported from hostname -I

Press CTRL+O, CTRL+X to save and exit

**Configuring LNbits**

If you are not enabling LNbits, then you can skip this section.

The docker compose configuration only adds lnbits to the stack. Most configuration for funding sources is still left up to you. Full documentation is outside the scope of this guide. For details, see: https://docs.lnbits.org/guide/wallets.html

The base configuration expects a `deployment/lnbits/.env` file to be configured. You can start with the example file and make any customizations you want for your instance. 

```sh
cp -n ~/cornychat/deployment/lnbits/.env.example ~/cornychat/deployment/lnbits/.env
```

It is assumed that you want the lnurlp extension installed.  In addition, testing has only been performed with the LND wallets.  Under this scenario, a tls certificate file is needed, along with an appropriate macaroon for the permissions required.

If using LND, you can get the tls certificate from your LND install, typically within the .lnd folder.  Copy that file contents from the LND server to the clipboard.  It should look like  -----BEGIN CERTIFICATE----- and end with -----END CERTIFICATE-----.  Then open an editor to paste into

```sh
nano ~/cornychat/deployment/lnbits/tls.crt
```

Paste the contents of the server certificate.

Press CTRL+O, CTRL+X to save and exit the editor for the certificate file

For the macaroon, there are two options.  

If you only want to accept payments from others through LNbits, then you can bake a macaroon as follows

```sh
lncli bakemacaroon uri:/lnrpc.Lightning/ChannelBalance uri:/lnrpc.Lightning/AddInvoice uri:/lnrpc.Lightning/LookupInvoice uri:/lnrpc.Lightning/SubscribeInvoices --save_to lnbits-invoiceonly.macaroon
```

If you also want to allow outbound payments, then bake the macaroon with these permissions

```sh
lncli bakemacaroon uri:/lnrpc.Lightning/ChannelBalance uri:/lnrpc.Lightning/AddInvoice uri:/lnrpc.Lightning/LookupInvoice uri:/lnrpc.Lightning/SubscribeInvoices uri:/routerrpc.Router/SendPaymentV2 uri:/routerrpc.Router/TrackPaymentV2 --save_to lnbits-full.macaroon
```

For transferring this binary file from the LND server to your server where Corny Chat and LNBits is installed, first convert to hexadecimal, referencing the filename you saved to above

```sh
xxd -ps -u -c 1000 lnbits-invoiceonly.macaroon
```

This will produce a long string of hexadecimal characters that you can copy and paste into the terminal where you are configuring lnbits.

```sh
echo "long-string-of-hexadecimal-characters" | xxd -p -r - > ~/cornychat/deployment/lnbits/lnbits-invoiceonly.macaroon
```

After docker compose is started for the first time below, you'll need to login to the LNbits instance, setting up the super user, and finishing configuration.

**Build the UI**

```sh
cd ~/cornychat/ui
yarn
```

**Create Docker Images**

```sh
cd ~/cornychat/ui
sudo chmod +x buildit.sh
./buildit.sh
cd ~/cornychat/pantry
sudo chmod +x buildit.sh
./buildit.sh
cd ~/cornychat/pantry-sfu
sudo chmod +x buildit.sh
./buildit.sh
```

If the pantry-sfu image fails, then perform the following to pull the prebuilt image and retag it

```sh
docker pull registry.gitlab.com/jam-systems/jam/pantry-sfu:master
docker tag registry.gitlab.com/jam-systems/jam/pantry-sfu:master cornychat/pantry-sfu:stable
```

**Start Docker**

```sh
cd ~/cornychat/deployment
docker-compose up -d
```

**For development**

A local instance can be run by using the dev-docker-compose.yml file which disables the letsencrypt portion and assumes localhost access.  You'll still need to configure the `.env` file to set the following

```ini
JAM_HOST=localhost
CHANNEL=stable
COMPOSE_PROFILES=web
GRAFANA_ADMIN_PASSWORD=foobar
```

Run docker-compose using the dev-docker-compose.yml file

```sh
cd ~/cornychat/deployment
docker-compose -f dev-docker-compose.yml up -d
```

**Finishing LNbits Configuration to setup Server Lightning Address**

You will need to perform the following steps after startup

1. Visit https://your-lnbits-domain

2. Login creating super user account as necessary

3. Click Server on the left side, and then choose your funding source on the Funding tab.  Make any additional configuration as necessary. Save using the button at the top and Restart the Server.

4. Still in the Server section, click the Users tab. If you don't want random people to create accounts, you can toggle off the Allow creation of users setting. Save and restart the server if you made changes.

5. Click Pay links on the left side (if not yet enabled you can do so in Extensions). Create a new pay link for a username that you want to associate to receive lightning payments to the wallet. Uncheck fixed amount and set a range (1 to 1000000 should be sufficient). Click Advanced Options and set the maximum number of comment characters (255 is a good value). At the bottom, click Enable nostr zaps if you want to support publishing zap receipts.  Finally click the Create Pay Link button.

6. Test your new lightning address. In another browser tab, access the url corresponding to the lightning address username. For example, if your domain is "example.com" and the username you created was "sample", then the url you want to visit is<br />https://example.com/.well-known/lnurlp/sample<br />If successful it should return a json including information about the callback url to use and parameters for the minimum and maximum amount and support for comments.  If this does not work, review your configuration. If it is fine, take the callback url and open it in another tab with a test amount by adding the querystring<br />`?amount=1000&comment=test` .<br />For example, if the callback value is<br />https://example.com/lnurlp/api/v1/lnurl/tb/8uXzj4, then you would call this address<br />https://example.com/lnurlp/api/v1/lnurl/tb/8uXzj4?amount=1000&comment=test<br />If the server is able to access the funding source it should return a json response that includes a field for `pr` indicating the payment request. Try paying that invoice using another wallet, converting to a QR code to scan if necessary.

7. Once satisfied that all is working as desired, you can use this lightning address for the `SERVER_PROFILE_LUD16` value in the ~/cornychat/deployment/.env file 