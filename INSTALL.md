# Nostr Live Audio Spaces: Jam Edition Installation

The following is intended for guidance on installing this software on a fresh vanilla install of Ubuntu 20.04 or better

## Prerequisites

The following are expected to already be established

- A server or virtual private server with Ubuntu 20.04 installed
- A domain name registered
- DNS a records for the domain pointing to the server IP address
    - An `A` record for wildcard `*` pointing to the IP address
    - An `A` record for `stun` pointing to the IP address
    - An `A` record for `turn` pointing to the IP address
- Any supplemental domains may be setup with CNAME or forwarding to the base domain
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
sudo /etc/security/limits.conf
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

**Install Docker Compose**

```sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

## Install Node, NPM, and Yarn

**These common tools are also required for Jams**

```sh
sudo apt install nodejs
node -v
sudo apt install npm
sudo npm install -g yarn
```

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

## Nostr Live Audio Spaces: Jam Edition

**Install the repo**

```sh
cd ~
git clone https://github.com/diamsa/jam.git
cd ~/jam/deployment
cp .env.example .env
hostname -I
# make note of the reported IP addresses
nano .env
```

1. Set the `JAM_HOST` value to the domain name

2. Set the `COMPOSE_PROFILES` value to `web,coturn,metrics,sfu`

3. Uncomment the `GRAFANA_ADMIN_PASSWORD` line and set a value

4. Uncomment the `JAM_SFU` line

5. Set the `JAM_SFU_EXTERNAL_IP` value to the external ip address reported from hostname -I.

Press CTRL+O, CTRL+X to save and exit

**Edit the turnserver.conf file**

```sh
nano ~/jam/deployment/turnserver.conf
```

1. Set the `realm` value to the domain name

2. Set the `external-ip` value to the external ip address reported from hostname -I

Press CTRL+O, CTRL+X to save and exit

**Edit the jam-config.json file**

```sh
nano ~/jam/resources/jam-config.json
```

1. Near the top of the file, update the domain name for the fields in the `urls` section.

Press CTRL+O, CTRL+X to save and exit

**Build the UI**

```sh
cd ~/jam/ui
yarn
```

**Create Docker Images**

```sh
cd ~/jam/ui
docker build -t diamsa/ui:stable .
cd ~/jam/pantry
docker build -t diamsa/pantry:stable .
```

**Start Docker**

```sh
cd ~/jam/deployment
docker-compose up -d
```
