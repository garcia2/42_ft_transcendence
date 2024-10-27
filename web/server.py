from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

class SPAHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        # Serve index.html for all non-file requests
        print("path = '" + self.path + "'")
        if not os.path.exists(self.path[1:]):
            self.path = 'index.html'
        return super().do_GET()

if __name__ == '__main__':
    port = 5000
    server_address = ('', port)
    httpd = HTTPServer(server_address, SPAHTTPRequestHandler)
    print(f"Serving on https://localhost:{port}")
    httpd.serve_forever()

