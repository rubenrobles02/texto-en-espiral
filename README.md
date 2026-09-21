# Texto en espiral

Convierte frases en espirales con ondulaciones que sirven como plantilla de tatuaje, y las vuelve a leer desde un SVG, una foto o la cámara en directo. Todo funciona en el navegador, en un único `index.html` sin dependencias.

## Uso

- **Crear:** escribe una frase por línea y copia el SVG resultante como plantilla.
- **Leer:** pega un SVG o sube una foto.
- **Escanear:** abre la cámara, detecta la espiral y escribe el mensaje flotando encima.

La cámara solo funciona en un contexto seguro (`https://` o `localhost`). Si abres el archivo con doble clic (`file://`), el escáner no tendrá acceso a la cámara. Para probarlo en local:

```bash
npm run serve        # sirve la carpeta en http://localhost:3000
```

Para usarlo desde el móvil, lo más cómodo es GitHub Pages (ver más abajo).

## Formato de codificación

Esta es la especificación que tendría que seguir cualquier otra implementación, por ejemplo una app en Flutter.

**1. Carga útil (por línea / espiral)**
- Cabecera de 1 byte: bit 7 = modo (1 compacto, 0 UTF-8), bits 0-6 = longitud (máx. 127).
- Modo compacto: 6 bits por carácter, índice en
  `" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?'-:;()/&+=#@*\"%$<>_~[]^"`. Se quitan tildes y se pasa a mayúsculas.
- Modo UTF-8: los bytes tal cual.
- Se rellena con ceros hasta completar un byte.

**2. Corrección de errores:** Reed-Solomon sobre GF(256), polinomio `0x11d`, generador α=2, primera raíz α⁰. Número de bytes de paridad: `max(2, round(bytes_datos × nivel))`, con nivel 0.25 (baja), 0.5 (media) o 1 (alta). El lector prueba los tres niveles.

**3. Símbolos:** cada byte se divide en 4 símbolos de 2 bits (primero los bits altos). Delante va un preámbulo fijo `0 1 0 1`.

| Símbolo | Forma (t de 0 a 1 dentro del símbolo) |
|---|---|
| 00 | `+sin(πt)`: bulto hacia fuera |
| 01 | `−sin(πt)`: bulto hacia dentro |
| 10 | `+sin(2πt)`: onda fuera-dentro |
| 11 | `−sin(2πt)`: onda dentro-fuera |

**4. Geometría:** espiral logarítmica `r = e^(bθ)` recorrida por longitud de arco desde un radio inicial `r0 = max(14, 1.3·L)`. Cada símbolo ocupa `L` de longitud de arco, seguido de un hueco plano de `0.35·L`. Tras los datos hay una cola lisa de `5·L`. El desplazamiento se aplica en la normal hacia fuera con amplitud `A`. Un punto relleno de radio `2.4 × grosor` marca el inicio, en la vuelta interior. Las espirales alternan el sentido de giro.

`L`, `A`, `b` y el grosor son libres: el lector no los necesita, los deduce.

## Cómo lee

1. **Visión (fotos):** umbral adaptativo con imagen integral, componentes conexas, transformada de distancia (el punto de inicio es el píxel más grueso), adelgazamiento Zhang-Suen y recorrido BFS por el esqueleto desde el punto hasta el extremo más lejano.
2. **Señal:** curva base por regresión cuadrática local y desviación con signo respecto a ella, en función de la longitud de la base.
3. **Sincronización:** busca el periodo y la fase que mejor encajan con el preámbulo.
4. **Refinado:** rehace la base pasando por el centro de los huecos, donde la desviación real es cero, y ajusta periodo y fase de forma global en toda la espiral.
5. **Clasificación:** correlación de cada tramo con las 4 formas, con la línea base tomada de los huecos adyacentes.
6. **Validación:** Reed-Solomon, cabecera coherente, texto sin caracteres de control y cola lisa tras los datos.

El escáner en vivo usa un detector ligero a 640 px (sin adelgazamiento) para seguir las espirales, y lanza la decodificación completa en un Web Worker cuando la imagen está estable.

## Pruebas

```bash
npm install
npm test                          # decodifica las muestras de tests/muestras
node tests/probar.js foto.jpg     # (convierte a PNG antes; el script lee PNG y SVG)
```

Las pruebas extraen el decodificador directamente de `index.html`, así que no hay código duplicado.

## Publicar con GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root. Quedará en `https://<usuario>.github.io/texto-en-espiral/`, con HTTPS, así que la cámara funcionará en el móvil.

## Limitaciones conocidas

- Solo probado con espirales impresas y fotos simuladas, todavía no sobre piel.
- La decodificación tarda de 1 a 7 s según la longitud.
- Si el punto de inicio se difumina o queda tapado, no sabe por dónde empezar.
- El texto del escáner sigue la espiral en 2D; para anclarlo en 3D haría falta ARCore/ARKit.
