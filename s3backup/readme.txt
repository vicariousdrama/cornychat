Based on https://github.com/peterrus/docker-s3-cron-backup

Modified to use the natural root user instead of creating a backup user 
since some files that will be targetted have different permissions.

Target also concatenates the S3_BUCKET_URL and FILE_NAME values as a composite key.