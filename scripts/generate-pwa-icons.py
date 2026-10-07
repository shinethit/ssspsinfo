import zlib
import struct
import math
import os

def create_png(width, height, is_maskable=False):
    # Generates a PNG with a gradient background, graduation cap, and open book emblem
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))

    raw_data = bytearray()
    scale = width / 512.0
    safe_scale = 0.82 if is_maskable else 1.0

    cx = width / 2.0
    cy = height / 2.0

    # Colors
    c_sky_top = (3, 105, 161)     # #0369a1
    c_sky_bot = (8, 47, 73)       # #082f49
    c_gold = (250, 204, 21)       # #facc15
    c_white = (255, 255, 255)
    c_blue_page = (2, 132, 199)

    for y in range(height):
        raw_data.append(0) # filter byte (None)
        t_y = y / float(height)
        # Background gradient
        bg_r = int(c_sky_top[0] + (c_sky_bot[0] - c_sky_top[0]) * t_y)
        bg_g = int(c_sky_top[1] + (c_sky_bot[1] - c_sky_top[1]) * t_y)
        bg_b = int(c_sky_top[2] + (c_sky_bot[2] - c_sky_top[2]) * t_y)
        bg_a = 255

        for x in range(width):
            nx = (x - cx) / (scale * safe_scale)
            ny = (y - cy) / (scale * safe_scale)
            dist_center = math.sqrt(nx*nx + ny*ny)

            px_r, px_g, px_b, px_a = bg_r, bg_g, bg_b, bg_a

            # Outer gold ring (radius ~210)
            if 206 <= dist_center <= 214:
                px_r, px_g, px_b = c_gold

            # Graduation cap diamond (-130 to 130 in x, -150 to -45 in y)
            # Diamond equation: |nx| / 130 + |ny + 100| / 55 <= 1
            if abs(nx) / 125.0 + abs(ny + 100.0) / 52.0 <= 1.0:
                px_r, px_g, px_b = c_gold

            # Graduation cap tassel button and cord
            if math.sqrt(nx*nx + (ny + 100)*(ny + 100)) <= 9:
                px_r, px_g, px_b = c_white
            if 0 <= nx <= 8 and -100 <= ny <= -20:
                px_r, px_g, px_b = c_gold

            # Open Book (Pages): left (-140 to -5) and right (5 to 140), y from -10 to 110
            # Left page
            if -140 <= nx <= -6 and -15 <= ny <= 115:
                # curved book bottom & top boundary
                top_bound = -15 + 12 * math.cos((nx + 70) / 70.0 * (math.pi / 2))
                bot_bound = 100 + 15 * math.cos((nx + 70) / 70.0 * (math.pi / 2))
                if top_bound <= ny <= bot_bound:
                    px_r, px_g, px_b = 255, 255, 255
                    # Text lines on left page
                    if (-120 <= nx <= -25) and (
                        abs(ny - 20) <= 2 or abs(ny - 45) <= 2 or abs(ny - 70) <= 2
                    ):
                        px_r, px_g, px_b = c_blue_page

            # Right page
            if 6 <= nx <= 140 and -15 <= ny <= 115:
                top_bound = -15 + 12 * math.cos((nx - 70) / 70.0 * (math.pi / 2))
                bot_bound = 100 + 15 * math.cos((nx - 70) / 70.0 * (math.pi / 2))
                if top_bound <= ny <= bot_bound:
                    px_r, px_g, px_b = 241, 245, 249
                    # Text lines on right page
                    if (25 <= nx <= 120) and (
                        abs(ny - 20) <= 2 or abs(ny - 45) <= 2 or abs(ny - 70) <= 2
                    ):
                        px_r, px_g, px_b = c_blue_page

            # Book Spine line
            if abs(nx) <= 3 and -10 <= ny <= 125:
                px_r, px_g, px_b = 2, 132, 199

            # Mountain ridge peak at bottom
            if abs(nx) <= 90 and 135 <= ny <= 165:
                # zigzag chevron: / \ / \
                wave = abs((abs(nx) % 45) - 22.5)
                if abs(ny - (142 + wave * 0.9)) <= 3.5:
                    px_r, px_g, px_b = c_gold

            # Rounded corners for non-maskable icons
            if not is_maskable:
                corner_radius = width * 0.20
                in_corner_x = (x < corner_radius) or (x > width - corner_radius)
                in_corner_y = (y < corner_radius) or (y > height - corner_radius)
                if in_corner_x and in_corner_y:
                    cx_c = corner_radius if x < corner_radius else width - corner_radius
                    cy_c = corner_radius if y < corner_radius else height - corner_radius
                    dist_c = math.sqrt((x - cx_c)**2 + (y - cy_c)**2)
                    if dist_c > corner_radius:
                        px_a = 0

            raw_data.extend([px_r, px_g, px_b, px_a])

    idat = chunk(b'IDAT', zlib.compress(bytes(raw_data), 6))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

os.makedirs('public', exist_ok=True)

# Generate 192x192
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(create_png(192, 192, is_maskable=False))
print('Created public/pwa-192x192.png')

# Generate 512x512
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, is_maskable=False))
print('Created public/pwa-512x512.png')

# Generate 512x512 Maskable (safe zone padding)
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, is_maskable=True))
print('Created public/pwa-maskable-512x512.png')

# Generate 180x180 for iOS Apple Touch Icon
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(create_png(180, 180, is_maskable=False))
print('Created public/apple-touch-icon.png')

# Generate 48x48 for favicon.ico
with open('public/favicon.ico', 'wb') as f:
    f.write(create_png(48, 48, is_maskable=False))
print('Created public/favicon.ico')
