  
import os
from flask_admin import Admin
from .models import db, User
from flask_admin.contrib.sqla import ModelView

def setup_admin(app):
    if os.environ.get('ENABLE_FLASK_ADMIN') != '1':
        return None

    secret_key = os.environ.get('FLASK_APP_KEY')
    if not secret_key:
        raise RuntimeError('FLASK_APP_KEY is required when Flask-Admin is enabled')

    app.secret_key = secret_key
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin')

    
    # Add your models here, for example this is how we add a the User model to the admin
    admin.add_view(ModelView(User, db.session))

    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))
    return admin
