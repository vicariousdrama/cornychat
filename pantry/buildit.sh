BUILD_DATE=$(date "+%Y%m%d.%H%M")
docker build -t cornychat/pantry:stable --build-arg BUILD_DATE=${BUILD_DATE} .