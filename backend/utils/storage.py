import boto3
import os
import uuid
from botocore.exceptions import ClientError


def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=os.getenv('S3_ENDPOINT_URL'),
        aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('S3_SECRET_KEY'),
        region_name=os.getenv('S3_REGION', 'hel1'),
    )


BUCKET = os.getenv('S3_BUCKET_NAME', 'uptrakk-media')


def upload_file(file_obj, folder: str, extension: str) -> str:
    """Upload a file-like object to S3. Returns the object key."""
    client = get_s3_client()
    key = f"{folder}/{uuid.uuid4()}.{extension}"
    client.upload_fileobj(
        file_obj,
        BUCKET,
        key,
        ExtraArgs={'ContentType': f'image/{extension}'}
    )
    return key


def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a temporary signed URL for a private object."""
    if not key:
        return None
    # If it's already a full URL (legacy data), return as-is
    if key.startswith('http') or key.startswith('data:'):
        return key
    client = get_s3_client()
    try:
        return client.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET, 'Key': key},
            ExpiresIn=expires_in
        )
    except ClientError:
        return None


def delete_file(key: str):
    """Delete an object by its key."""
    if not key or key.startswith('http') or key.startswith('data:'):
        return
    try:
        get_s3_client().delete_object(Bucket=BUCKET, Key=key)
    except ClientError:
        pass
