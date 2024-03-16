BUILD_DATE=$(date "+%Y%m%d.%H%M")
docker build -t diamsa/ui:stable --build-arg BUILD_DATE=${BUILD_DATE} .