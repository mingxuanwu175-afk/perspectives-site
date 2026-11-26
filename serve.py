"""Local preview server for the Perspectives site.

Run:  python serve.py        then open http://127.0.0.1:8765
      (set PORT to use another port, e.g. when 8765 is taken by the phrase-finder)

Forces correct MIME types (Windows can map .js to text/plain, which breaks
ES modules) and turns off caching so edits show up on reload.
"""
import functools
import http.server
import os
import pathlib

PORT = int(os.environ.get("PORT", "8765"))
ROOT = pathlib.Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".md": "text/plain; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"Serving {ROOT} at http://127.0.0.1:{PORT}")
        httpd.serve_forever()
