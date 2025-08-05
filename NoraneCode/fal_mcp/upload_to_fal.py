import os
import sys
import fal_client as fal
import mimetypes

def upload_file_to_fal(file_path):
    """
    任意のファイルをfal.aiにアップロードしてリモートURLを取得する
    
    Args:
        file_path (str): アップロードするファイルのパス
    
    Returns:
        str: アップロード成功時はリモートURL、失敗時はNone
    """
    try:
        # 環境変数からAPIキーを取得
        api_key = os.getenv('FAL_KEY')
        if not api_key:
            print("Error: FAL_KEY not found in environment variables")
            print("Please set FAL_KEY environment variable with your fal.ai API key")
            return None
        
        # ファイルの存在確認
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}")
            return None
        
        # ファイルサイズチェック (500MB制限 - 動画や大きなファイルに対応)
        file_size = os.path.getsize(file_path)
        max_size = 500 * 1024 * 1024  # 500MB
        if file_size > max_size:
            print(f"Error: File too large ({file_size} bytes). Maximum {max_size // (1024*1024)}MB allowed.")
            return None
        
        # ファイル形式を自動判定
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'  # 不明な形式は汎用バイナリとして処理
        
        file_name = os.path.basename(file_path)
        print(f"Uploading file: {file_name} ({file_size} bytes, {mime_type})")
        
        # fal.aiの汎用ファイルアップロード機能を使用
        url = fal.upload_file(file_path)
        
        print(f"Upload successful!")
        print(f"Remote URL: {url}")
        return url
        
    except Exception as e:
        print(f"Error during upload: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # コマンドライン引数でファイルパスを指定可能
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        print("Usage: python upload_to_fal.py <file_path>")
        sys.exit(1)
    
    result_url = upload_file_to_fal(file_path)
    if result_url:
        print(f"\nSuccess: {result_url}")
    else:
        print("\nUpload failed")
        sys.exit(1)