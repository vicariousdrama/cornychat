#!/usr/bin/env sh

set -e

source /.backupenv

# default storage class to standard if not provided
S3_STORAGE_CLASS=${S3_STORAGE_CLASS:-STANDARD}

# generate file name for tar
FILE_NAME=${BACKUP_NAME}-$(date "+%Y-%m-%d_%H-%M-%S").tar.gz
SRC_FILE_NAME=/tmp/${FILE_NAME}

# Check if TARGET variable is set
if [ -z "${TARGET}" ]; then
    echo "TARGET env var is not set so we use the default value (/data)"
    TARGET=/data
else
    echo "TARGET env var is set"
fi

if [ -z "${S3_ENDPOINT}" ]; then
  AWS_ARGS=""
else
  AWS_ARGS="--endpoint-url ${S3_ENDPOINT}"
fi

echo "creating archive"
tar -zcvf "${SRC_FILE_NAME}" "${TARGET}"
echo "uploading archive to S3 [${SRC_FILE_NAME}, storage class - ${S3_STORAGE_CLASS} into ${S3_BUCKET_URL}]"
aws s3 ${AWS_ARGS} cp --storage-class "${S3_STORAGE_CLASS}" "${SRC_FILE_NAME}" "${S3_BUCKET_URL}/${FILE_NAME}"
echo "removing local archive"
rm "${SRC_FILE_NAME}"
echo "done"

if [ -n "${WEBHOOK_URL}" ]; then
    echo "notifying webhook"
    curl -m 10 --retry 5 "${WEBHOOK_URL}"
fi