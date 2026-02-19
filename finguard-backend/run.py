import uvicorn
import os

if __name__ == "__main__":
    # Development mode only - use gunicorn for production
    reload = os.getenv("ENV", "development") == "development"
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=reload)
