import os
import sys
import fal_client as fal

def upload_image_to_fal(image_path):
    """
    画像ファイルをfal.aiにアップロードしてリモートURLを取得する
    
    Args:
        image_path (str): アップロードする画像ファイルのパス
    
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
        
        # 画像ファイルの存在確認
        if not os.path.exists(image_path):
            print(f"Error: Image file not found at {image_path}")
            return None
        
        # ファイルサイズチェック (100MB制限)
        file_size = os.path.getsize(image_path)
        if file_size > 100 * 1024 * 1024:  # 100MB
            print(f"Error: File too large ({file_size} bytes). Maximum 100MB allowed.")
            return None
        
        print(f"Uploading image: {os.path.basename(image_path)} ({file_size} bytes)")
        
        # バイトデータを読み込んでアップロード
        with open(image_path, 'rb') as f:
            file_data = f.read()
        
        # ファイル拡張子から Content-Type を判定
        ext = os.path.splitext(image_path)[1].lower()
        content_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg', 
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp'
        }
        content_type = content_type_map.get(ext, 'image/jpeg')
        
        # fal.aiにアップロード
        url = fal.upload(file_data, content_type)
        
        print(f"Upload successful!")
        print(f"Remote URL: {url}")
        return url
        
    except Exception as e:
        print(f"Error during upload: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # コマンドライン引数で画像パスを指定可能
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        # デフォルトの画像パス
        image_path = '/Users/noranekob/cursor/MyPC/pic/RLB_699324775EDR_F0932566RHAZ00311M_.JPG'
    
    result_url = upload_image_to_fal(image_path)
    if result_url:
        print(f"\n✅ Success: {result_url}")
    else:
        print("\n❌ Upload failed")
        sys.exit(1)