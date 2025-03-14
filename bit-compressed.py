import numpy as np
from PIL import Image

def create_compressed_image(image_path, output_image_path, img_size=112):
    try:
        # Open and convert image to grayscale
        with Image.open(image_path) as img:
            img = img.convert('L')  # Convert to grayscale
            
            # Resize to expected size (112x112)
            img = img.resize((img_size, img_size))
            
            # Convert to numpy array (normalize to [0,1])
            img_array = np.array(img, dtype=np.float32) / 255.0
            
            # Apply 4-bit quantization
            img_array = np.round(img_array * 15).astype(np.uint8)  # 15 = 2^4 - 1
            
            # Scale back to 8-bit range
            img_array = (img_array * 255 // 15).astype(np.uint8)
            
            # Create RGB image
            img_rgb = np.stack([img_array] * 3, axis=-1)  # Stack for RGB channels
            
            # Convert numpy array back to PIL Image
            compressed_image = Image.fromarray(img_rgb)
            
            # Save the compressed image
            compressed_image.save(output_image_path, 'JPEG')
            
            print(f"Created compressed image at {output_image_path}")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

if __name__ == "__main__":
    image_path = "image.jpeg"
    output_image_path = "bit_compressed.jpeg"
    create_compressed_image(image_path, output_image_path)
