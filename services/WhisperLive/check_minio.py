#!/usr/bin/env python3
"""
Simple script to check if audio files are being uploaded to MinIO.
Usage: python check_minio.py [session_uid]
"""

import os
import sys
from minio import Minio
from minio.error import S3Error
from datetime import datetime

def check_minio():
    # Get MinIO configuration from environment
    minio_host = os.getenv("MINIO_HOST")
    minio_access_key = os.getenv("MINIO_ACCESS_KEY")
    minio_secret_key = os.getenv("MINIO_SECRET_KEY")
    minio_bucket = os.getenv("MINIO_BUCKET_NAME", "records")
    minio_secure = os.getenv("MINIO_SECURE", "True").lower() == "true"
    
    if not all([minio_host, minio_access_key, minio_secret_key]):
        print("❌ MinIO configuration incomplete!")
        print(f"   MINIO_HOST: {bool(minio_host)}")
        print(f"   MINIO_ACCESS_KEY: {bool(minio_access_key)}")
        print(f"   MINIO_SECRET_KEY: {bool(minio_secret_key)}")
        return
    
    print(f"🔍 Connecting to MinIO: {minio_host}")
    print(f"   Bucket: {minio_bucket}")
    print(f"   Secure: {minio_secure}\n")
    
    try:
        # Initialize MinIO client
        minio_client = Minio(
            minio_host,
            access_key=minio_access_key,
            secret_key=minio_secret_key,
            secure=minio_secure
        )
        
        # Check if bucket exists
        if not minio_client.bucket_exists(minio_bucket):
            print(f"❌ Bucket '{minio_bucket}' does not exist!")
            return
        
        print(f"✅ Bucket '{minio_bucket}' exists\n")
        
        # List objects
        session_uid = sys.argv[1] if len(sys.argv) > 1 else None
        
        if session_uid:
            # Check specific session
            print(f"🔍 Looking for session: {session_uid}\n")
            objects = minio_client.list_objects(minio_bucket, recursive=True)
            found = False
            for obj in objects:
                if session_uid in obj.object_name:
                    found = True
                    stat = minio_client.stat_object(minio_bucket, obj.object_name)
                    size_mb = stat.size / (1024 * 1024)
                    print(f"✅ Found: {obj.object_name}")
                    print(f"   Size: {stat.size} bytes ({size_mb:.2f} MB)")
                    print(f"   Last Modified: {stat.last_modified}")
                    print(f"   Content-Type: {stat.content_type}")
                    print()
            
            if not found:
                print(f"❌ No files found for session {session_uid}")
        else:
            # List all audio files
            print("📋 Listing all audio files in bucket:\n")
            objects = minio_client.list_objects(minio_bucket, recursive=True)
            files = list(objects)
            
            if not files:
                print("   No files found in bucket")
            else:
                print(f"   Found {len(files)} file(s):\n")
                for obj in files:
                    if obj.object_name.endswith('.wav'):
                        try:
                            stat = minio_client.stat_object(minio_bucket, obj.object_name)
                            size_mb = stat.size / (1024 * 1024)
                            print(f"   📄 {obj.object_name}")
                            print(f"      Size: {size_mb:.2f} MB")
                            print(f"      Modified: {stat.last_modified}")
                            print()
                        except Exception as e:
                            print(f"   ⚠️  {obj.object_name} (error getting stats: {e})")
    
    except S3Error as e:
        print(f"❌ MinIO S3 error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_minio()

