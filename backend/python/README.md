# Pyxis Search Engine Backend

## Installation

Install required Python packages:

```bash
pip install ddgs flask flask-restful
```

## Running the Application

### Development

To run the application in development mode:

```bash
python app.py
```

### Production

For production deployment, use Waitress as a WSGI server. First install Waitress:

```bash
pip install waitress
```

Then run the production server:

```bash
waitress-serve --host=0.0.0.0 --port=5000 app:app
```