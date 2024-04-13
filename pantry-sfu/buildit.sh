BUILD_DATE=$(date "+%Y%m%d.%H%M")
docker build -t cornychat/pantry-sfu:stable --build-arg BUILD_DATE=${BUILD_DATE} .