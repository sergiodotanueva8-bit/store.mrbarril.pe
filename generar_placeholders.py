"""
Genera placeholders de imagen con el tamaño EXACTO recomendado para
cada imagen de la landing. Cada placeholder incluye el nombre del
archivo y las dimensiones, para que sea evidente qué imagen reemplazar
y en qué tamaño debe ir la imagen final.

Esto NO se necesita volver a correr una vez que subas tus imágenes
reales: simplemente reemplaza los archivos en assets/images con el
mismo nombre y mismo tamaño (o similar relación de aspecto).
"""

from PIL import Image, ImageDraw, ImageFont
import os

CARPETA_SALIDA = "assets/images"
os.makedirs(CARPETA_SALIDA, exist_ok=True)

# (nombre_archivo, ancho, alto, color_fondo, etiqueta_corta)
IMAGENES = [
    ("producto-hero-principal.jpg", 1200, 1500, (230, 235, 245), "HERO PRINCIPAL\n1200x1500"),
    ("miniatura-1-logo.jpg", 64, 64, (220, 220, 220), "MINI 1\n64x64"),
    ("foto-2-instalado-pared.jpg", 1200, 1500, (225, 232, 220), "FOTO 2\n1200x1500"),
    ("miniatura-2-instalado-pared.jpg", 64, 64, (220, 220, 220), "MINI 2\n64x64"),
    ("foto-3-plegado.jpg", 1200, 1500, (235, 225, 220), "FOTO 3\n1200x1500"),
    ("miniatura-3-plegado.jpg", 64, 64, (220, 220, 220), "MINI 3\n64x64"),
    ("foto-4-detalle-lineas.jpg", 1200, 1500, (220, 230, 235), "FOTO 4\n1200x1500"),
    ("miniatura-4-detalle-lineas.jpg", 64, 64, (220, 220, 220), "MINI 4\n64x64"),
    ("icono-tecnico-instalador.png", 240, 240, (235, 235, 235), "ICONO TECNICO\n240x240"),
    ("icono-tecnico-instalador-pequeno.png", 64, 64, (235, 235, 235), "ICONO TEC\n64x64"),
    ("tornillos-tarugos-incluidos.png", 180, 180, (245, 245, 240), "TORNILLOS\n180x180"),
    ("logo-courier-dinsides.png", 160, 60, (255, 255, 255), "DINSIDES\n160x60"),
    ("logo-courier-shalom.png", 160, 60, (255, 255, 255), "SHALOM\n160x60"),
    ("logo-courier-olva.png", 160, 60, (255, 255, 255), "OLVA\n160x60"),
    ("logo-courier-marvisur.png", 160, 60, (255, 255, 255), "MARVISUR\n160x60"),
    ("logo-pago-visa.png", 100, 40, (255, 255, 255), "VISA\n100x40"),
    ("logo-pago-mastercard.png", 100, 40, (255, 255, 255), "MASTERCARD\n100x40"),
    ("logo-pago-amex.png", 100, 40, (255, 255, 255), "AMEX\n100x40"),
    ("logo-pago-yape.png", 100, 40, (255, 255, 255), "YAPE\n100x40"),
    ("logo-pago-plin.png", 100, 40, (255, 255, 255), "PLIN\n100x40"),
    ("logo-pago-bcp.png", 100, 40, (255, 255, 255), "BCP\n100x40"),
    ("logo-pago-scotiabank.png", 100, 40, (255, 255, 255), "SCOTIABANK\n100x40"),
    ("logo-pago-interbank.png", 100, 40, (255, 255, 255), "INTERBANK\n100x40"),
    ("logo-pago-bbva.png", 100, 40, (255, 255, 255), "BBVA\n100x40"),
    ("cliente-testimonio-1.jpg", 300, 330, (230, 225, 220), "CLIENTE 1\n300x330"),
    ("cliente-testimonio-2.jpg", 300, 330, (225, 230, 225), "CLIENTE 2\n300x330"),
    ("cliente-testimonio-3.jpg", 300, 330, (230, 220, 225), "CLIENTE 3\n300x330"),
    ("cliente-testimonio-4.jpg", 300, 330, (220, 225, 230), "CLIENTE 4\n300x330"),
    ("cliente-testimonio-5.jpg", 300, 330, (225, 225, 220), "CLIENTE 5\n300x330"),
    ("cliente-testimonio-6.jpg", 300, 330, (230, 230, 225), "CLIENTE 6\n300x330"),
    ("envio-paquete-1.jpg", 200, 200, (240, 230, 220), "ENVIO 1\n200x200"),
    ("envio-paquete-2.jpg", 200, 200, (220, 230, 240), "ENVIO 2\n200x200"),
    ("envio-paquete-3.jpg", 200, 200, (230, 240, 220), "ENVIO 3\n200x200"),
    ("envio-paquete-4.jpg", 200, 200, (240, 220, 230), "ENVIO 4\n200x200"),
    ("envio-paquete-5.jpg", 200, 200, (220, 240, 230), "ENVIO 5\n200x200"),
    ("envio-paquete-6.jpg", 200, 200, (230, 220, 240), "ENVIO 6\n200x200"),
    ("envio-paquete-7.jpg", 200, 200, (240, 240, 220), "ENVIO 7\n200x200"),
    ("envio-paquete-8.jpg", 200, 200, (220, 220, 240), "ENVIO 8\n200x200"),
]


def texto_centrado(draw, texto, ancho, alto, color):
    lineas = texto.split("\n")
    try:
        fuente_titulo = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", max(10, ancho // 14)
        )
    except Exception:
        fuente_titulo = ImageFont.load_default()

    alto_linea = fuente_titulo.size + 4
    alto_total = alto_linea * len(lineas)
    y = (alto - alto_total) / 2

    for linea in lineas:
        bbox = draw.textbbox((0, 0), linea, font=fuente_titulo)
        ancho_texto = bbox[2] - bbox[0]
        x = (ancho - ancho_texto) / 2
        draw.text((x, y), linea, fill=color, font=fuente_titulo)
        y += alto_linea


for nombre, ancho, alto, color_fondo, etiqueta in IMAGENES:
    img = Image.new("RGB", (ancho, alto), color_fondo)
    draw = ImageDraw.Draw(img)

    # Borde punteado simulado con guiones cortos
    color_borde = (160, 160, 160)
    paso = 14
    for x in range(0, ancho, paso):
        draw.line([(x, 0), (min(x + 7, ancho), 0)], fill=color_borde, width=2)
        draw.line([(x, alto - 1), (min(x + 7, ancho), alto - 1)], fill=color_borde, width=2)
    for y in range(0, alto, paso):
        draw.line([(0, y), (0, min(y + 7, alto))], fill=color_borde, width=2)
        draw.line([(ancho - 1, y), (ancho - 1, min(y + 7, alto))], fill=color_borde, width=2)

    texto_centrado(draw, etiqueta, ancho, alto, (90, 90, 90))

    ruta = os.path.join(CARPETA_SALIDA, nombre)
    img.save(ruta, quality=85)

print(f"Generadas {len(IMAGENES)} imágenes placeholder en {CARPETA_SALIDA}/")
