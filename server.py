import http.server
import socketserver

PORT = 3333

def run_server(port):
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"HTTP Server Running...\nhttp://localhost:{port}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("HTTP Server Closing...")
            httpd.server_close()

if __name__ == "__main__":
    run_server(port=PORT)
