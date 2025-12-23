import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Flask
from flask_cors import CORS
from backend.models import db
from backend.config import Config

def create_app(config_name='default'):
    app = Flask(__name__)
    
    if config_name == 'testing':
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    else:
        app.config.from_object(Config)
    
    db.init_app(app)
    
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    from backend.blueprints.api import api_bp
    from backend.blueprints.frontend import frontend_bp
    
    app.register_blueprint(api_bp)
    app.register_blueprint(frontend_bp)
    
    # Serve service-worker.js from static folder
    @app.route('/service-worker.js')
    def serve_service_worker():
        from flask import send_from_directory
        return send_from_directory('static', 'service-worker.js', mimetype='application/javascript')
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=False, host='127.0.0.1', port=5000)
