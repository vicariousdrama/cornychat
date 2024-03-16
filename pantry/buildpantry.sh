BUILD_DATE=$(date "+%Y%m%d.%H%M")
docker build -t diamsa/pantry:stable --build-arg BUILD_DATE=${BUILD_DATE} .