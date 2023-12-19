# Nostr Live Audio Spaces: Jam Edition Update

Backup important files

```sh
mkdir -p ~/jamconfig/{deployment/prometheus,resources}
cp ~/jam/deployment/prometheus/prometheus.yml ~/jamconfig/deployment/prometheus/
cp ~/jam/deployment/turnserver.conf ~/jamconfig/deployment/
cp ~/jam/resources/jam-config.json ~/jamconfig/resources/
```

Stop and remove existing docker images

```sh
cd ~/jam/deployment
docker-compose stop
docker-compose rm -v
```

Revert the changed files to avoid conflicts

```sh
cd ~/jam/deployment
git checkout -- ./prometheus/prometheus.yml
git checkout -- turnserver.conf
cd ~/jam/resources
git checkout -- ./jam-config.json
```

Pull latest changes

```sh
cd ~/jam
git fetch
git pull
```

Apply configs from backup

```sh
cp ~/jamconfig/deployment/prometheus/prometheus.yml ~/jam/deployment/prometheus/
cp ~/jamconfig/deployment/turnserver.conf ~/jam/deployment/
cp ~/jamconfig/resources/jam-config.json ~/jam/resources/
```

Create Docker Images

```sh
cd ~/jam/ui
docker build -t diamsa/ui:stable .
cd ~/jam/pantry
docker build -t diamsa/pantry:stable .
```

Start Docker

```sh
cd ~/jam/deployment
docker-compose up -d
```
