#!/usr/bin/python3

# Simple web server for testing
# Runs on localhost:8081, change port by supplying required port number on the command line.
import os.path
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

DEFAULT_PORT=8081
if len(sys.argv)==2:
    port = int(sys.argv[2])
else:
    port = DEFAULT_PORT

root_directory = os.path.join(os.path.split(__file__)[0],".")

class CustomHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        kwargs["directory"] = root_directory
        super().__init__(*args, **kwargs)

    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        # Prevent Caching
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

httpd = HTTPServer(('localhost', port), CustomHandler)
print("Serving risk viewer on localhost:%d"%(port))
httpd.serve_forever()