"""
FAKENIX 2.0 — Forensic Metadata Extraction Service

Extracts safe, non-sensitive metadata from uploaded files.
Metadata is informational only and should NOT be treated as proof of authenticity.

Three things are kept apart on purpose, because they can disagree:
  - the filename extension (claimed by whoever named the file),
  - the Content-Type sent by the client (claimed by the browser),
  - the format detected from the file's own bytes (what the file actually is).
Only the detected format is reported as the file's format / MIME type. A
disagreement is recorded in `inconsistencies`, never silently smoothed over.
"""
import os
from app.utils.logger import get_logger

logger = get_logger('metadata_service')

# Format names the extension claims, comparable with sniff_media_type()['format'].
EXTENSION_FORMATS = {
    'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP', 'gif': 'GIF', 'bmp': 'BMP',
    'mp4': 'MP4', 'm4v': 'MP4', 'mov': 'QuickTime (MOV)', 'avi': 'AVI',
    'mkv': 'Matroska (MKV)', 'webm': 'WebM',
}

_QUICKTIME_ATOMS = {b'moov', b'mdat', b'wide', b'free', b'skip', b'pnot'}
_HEIF_BRANDS = {b'heic', b'heix', b'hevc', b'mif1', b'msf1', b'avif', b'avis'}


def sniff_header(header: bytes) -> dict:
    """
    Identify a media container from its leading bytes (magic numbers).

    Returns {'format', 'mime', 'kind'}; every value is None when the bytes are
    not a recognised image or video container.
    """
    def found(fmt, mime, kind):
        return {'format': fmt, 'mime': mime, 'kind': kind}

    header = header or b''
    if header[:3] == b'\xff\xd8\xff':
        return found('JPEG', 'image/jpeg', 'image')
    if header[:8] == b'\x89PNG\r\n\x1a\n':
        return found('PNG', 'image/png', 'image')
    if header[:6] in (b'GIF87a', b'GIF89a'):
        return found('GIF', 'image/gif', 'image')
    if header[:2] == b'BM' and len(header) >= 14:
        return found('BMP', 'image/bmp', 'image')
    if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        return found('WEBP', 'image/webp', 'image')
    if header[:4] == b'RIFF' and header[8:12] == b'AVI ':
        return found('AVI', 'video/x-msvideo', 'video')
    if header[:4] == b'\x1a\x45\xdf\xa3':
        if b'webm' in header[:64]:
            return found('WebM', 'video/webm', 'video')
        return found('Matroska (MKV)', 'video/x-matroska', 'video')
    if header[4:8] == b'ftyp':
        brand = header[8:12]
        if brand == b'qt  ':
            return found('QuickTime (MOV)', 'video/quicktime', 'video')
        if brand in _HEIF_BRANDS:
            return found('HEIF', 'image/heif', 'image')
        if brand[:3] == b'3gp':
            return found('3GPP', 'video/3gpp', 'video')
        return found('MP4', 'video/mp4', 'video')
    if header[4:8] in _QUICKTIME_ATOMS:
        return found('QuickTime (MOV)', 'video/quicktime', 'video')
    return found(None, None, None)


def sniff_media_type(file_path: str) -> dict:
    """sniff_header() for a file on disk."""
    try:
        with open(file_path, 'rb') as f:
            return sniff_header(f.read(64))
    except OSError as e:
        logger.warning(f'Could not read {file_path} for format detection: {e}')
        return sniff_header(b'')


def extract_image_metadata(file_path: str) -> dict:
    """
    Extract metadata from an image file.
    Uses Pillow for EXIF and basic image info. Values that cannot be read stay None.
    """
    meta = {
        'format': None,
        'width': None,
        'height': None,
        'resolution': None,
        'mode': None,
        'mimeType': None,
        'created': None,
        'softwareTag': None,
        'gpsData': None,
        'exifStripped': None,
        'codec': None,
        'bitrate': None,
        'fps': None,
        'audioCodec': None,
    }

    try:
        from PIL import Image

        with Image.open(file_path) as img:
            meta['format'] = img.format
            meta['width'] = img.width
            meta['height'] = img.height
            meta['resolution'] = f'{img.width}x{img.height}'
            meta['mode'] = img.mode
            meta['mimeType'] = Image.MIME.get(img.format) if img.format else None

            # EXIF data
            try:
                exif = img.getexif()
                if exif:
                    meta['exifStripped'] = False
                    if exif.get(0x0132):  # DateTime
                        meta['created'] = str(exif.get(0x0132))
                    if exif.get(0x0131):  # Software
                        meta['softwareTag'] = str(exif.get(0x0131))[:100]
                    if 0x8825 in exif:  # GPSInfo IFD pointer
                        gps = exif.get_ifd(0x8825)
                        # GPSLatitude = 2, GPSLongitude = 4
                        meta['gpsData'] = 'GPS data present' if 2 in gps and 4 in gps else 'GPS data present (partial)'
                else:
                    meta['exifStripped'] = True
            except Exception as e:
                logger.warning(f'EXIF read error for {file_path}: {e}')

    except Exception as e:
        logger.warning(f'Image metadata extraction error for {file_path}: {e}')

    return meta


def extract_video_metadata(file_path: str) -> dict:
    """
    Extract metadata from a video file using OpenCV.
    Values OpenCV cannot determine stay None rather than being guessed.
    """
    meta = {
        'format': None,
        'codec': None,
        'width': None,
        'height': None,
        'resolution': None,
        'fps': None,
        'duration': None,
        'durationSeconds': None,
        'bitrate': None,
        'audioCodec': None,
        'mimeType': None,
        'created': None,
        'softwareTag': None,
        'gpsData': None,
        'exifStripped': None,
    }

    try:
        import cv2

        cap = cv2.VideoCapture(file_path)
        try:
            if cap.isOpened():
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

                if width > 0 and height > 0:
                    meta['width'] = width
                    meta['height'] = height
                    meta['resolution'] = f'{width}x{height}'
                if fps and fps > 0:
                    meta['fps'] = f'{fps:.2f}'
                    if frame_count > 0:
                        duration_seconds = frame_count / fps
                        meta['durationSeconds'] = round(duration_seconds, 2)
                        # Format duration as M:SS
                        meta['duration'] = f'{int(duration_seconds // 60)}:{int(duration_seconds % 60):02d}'
                meta['codec'] = _fourcc_to_str(int(cap.get(cv2.CAP_PROP_FOURCC)))
            else:
                logger.warning(f'OpenCV could not open video: {file_path}')
        finally:
            cap.release()

    except ImportError:
        logger.warning('OpenCV not available — video stream metadata was not extracted.')
    except Exception as e:
        logger.warning(f'Video metadata extraction error for {file_path}: {e}')

    return meta


def _fourcc_to_str(fourcc: int) -> str | None:
    """Decode OpenCV's FOURCC integer (e.g. 'avc1'); None when not printable."""
    if not fourcc:
        return None
    text = ''.join(chr((fourcc >> (8 * i)) & 0xFF) for i in range(4)).strip()
    return text if text and text.isprintable() and text.isascii() else None


def extract_basic_metadata(file_path: str, file_name: str, client_mime: str | None = None) -> dict:
    """
    File-level identity measured from the stored bytes: size, detected format
    and MIME type, plus what the filename and the client claimed.
    """
    size_bytes = os.stat(file_path).st_size
    detected = sniff_media_type(file_path)

    extension = os.path.splitext(file_name or '')[1].lower()
    extension_format = EXTENSION_FORMATS.get(extension.lstrip('.'))
    client_mime = (client_mime or '').split(';')[0].strip().lower() or None
    if client_mime == 'application/octet-stream':
        client_mime = None  # the browser's "I don't know", not a claim

    inconsistencies = []
    if detected['format'] is None:
        inconsistencies.append('The file format could not be identified from the file content.')
    else:
        if extension_format and extension_format != detected['format']:
            inconsistencies.append(
                f'Filename extension "{extension}" indicates {extension_format}, '
                f'but the file content is {detected["format"]}.'
            )
        if client_mime and client_mime != detected['mime'] and not _same_mime(client_mime, detected['mime']):
            inconsistencies.append(
                f'The uploading client declared "{client_mime}", '
                f'but the file content is {detected["mime"]}.'
            )

    return {
        'fileName': file_name,
        'fileExtension': extension or None,
        'extensionFormat': extension_format,
        'detectedFormat': detected['format'],
        'mimeType': detected['mime'],
        'clientMimeType': client_mime,
        'fileSizeBytes': size_bytes,
        'fileSizeMB': round(size_bytes / (1024 * 1024), 2),
        'formatMismatch': bool(inconsistencies),
        'inconsistencies': inconsistencies,
    }


def _same_mime(a: str, b: str) -> bool:
    """Treat well-known aliases of one type as equal."""
    aliases = [{'image/jpeg', 'image/jpg', 'image/pjpeg'}, {'video/x-msvideo', 'video/avi', 'video/msvideo'}]
    return any(a in group and b in group for group in aliases)


def merge_file_metadata(stream_meta: dict, basic: dict) -> dict:
    """
    Combine decoder metadata (Pillow / OpenCV) with the byte-level file identity.
    The identity wins where it has a value, and `format` always names the format
    detected from the bytes when one was detected.
    """
    merged = dict(stream_meta)
    merged.update({k: v for k, v in basic.items() if v is not None})
    if basic.get('detectedFormat'):
        merged['format'] = basic['detectedFormat']
    return merged
