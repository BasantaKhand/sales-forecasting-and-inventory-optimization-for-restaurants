"""Flask application factory.

Sets up CORS, JWT, and the MongoDB (PyMongo) connection, then registers all
route blueprints.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient

from .config import Config

# JWT manager is created here and initialised inside the factory.
jwt = JWTManager()


def create_app(config_class=Config):
    """Application factory."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- CORS: allow the React dev server ---
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    # --- JWT ---
    jwt.init_app(app)

    # --- MongoDB (PyMongo) ---
    client = MongoClient(app.config["MONGO_URI"])
    # database name comes from the connection string
    db = client.get_default_database()
    # Store on the app so blueprints/services can reach it.
    app.extensions["pymongo"] = db
    app.mongo_client = client
    app.db = db

    # --- Blueprints ---
    from .routes.auth import auth_bp
    from .routes.sales import sales_bp
    from .routes.forecast import forecast_bp
    from .routes.inventory import inventory_bp
    from .routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(sales_bp, url_prefix="/api/sales")
    app.register_blueprint(forecast_bp, url_prefix="/api/forecast")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    # --- Health check root route ---
    @app.route("/")
    def index():
        return jsonify({"message": "API is running"})

    @app.route("/api/health")
    def health():
        try:
            app.mongo_client.admin.command("ping")
            db_status = "connected"
        except Exception:
            db_status = "disconnected"
        return jsonify({"status": "ok", "database": db_status})

    return app
