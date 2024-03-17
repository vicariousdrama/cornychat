BUILD_DATE=$(date "+%Y%m%d.%H%M")
ts=$(date "+%s")
BUILD_TIMESTAMP_MIDNIGHT=$((ts-(ts % 86400)))

docker build -t diamsa/ui:stable --build-arg BUILD_DATE=${BUILD_DATE} .