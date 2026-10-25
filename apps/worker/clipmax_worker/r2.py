"""Cloudflare R2 object storage through the S3-compatible API."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config


class ObjectStoreError(RuntimeError):
    """R2 transport or object error."""


class ObjectStore:
    def __init__(
        self,
        *,
        endpoint: str,
        access_key_id: str,
        secret_access_key: str,
        bucket: str,
    ) -> None:
        self._bucket = bucket
        self._client: Any = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name="auto",
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                retries={"max_attempts": 3, "mode": "standard"},
            ),
        )

    def download(self, key: str, destination: Path) -> Path:
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            self._client.download_file(self._bucket, key, str(destination))
        except Exception as exc:  # boto3 raises several unrelated subclasses
            raise ObjectStoreError(f"Could not download s3://{self._bucket}/{key}: {exc}") from exc
        if not destination.exists() or destination.stat().st_size == 0:
            raise ObjectStoreError(f"Downloaded object is empty: {key}")
        return destination

    def upload(self, source: Path, key: str, *, content_type: str) -> None:
        if not source.exists() or source.stat().st_size == 0:
            raise ObjectStoreError(f"Refusing to upload an empty file: {source}")
        try:
            self._client.upload_file(
                str(source),
                self._bucket,
                key,
                ExtraArgs={
                    "ContentType": content_type,
                    "CacheControl": "private, max-age=31536000",
                },
            )
        except Exception as exc:
            raise ObjectStoreError(f"Could not upload s3://{self._bucket}/{key}: {exc}") from exc

    def delete(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except Exception as exc:
            raise ObjectStoreError(f"Could not delete s3://{self._bucket}/{key}: {exc}") from exc
