import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cok-gizli-bir-anahtar-girmelisin-bu-sadece-test-icin'

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'database/database.db')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False