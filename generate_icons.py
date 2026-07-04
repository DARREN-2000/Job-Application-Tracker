from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color='#2364e8')
    draw = ImageDraw.Draw(img)
    # Just a simple text icon for the PWA
    text = "JAT"
    # Estimate font size based on icon size
    fontsize = int(size / 3)

    # Use default font since we don't know what's installed
    from PIL import ImageFont
    font = ImageFont.load_default()

    # Try to center the text manually since load_default doesn't support getbbox
    text_width = draw.textlength(text, font=font)
    text_height = fontsize # Rough estimate

    # Draw scaled text if we can't load a true type font
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", fontsize)
        bbox = draw.textbbox((0,0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except:
        pass

    x = (size - text_width) / 2
    y = (size - text_height) / 2
    draw.text((x, y), text, fill='white', font=font)
    img.save(filename)

create_icon(192, 'icon-192x192.png')
create_icon(512, 'icon-512x512.png')
